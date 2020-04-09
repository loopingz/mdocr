#!/usr/bin/env node
import * as dateFormat from "dateformat";
import * as doAsync from "doasync";
import * as fs from "fs";
import * as glob from "glob-fs";
import * as markdownpdf from "markdown-pdf";
import * as fetch from "node-fetch";
import * as nunjucks from "nunjucks";
import * as open from "open";
import * as path from "path";
import * as process from "process";
import * as Router from "router";
import * as semver from "semver";
import * as simpleGit from "simple-git";
import * as yaml from "yaml";

export abstract class TemplateExtension {
  private __name: string;
  public tags: string[];
  public mdocr: MDocrRepository;
  private block: boolean;

  constructor(name: string, tags: string[], isBlock: boolean = false) {
    this.__name = name;
    this.tags = tags;
    this.block = isBlock;
  }

  getName(): string {
    return this.__name;
  }

  parse(parser, nodes, lexer) {
    try {
      // get the tag token
      var tok = parser.nextToken();

      // parse the args and move after the block end. passing true
      // as the second arg is required if there are no parentheses
      var args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value);
      let body = undefined;
      if (this.block) {
        // parse the body and possibly the error block, which is optional
        body = parser.parseUntilBlocks(`end${tok.value}`);
        parser.advanceAfterBlockEnd();
      }

      // See above for notes about CallExtension
      return new nodes.CallExtension(this, "run", args, [body]);
    } catch (err) {
      console.log(err);
    }
  }

  run(context, ...args) {
    try {
      return this._run(context, ...args);
    } catch (err) {
      console.log(err);
    }
  }

  abstract _run(context, ...args);
}

class CurrentVersionExtension extends TemplateExtension {
  constructor() {
    super("CurrentVersion", ["currentVersion"]);
  }

  _run({ ctx: { document } }) {
    if (this.mdocr.buildForRelease() && document.commits.length > 0) {
      return document.nextVersion;
    }
    if (document.isDirty || !document.meta.Versions || document.meta.Versions.length === 0) {
      return document.nextVersion + "-SNAPSHOT";
    } else if (document.meta.Versions) {
      return document.meta.Versions[0].Id;
    }
  }
}

class VersionsTableExtension extends TemplateExtension {
  constructor() {
    super("VersionsTable", ["versionsTable"]);
  }

  _run({ ctx: { document } }) {
    let res = `
| Version | Date       | Authors     | Reviewers    |
|-|-|-|-|
`;
    document.meta.Versions = document.meta.Versions || [];
    let versions = [...document.meta.Versions];
    if (this.mdocr.buildForRelease() && document.commits.length > 0) {
      versions.unshift({
        Id: document.nextVersion,
        Date: dateFormat(Date.now(), "yyyy-mm-dd"),
        Authors: [...new Set(document.commits.map((i) => i.author_name))].sort().join(","), // Creating a unique set of authors
        Reviewer: this.mdocr.getCurrentUser(),
      });
    } else if (document.isDirty) {
      let authors = new Set(document.commits.map((i) => i.author_name));
      authors.add(this.mdocr.getCurrentUser());
      versions.unshift({
        Id: document.nextVersion + "-SNAPSHOT",
        Date: "-",
        Authors: [...authors].sort().join(","), // Creating a unique set of authors
        Reviewer: "N/A",
      });
    }

    versions.forEach((version) => {
      res += `| ${version.Id}     | ${version.Date} | ${version.Authors} | ${version.Reviewer} |\n`;
    });
    return res;
  }
}

export class Document {
  meta: any;
  hasMeta: boolean;
  isDirty: boolean;
  path: string;
  nextVersion: string;
  currentVersion: string;
  changes: {
    insertions: number;
    deletions: number;
    changes: number;
  };
  target: string;
  published: string;
  toPublish: boolean;
  commits: any;

  constructor(filePath: string) {
    this.path = filePath;
  }

  async init(mdocr: MDocrRepository) {
    let absPath = mdocr.getAbsolutePath(this.path);
    this.meta = {
      Versions: [],
    };
    let content = fs.readFileSync(absPath).toString();
    if (content.startsWith("---")) {
      let y = content.substr(3);
      y = y.substr(0, y.indexOf("---"));
      this.meta = yaml.parse(y);
      if (this.meta.Versions) {
        this.meta.Versions.sort((a, b) => {
          return -1 * semver.compare(a.Id, b.Id);
        });
        this.currentVersion = this.meta.Versions[0].Id;
      }
      this.hasMeta = true;
    } else {
      this.hasMeta = false;
    }
    if (!this.meta.Title) {
      let match = content.match(/# ([^\n]*)/);
      if (match) {
        this.meta.Title = match[1];
      }
    }
    let releaseFound = false;
    this.commits = (await mdocr.getCommits(this.path)).filter((i) => {
      if (i.release) {
        releaseFound = true;
      }
      return !releaseFound;
    });
    this.isDirty = this.commits.length > 0;
    this.nextVersion = await mdocr.getNextVersion(this);
    let rootPath = mdocr.getRootPath();
    let config = mdocr.getConfig();
    this.target = path.relative(rootPath, path.normalize(this.path.replace(/.[^\/]*/, config.buildDir)));
    this.published = path.relative(rootPath, path.normalize(this.path.replace(/.[^\/]*/, config.publishedDir)));
    return this;
  }

  static async new(path: string, mdocr: MDocrRepository): Promise<Document> {
    let file = new Document(path);
    await file.init(mdocr);
    return file;
  }
}

/**
 * Main Class for MDocs
 */
export default class MDocrRepository {
  protected rootPath: string;
  protected git: any;
  protected cssPath: string;
  protected cssContent: string;
  protected publishers: any[] = [];
  protected buildContext: any = {};
  // Keep 3 differents maps of Document
  protected targets: { [key: string]: Document } = {};
  protected gitFiles: { [key: string]: Document } = {};
  protected files: { [key: string]: Document } = {};
  protected config: any = {};
  protected currentUser: string;
  protected releasing: boolean = false;
  protected increment: number = 0;
  protected nunjucks: any;
  npmRegistry: any;
  /**
   *
   * @param rootPath Path to the git repository of documents
   */
  constructor(config: any = {}) {
    this.rootPath = path.resolve(path.normalize(config.rootPath || process.cwd()));
    // Initiate our Git client
    this.git = doAsync(simpleGit(this.rootPath));
    // Read package.json from the repository
    let packageInfo: any = {};
    if (fs.existsSync(this.rootPath + "/package.json")) {
      packageInfo = JSON.parse(fs.readFileSync(this.rootPath + "/package.json").toString());
    }
    packageInfo.mdocr = packageInfo.mdocr || {};
    this.config = { ...packageInfo.mdocr, ...config };
    this.config.files = this.config.files || packageInfo.files || ["./drafts/**/*.md"];
    this.config.files = this.config.files.map((f) => {
      if (!f.startsWith("/")) {
        return path.join(this.rootPath, f);
      }
      return f;
    });
    this.config.buildDir = path.normalize(this.config.buildDir || "build/");
    this.config.publishedDir = path.normalize(path.join(this.rootPath, this.config.publishedDir || "published/"));
    if (this.config.pdf) {
      this.publishers.push(this.pdf.bind(this));
    }

    this.cssPath = path.join(this.rootPath, "mdocr.css");
    if (!fs.existsSync(this.cssPath)) {
      this.cssPath = path.join(__dirname, "..", "mdocr.css");
    }
    this.cssContent = fs.readFileSync(this.cssPath).toString();
    this.nunjucks = nunjucks.configure(this.rootPath, { autoescape: true });
    this.addTemplateExtension(new CurrentVersionExtension());
    this.addTemplateExtension(new VersionsTableExtension());
  }

  getAbsolutePath(filePath) {
    return path.join(this.rootPath, filePath);
  }

  addPublisher(pub) {
    this.publishers.push(pub);
  }

  async init(message: string = undefined) {
    if (!this.currentUser) {
      this.currentUser = (await this.git.raw(["config", "--get", "user.name"])).trim();
    }
    if (message) {
      this.increment = this.getVersionIncrement(message);
    } else {
      this.increment = 1;
    }
    let cwd = process.cwd();
    process.chdir(this.rootPath);
    try {
      let files = this.config.files
        .map((file) => {
          return glob({ gitignore: true }).readdirSync(path.relative(".", file)).join("|");
        })
        .join("|") // Starting in NodeJS >= 11 can use flat
        .split("|");
      let status = (await this.git.status()).files.map((i) => i.path);
      for (let i in files) {
        let doc = await Document.new(path.relative(this.rootPath, files[i]), this);
        this.files[this.getAbsolutePath(doc.path)] = doc;
        this.targets[doc.target] = this.gitFiles[doc.path] = doc;
        if (status.indexOf(doc.path) >= 0) {
          doc.isDirty = true;
        }
      }
    } finally {
      process.chdir(cwd);
    }
  }

  async processFile(file: Document) {
    try {
      this.buildContext.document = file;
      return this.nunjucks.render(file.path, this.buildContext);
    } catch (err) {
      console.log(err);
      return "";
    }
  }

  addTemplateExtension(ext: TemplateExtension) {
    ext.mdocr = this;
    this.nunjucks.addExtension(ext.getName(), ext);
  }

  addTemplateFilter(name: string, fct: any, asyncFct: boolean = false) {
    this.nunjucks.addFilter(name, fct, asyncFct);
  }

  addBuildContext(ctx: any) {
    this.buildContext = { ...this.buildContext, ...ctx };
  }

  getSourceFromTarget(target): Document {
    if (path.isAbsolute(target)) {
      target = path.relative(this.rootPath, target);
    }
    return this.targets[target];
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async getDocumentVersion(src) {
    let Authors = [...new Set(src.commits.map((i) => i.author_name))].sort().join(",");
    if (Authors.length === 0) {
      Authors = this.getCurrentUser();
    }
    return {
      Id: src.nextVersion,
      Date: dateFormat(Date.now(), "yyyy-mm-dd"),
      Authors,
      Reviewer: this.getCurrentUser(),
    };
  }

  buildForRelease() {
    return this.releasing;
  }

  getRootPath() {
    return this.rootPath;
  }

  isIncludedInFiles(file) {
    return this.gitFiles[file] !== undefined;
  }

  async isDirty() {
    let status = await this.git.status();
    if (status.files.filter((i) => this.isIncludedInFiles(i.path)).length > 0) {
      return true;
    }
    return false;
  }

  async publish(preview = false, file: string = undefined) {
    if (await this.isDirty()) {
      console.log("You need to work from a clean repository, stash your changes");
      return false;
    }
    this.releasing = true;
    await this.build((...args) => {}, file);
    this.releasing = false;
    let status = await this.git.status();
    let files = status.files
      .filter((f) => {
        return f.path.startsWith(this.config.buildDir);
      })
      .map((i) => i.path);
    for (let i in files) {
      let src = this.getSourceFromTarget(files[i]);
      console.log("Updating", src.path, "with", src.nextVersion);
      if (preview) {
        continue;
      }
      src.meta.Versions = src.meta.Versions || [];
      src.meta.Versions.unshift(await this.getDocumentVersion(src));
      src.isDirty = false;
      src.toPublish = true;
      let y = yaml.stringify(src.meta);
      let absPath = this.getAbsolutePath(src.path);
      if (src.hasMeta) {
        fs.writeFileSync(
          absPath,
          fs
            .readFileSync(absPath)
            .toString()
            .replace(/---[\s\S]*---/, `---\n${y}---`)
        );
      } else {
        fs.writeFileSync(absPath, `---\n${y}---\n` + fs.readFileSync(absPath).toString());
      }
    }
    if (preview) {
      return true;
    }
    // Rebuild with new versions added
    await this.build((...args) => {}, file);
    // Add all files and commit
    status.files
      .filter((f) => {
        return f.path.startsWith(this.config.buildDir);
      })
      .map((i) => i.path);
    let commitsMsg = ["release:", ""];
    let tags = [];
    for (let i in files) {
      let src = this.getSourceFromTarget(files[i]);
      commitsMsg.push(` - ${path.basename(src.path)}@${src.nextVersion}`);
      tags.push(path.basename(src.path).replace(/\.md/, "") + "-" + src.nextVersion);
      await this.git.add([src.path, files[i]]);
    }
    await this.git.commit(commitsMsg.join("\n"));
    for (let i in tags) {
      await this.git.addTag(tags[i]);
    }
    await this.postpublish(true);
    return true;
  }

  async getNextVersion(file: Document) {
    let commits = file.commits || [];
    let versions = file.meta.Versions || [];
    let incr = Math.max(...commits.map((i) => i.incr), this.getGlobalIncrement());
    let nextVersion = "1.0.0";
    if (versions.length) {
      nextVersion = versions[0].Id;
      switch (incr) {
        case 100:
          nextVersion = semver.inc(nextVersion, "major");
          break;
        case 10:
          nextVersion = semver.inc(nextVersion, "minor");
          break;
        default:
          nextVersion = semver.inc(nextVersion, "patch");
      }
    }
    return nextVersion;
  }

  getConfig() {
    return this.config;
  }

  async getCommits(file, from = ""): Promise<any[]> {
    let commits = (
      await this.git.log({
        file,
        from,
      })
    ).all.map((c) => {
      c.incr = this.getVersionIncrement(c.message);
      c.release = c.message.startsWith("release:");
      return c;
    });
    return commits;
  }

  getVersionIncrement(message) {
    let incr = 1;
    if (message.indexOf("BREAKING") >= 0) {
      incr = 100;
    } else if (message.startsWith("feat:") || message.startsWith("feature:") || message.startsWith("feat(")) {
      incr = 10;
    }
    if (message.startsWith("release:")) {
      incr = 1;
    }
    return incr;
  }

  async previewer(str, type: string = "pdf") {
    const through = require("through");
    let html;
    let pdf = await new Promise((resolve) => {
      markdownpdf({
        preProcessHtml: () => {
          return through(function (data) {
            html = data.toString();
            this.queue(data);
          });
        },
        cssPath: this.cssPath,
        remarkable: {
          preset: "commonmark",
          plugins: [require("remarkable-plantuml"), require("remarkable-meta")],
          syntax: ["table"],
        },
      })
        .from.string(str)
        .to.buffer({}, (err, data) => {
          resolve(data);
        });
    });
    if (type === "html") {
      return `<style>${this.cssContent}</style>${html}` || "";
    }
    return pdf;
  }

  async pdf(file) {
    const through = require("through");
    let html;

    await new Promise((resolve) => {
      markdownpdf({
        preProcessHtml: () => {
          return through(function (data) {
            html = data.toString();
            this.queue(data);
          });
        },
        cssPath: this.cssPath,
        remarkable: {
          preset: "commonmark",
          plugins: [require("remarkable-plantuml"), require("remarkable-meta")],
          syntax: ["table"],
        },
      })
        .from(this.getAbsolutePath(file.target))
        .to(this.getAbsolutePath(file.published).replace(/\.md/, ".pdf"), resolve);
    });
    fs.writeFileSync(file.published.replace(/\.md/, ".html"), `<style>${this.cssContent}</style>${html}`);
    return;
  }

  getGlobalIncrement() {
    return this.increment;
  }

  async build(log = console.log, file: string = undefined) {
    // Get all files -> a bit dirty
    let summary = await this.git.diffSummary();
    summary.files.forEach((f) => {
      if (this.files[f.file]) {
        let { insertions, deletions, changes } = f;
        this.files[f.file].changes = { insertions, deletions, changes };
      }
    });
    for (let i in this.files) {
      if (file && this.files[i].path !== file && this.files[i].target !== file) {
        continue;
      }
      log("Processing", this.files[i].path, "to", this.files[i].target);
      let absPath = this.getAbsolutePath(this.files[i].target);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, await this.processFile(this.files[i]));
    }
  }

  async getRemoteRepository() {
    try {
      return (await this.git.listRemote(["--get-url"])).trim();
    } catch (err) {
      return "";
    }
  }

  async postpublish(onlyPublish: boolean = false, file: string = undefined) {
    for (let i in this.files) {
      let src = this.files[i];
      if (onlyPublish && !src.toPublish) {
        continue;
      }
      console.log("Processing", src.target, "to", src.published);
      fs.mkdirSync(path.dirname(src.published), { recursive: true });
      await Promise.all(this.publishers.map((f) => f(src)));
    }
  }

  async getLatest() {
    if (this.npmRegistry) {
      return this.npmRegistry;
    }
    let res = await fetch("https://registry.npmjs.org/mdocr");
    this.npmRegistry = (await res.json())["dist-tags"].latest;
    return this.npmRegistry;
  }

  async removeFile(path) {
    let doc = this.gitFiles[path];
    if (!doc) {
      return;
    }
    let toRemove = ["path", "target", "published"];
    for (let i in toRemove) {
      let abs = this.getAbsolutePath(doc[toRemove[i]]);
      if (fs.existsSync(abs)) {
        await this.git.rm(doc[toRemove[i]]);
      }
    }
    this.gitFiles[doc.path] = undefined;
    this.targets[doc.target] = undefined;
    this.files[this.getAbsolutePath(doc.path)] = undefined;
  }

  async edit(url = "https://mdocr.loopingz.com") {
    let packageInfo = require("../package.json");
    return new Promise((resolve) => {
      const http = require("http");
      const router = Router({ mergeParams: true });

      const sendMdocrStatus = async (res) => {
        res.write(
          JSON.stringify({
            files: this.files,
            version: packageInfo.version,
            latest: await this.getLatest(),
            path: this.rootPath,
            isDirty: await this.isDirty(),
            repository: await this.getRemoteRepository(),
          })
        );
        res.end();
      };

      // Default git operations
      router
        .route("/release")
        .get(async (req, res) => {
          let commits = (await this.git.log()).all;
          let hash = "";
          for (let i in commits) {
            hash = commits[i].hash;
            if (commits[i].message.startsWith("release:")) {
              break;
            }
          }

          res.writeHead(200, {
            "Content-Type": "text/plain",
          });
          await this.init();
          this.releasing = true;
          await this.build((...args) => {});
          this.releasing = false;
          res.write(await this.git.diff([hash]));
          res.end();
        })
        .put(async (req, res) => {
          await this.init();
          await this.publish();
          res.end();
        });
      router.put("/commit", async (req, res) => {
        const { body } = req.params;
        let params: any = JSON.parse(await body);
        await this.init(params.message);
        await this.build((...args) => {});
        let status = await this.git.diffSummary();
        for (let i in status.files) {
          await this.git.add(status.files[i].file);
        }
        await this.git.commit(params.message);
        res.end();
      });
      router.get("/changes", async (req, res) => {
        let match = req.url.match(/\/changes\?.*incr=(\d+)/) || ["", ""];
        let msg = "fix:";
        if (match[1] == 100) {
          msg = "BREAKING";
        } else if (match[1] == 10) {
          msg = "feat:";
        }
        res.writeHead(200, {
          "Content-Type": "text/plain",
        });
        await this.init(msg);
        await this.build((...args) => {});
        res.write(await this.git.diff());
        res.end();
      });

      // MDocr information
      router.get("/stop", async (req, res) => {
        res.write(JSON.stringify({ message: "Bye!" }));
        res.end();
        resolve();
      });
      router.get("/mdocr", async (req, res) => {
        await this.init();
        await sendMdocrStatus(res);
      });

      // Files operation
      router
        .route("/:type/*")
        .get(async (req, res) => {
          const { type, "0": path } = req.params;
          let doc = this.gitFiles[path];
          if (!doc) {
            res.writeHead(404);
            res.end();
            return;
          }
          if (type === "drafts") {
            res.writeHead(200, {
              "Content-Type": "text/plain",
            });
            res.write(fs.readFileSync(this.getAbsolutePath(doc.path)));
          } else if (type === "build") {
            res.writeHead(200, {
              "Content-Type": "text/plain",
            });
            res.write(await this.processFile(doc));
          } else if (type === "pdf") {
            res.writeHead(200, {
              "Content-Type": "application/octet-stream",
            });
            res.write(await this.previewer(await this.processFile(doc)));
          } else if (type === "html") {
            res.writeHead(200, {
              "Content-Type": "text/html",
            });
            res.write(await this.previewer(await this.processFile(doc), "html"));
          } else {
            res.writeHead(404);
          }
          res.end();
        })
        .put(async (req, res) => {
          const { "0": path, body } = req.params;
          if (this.gitFiles[path]) {
            let doc = this.gitFiles[path];
            fs.writeFileSync(this.getAbsolutePath(doc.path), await body);
          } else {
            res.writeHead(404);
          }
          res.end();
        })
        .delete(async (req, res) => {
          const { "0": path, type } = req.params;
          if (type !== "drafts") {
            res.writeHead(400);
            res.end();
            return;
          }
          if (this.gitFiles[path]) {
            await this.removeFile(path);
            await sendMdocrStatus(res);
          } else {
            res.writeHead(404);
          }
          res.end();
        })
        .post(async (req, res) => {
          const { "0": file, type, body } = req.params;
          let { title } = JSON.parse(await body);
          let absPath = this.getAbsolutePath(file);
          if (type !== "drafts") {
            res.writeHead(400);
            res.end();
            return;
          }
          if (fs.existsSync(absPath)) {
            res.writeHead(409);
            res.end();
          } else {
            fs.writeFileSync(
              absPath,
              `---
Title: ${title}
---

# ${title}
`
            );
            await this.git.add(file);
            let doc = await Document.new(file, this);
            this.gitFiles[doc.path] = this.targets[doc.target] = this.files[absPath] = doc;
            await sendMdocrStatus(res);
          }
        });

      // Main server
      http
        .createServer(async (req, res) => {
          if (req.method === "OPTIONS") {
            res.writeHead(200, {
              "Content-Type": "text/plain",
              "Access-Control-Allow-Origin": url,
              "Access-Control-Allow-Methods": "GET,PUT,OPTIONS,POST,DELETE",
            });
            res.end();
            return;
          }
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", url);
          setTimeout(() => res.end(), 60000);
          let reqBody = "";
          req.params = {
            body: new Promise((resolve) => {
              req.on("data", (chunk) => {
                reqBody += chunk.toString(); // convert Buffer to string
              });
              req.on("end", () => {
                resolve(reqBody);
              });
            }),
          };
          router(req, res, () => {
            res.writeHead(404);
            res.end();
          });
        })
        .listen(18181);
    });
  }

  static async commandLine() {
    let drepo = new MDocrRepository();
    if (!fs.existsSync(".git")) {
      console.log("Should be run only in repository root");
      return 1;
    }

    require("yargs")
      .command({
        command: "build [file]",
        builder: (yargs) => yargs.string("message"),
        desc: "Build all markdowns or specific file running all commands",
        handler: async (argv) => {
          await drepo.init(argv.message);
          await drepo.build(console.log, argv.file);
        },
      })
      .command({
        command: "publish [file]",
        builder: (yargs) => yargs.boolean("pretend"),
        desc: "Generate new versions for all updated documents or selected file ",
        handler: async (argv) => {
          await drepo.init();
          await drepo.publish(argv.pretend, argv.file);
        },
      })
      .command({
        command: "postpublish [file]",
        desc: "Execute post processors on all documents or selected file ",
        handler: async (argv) => {
          await drepo.init();
          await drepo.build((...args) => {}, argv.file);
          await drepo.postpublish(argv.file);
        },
      })
      .command({
        command: "edit",
        builder: (yargs) => yargs.string("url"),
        desc: "Launch the editor",
        handler: async (argv) => {
          argv.url = argv.url || "https://mdocr.loopingz.com";
          await drepo.init();
          open(argv.url);
          await drepo.edit(argv.url);
        },
      })
      .demandCommand()
      .help()
      .wrap(120).argv;
  }
}

if (require.main === module) {
  MDocrRepository.commandLine();
}

export { MDocrRepository, MDocrRepository as MDocsRepository };
