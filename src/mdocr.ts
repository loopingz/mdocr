#!/usr/bin/env node
import * as fs from "fs";
import * as markdownpdf from "markdown-pdf";
import * as parse5 from "parse5";
import * as semver from "semver";
import * as glob from "glob-fs";
import * as path from "path";
import * as simpleGit from "simple-git";
import * as util from "util";
import * as doAsync from "doasync";
import * as yaml from "yaml";
import * as mkdirp from "mkdirp";
import * as dateFormat from "dateformat";
import * as process from "process";
import * as nunjucks from "nunjucks";
import * as open from "open";

async function Import(cmd, ctx, mdocr) {
  let file = path.dirname(ctx.absPath) + "/" + cmd.arguments.file;
  if (fs.existsSync(file)) {
    return await mdocr.processContent(fs.readFileSync(file).toString(), ctx);
  }
}

async function CurrentVersion(cmd, ctx, mdocr) {
  if (mdocr.buildForRelease() && ctx.commits.length > 0) {
    return ctx.nextVersion;
  }
  if (ctx.isDirty || !ctx.meta.Versions) {
    return ctx.nextVersion + "-SNAPSHOT";
  } else if (ctx.meta.Versions) {
    return ctx.meta.Versions[0].Id;
  }
}

async function VersionsTable(cmd, ctx, mdocr) {
  let res = `
| Version | Date       | Authors     | Reviewers    |
|-|-|-|-|
`;
  ctx.meta.Versions = ctx.meta.Versions || [];
  let versions = [...ctx.meta.Versions];

  if (mdocr.buildForRelease() && ctx.commits.length > 0) {
    versions.unshift({
      Id: ctx.nextVersion,
      Date: dateFormat(Date.now(), "yyyy-mm-dd"),
      Authors: [...new Set(ctx.commits.map(i => i.author_name))].join(","), // Creating a unique set of authors
      Reviewer: mdocr.getCurrentUser()
    });
  } else if (ctx.isDirty) {
    let authors = new Set(ctx.commits.map(i => i.author_name));
    authors.add(mdocr.getCurrentUser());
    versions.unshift({
      Id: ctx.nextVersion + "-SNAPSHOT",
      Date: "-",
      Authors: [...authors].join(","), // Creating a unique set of authors
      Reviewer: "N/A"
    });
  }

  versions.forEach(version => {
    res += `| ${version.Id}     | ${version.Date} | ${version.Authors} | ${version.Reviewer} |\n`;
  });
  return res;
}

export abstract class TemplateExtension {
  private name: string;
  public tags: string[];

  constructor(name: string, tags: string[]) {
    this.name = name;
    this.tags = tags;
  }

  getName(): string {
    return this.name;
  }

  abstract parse(parser, nodes, lexer);

  abstract run(context, url, body, errorBody);
}

//analyse({ path: "drafts/policies/acceptable-usage-policy.md" });
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
  protected commands: any = {
    Import,
    CurrentVersion,
    VersionsTable
  };
  protected targets: any = {};
  protected gitFiles: any = {};
  protected files: any = {};
  protected config: any = {};
  protected currentUser: string;
  protected releasing: boolean = false;
  protected increment: number = 0;
  protected nunjucks: any;
  /**
   *
   * @param rootPath Path to the git repository of documents
   */
  constructor(config: any = {}) {
    this.rootPath = path.resolve(
      path.normalize(config.rootPath || process.cwd())
    );
    // Initiate our Git client
    this.git = doAsync(simpleGit(this.rootPath));
    // Read package.json from the repository
    let packageInfo: any = {};
    if (fs.existsSync(this.rootPath + "/package.json")) {
      packageInfo = JSON.parse(
        fs.readFileSync(this.rootPath + "/package.json").toString()
      );
    }
    packageInfo.mdversionflow = packageInfo.mdversionflow || {};
    this.config = { ...packageInfo.mdversionflow, ...config };
    this.config.files = this.config.files ||
      packageInfo.files || ["./drafts/**/*.md"];
    this.config.files = this.config.files.map(f => {
      if (!f.startsWith("/")) {
        return path.join(this.rootPath, f);
      }
      return f;
    });
    this.config.buildDir = path.normalize(this.config.buildDir || "build/");
    this.config.publishedDir = path.normalize(
      path.join(this.rootPath, this.config.publishedDir || "published/")
    );
    if (this.config.pdf) {
      this.publishers.push(this.pdf.bind(this));
    }

    this.cssPath = path.join(this.rootPath, "mdocr.css");
    if (!fs.existsSync(this.cssPath)) {
      this.cssPath = path.join(__dirname, "..", "mdocr.css");
    }
    this.cssContent = fs.readFileSync(this.cssPath).toString();
    this.nunjucks = nunjucks.configure({ autoescape: true });
  }

  addCommand(command, plugin) {
    this.commands[command] = plugin;
  }

  addPublisher(pub) {
    this.publishers.push(pub);
  }

  async init(message: string = undefined) {
    if (!this.currentUser) {
      this.currentUser = (await this.git.raw([
        "config",
        "--get",
        "user.name"
      ])).trim();
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
        .map(file => {
          return glob({ gitignore: true })
            .readdirSync(path.relative(".", file))
            .join("|");
        })
        .join("|")
        .split("|");
      let status = (await this.git.status()).files.map(i => i.path);
      for (let i in files) {
        this.files[files[i]] = await this.analyse(files[i]);

        if (status.indexOf(this.files[files[i]].gitPath) >= 0) {
          this.files[files[i]].isDirty = true;
        }

        this.targets[this.files[files[i]].gitTarget] = files[i];
        this.gitFiles[this.files[files[i]].gitPath] = files[i];
      }
    } finally {
      process.chdir(cwd);
    }
  }

  async analyse(filePath) {
    let file: any = {
      path: filePath,
      absPath: path.resolve(filePath)
    };
    if (filePath.startsWith(this.rootPath + "/")) {
      file.gitPath = filePath.substr(this.rootPath.length + 1);
    } else {
      file.gitPath = filePath;
    }
    let foundRelease = false;
    file.meta = {};
    let content = fs.readFileSync(file.absPath).toString();
    if (content.startsWith("---")) {
      let y = content.substr(3);
      y = y.substr(0, y.indexOf("---"));
      file.meta = yaml.parse(y);
      if (file.meta.Versions) {
        file.meta.Versions.sort((a, b) => {
          return -1 * semver.compare(a.Id, b.Id);
        });
      }
      file.hasMeta = true;
    } else {
      file.hasMeta = false;
    }
    if (!file.meta.Title) {
      let match = content.match(/# ([^\n]*)/);
      if (match) {
        file.meta.Title = match[1];
      }
    }
    file.commits = (await this.getCommits(file.gitPath)).filter(i => {
      if (i.release) {
        foundRelease = true;
      }
      return !foundRelease;
    });
    file.isDirty = file.commits.length > 0;
    file.nextVersion = await this.getNextVersion(file);
    file.gitTarget = path.normalize(
      file.gitPath.replace(/.[^\/]*/, this.config.buildDir)
    );
    file.target = path.join(this.rootPath, file.gitTarget);
    file.gitPublished = path.normalize(
      file.gitPath.replace(/.[^\/]*/, this.config.publishedDir)
    );
    file.published = path.join(this.rootPath, file.gitPublished);
    return file;
  }

  async processFile(file) {
    return this.processContent(fs.readFileSync(file.absPath).toString(), file);
  }

  async processContent(str, file) {
    let result = "";
    let command;
    let res;
    // Remove Markdown metadata by default
    if (!this.config.keepMeta) {
      if (str.startsWith("---")) {
        str = str.substr(3);
        str = str.substr(str.indexOf("---") + 3);
      }
    }
    // TODO Move to nunjucks template engine: https://mozilla.github.io/nunjucks/
    while ((res = str.search(/<[^>]*>/)) >= 0) {
      result += str.substr(0, res);
      str = str.substr(res + 1);
      let fullTag = str.substr(0, str.indexOf(">"));
      let autoClose = fullTag.endsWith("/");
      let tagName;
      if (fullTag.indexOf(" ") >= 0) {
        tagName = fullTag.substr(0, fullTag.indexOf(" "));
      } else {
        tagName = fullTag;
      }
      if (autoClose) {
        fullTag = fullTag.substr(0, fullTag.length - 1);
        // Auto closing tag
        command = `<${fullTag}></${tagName}>`;
        str = str.substr(fullTag.length + 2); // Skiping the tag
      } else {
        command =
          "<" + str.substr(0, str.indexOf(`</${tagName}>`)) + `</${tagName}>`;
        str = str.substr(command.length);
      }
      if (this.commands[tagName]) {
        let cmd = parse5.parseFragment(command);
        if (cmd.childNodes.length) {
          cmd = cmd.childNodes[0];
          cmd.arguments = {};
          cmd.attrs.forEach(a => (cmd.arguments[a.name] = a.value));
          result += (await this.commands[tagName](cmd, file, this)) || "";
        }
      }
    }
    result += str;
    try {
      this.buildContext.document = file;
      return this.nunjucks.renderString(result, this.buildContext);
    } catch (err) {
      console.log(err);
      return result;
    }
  }

  addTemplateExtension(ext: TemplateExtension) {
    this.nunjucks.addExtension(ext.getName(), ext);
  }

  addTemplateFilter(name: string, fct: any, asyncFct: boolean = false) {
    this.nunjucks.addFilter(name, fct, asyncFct);
  }

  addBuildContext(ctx: any) {
    this.buildContext = { ...this.buildContext, ...ctx };
  }

  getSourceFromTarget(target) {
    return this.files[this.targets[target]];
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async getDocumentVersion(src) {
    let Authors = [...new Set(src.commits.map(i => i.author_name))].join(",");
    if (Authors.length === 0) {
      Authors = this.getCurrentUser();
    }
    return {
      Id: src.nextVersion,
      Date: dateFormat(Date.now(), "yyyy-mm-dd"),
      Authors,
      Reviewer: this.getCurrentUser()
    };
  }

  buildForRelease() {
    return this.releasing;
  }

  isIncludedInFiles(file) {
    return this.gitFiles[file] !== undefined;
  }

  async isDirty() {
    let status = await this.git.status();
    if (status.files.filter(i => this.isIncludedInFiles(i.path)).length > 0) {
      return true;
    }
    return false;
  }

  async publish(preview = false, file: string = undefined) {
    if (await this.isDirty()) {
      console.log(
        "You need to work from a clean repository, stash your changes"
      );
      return false;
    }
    this.releasing = true;
    await this.build((...args) => {}, file);
    this.releasing = false;
    let status = await this.git.status();
    let files = status.files
      .filter(f => {
        return f.path.startsWith(this.config.buildDir);
      })
      .map(i => i.path);
    for (let i in files) {
      let src = this.getSourceFromTarget(files[i]);
      console.log("Updating", src.gitPath, "with", src.nextVersion);
      if (preview) {
        continue;
      }
      src.meta.Versions = src.meta.Versions || [];
      src.meta.Versions.unshift(await this.getDocumentVersion(src));
      src.isDirty = false;
      src.toPublish = true;
      let y = yaml.stringify(src.meta);
      if (src.hasMeta) {
        fs.writeFileSync(
          src.absPath,
          fs
            .readFileSync(src.absPath)
            .toString()
            .replace(/---[\s\S]*---/, `---\n${y}---`)
        );
      } else {
        fs.writeFileSync(
          src.absPath,
          `---\n${y}---\n` + fs.readFileSync(src.absPath).toString()
        );
      }
    }
    if (preview) {
      return true;
    }
    // Rebuild with new versions added
    await this.build((...args) => {}, file);
    // Add all files and commit
    status.files
      .filter(f => {
        return f.path.startsWith(this.config.buildDir);
      })
      .map(i => i.path);
    let commitsMsg = ["release:", ""];
    let tags = [];
    for (let i in files) {
      let src = this.getSourceFromTarget(files[i]);
      commitsMsg.push(` - ${path.basename(src.gitPath)}@${src.nextVersion}`);
      tags.push(
        path.basename(src.gitPath).replace(/\.md/, "") + "-" + src.nextVersion
      );
      await this.git.add([src.gitPath, files[i]]);
    }
    await this.git.commit(commitsMsg.join("\n"));
    for (let i in tags) {
      await this.git.addTag(tags[i]);
    }
    await this.postpublish(true);
    return true;
  }

  async getNextVersion(file) {
    let commits = file.commits || [];
    let versions = file.meta.Versions || [];
    let incr = Math.max(...commits.map(i => i.incr), this.getGlobalIncrement());
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

  async getCommits(file, from = ""): Promise<any[]> {
    let commits = (await this.git.log({
      file,
      from
    })).all.map(c => {
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
    } else if (
      message.startsWith("feat:") ||
      message.startsWith("feature:") ||
      message.startsWith("feat(")
    ) {
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
    let pdf = await new Promise(resolve => {
      markdownpdf({
        preProcessHtml: () => {
          return through(function(data) {
            html = data.toString();
            this.queue(data);
          });
        },
        cssPath: this.cssPath,
        remarkable: {
          preset: "commonmark",
          plugins: [require("remarkable-plantuml"), require("remarkable-meta")],
          syntax: ["table"]
        }
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

    await new Promise(resolve => {
      markdownpdf({
        preProcessHtml: () => {
          return through(function(data) {
            html = data.toString();
            this.queue(data);
          });
        },
        cssPath: this.cssPath,
        remarkable: {
          preset: "commonmark",
          plugins: [require("remarkable-plantuml"), require("remarkable-meta")],
          syntax: ["table"]
        }
      })
        .from(file.target)
        .to(file.published.replace(/\.md/, ".pdf"), resolve);
    });
    fs.writeFileSync(
      file.published.replace(/\.md/, ".html"),
      `<style>${this.cssContent}</style>${html}`
    );
    return;
  }

  getGlobalIncrement() {
    return this.increment;
  }

  async build(log = console.log, file: string = undefined) {
    // Get all files -> a bit dirty
    let summary = await this.git.diffSummary();
    summary.files.forEach(f => {
      if (this.files[f.file]) {
        let { insertions, deletions, changes } = f;
        this.files[f.file].changes = { insertions, deletions, changes };
      }
    });
    for (let i in this.files) {
      if (
        file &&
        this.files[i].path !== file &&
        this.files[i].target !== file
      ) {
        continue;
      }
      log("Processing", this.files[i].path, "to", this.files[i].target);
      mkdirp.sync(path.dirname(this.files[i].target));
      fs.writeFileSync(
        this.files[i].target,
        await this.processFile(this.files[i])
      );
    }
  }

  async postpublish(onlyPublish: boolean = false, file: string = undefined) {
    for (let i in this.files) {
      let src = this.files[i];
      if (onlyPublish && !src.toPublish) {
        continue;
      }
      console.log("Processing", src.gitTarget, "to", src.gitPublished);
      mkdirp.sync(path.dirname(src.published));
      await Promise.all(this.publishers.map(f => f(src)));
    }
  }

  async edit(url = "https://mdocr.loopingz.com") {
    let packageInfo = require("../package.json");
    return new Promise(resolve => {
      const http = require("http");
      http
        .createServer(async (req, res) => {
          let body = "";
          await new Promise(resolve => {
            req.on("data", chunk => {
              body += chunk.toString(); // convert Buffer to string
            });
            req.on("end", () => {
              resolve();
            });
          });
          console.log("REQUEST", req.method, req.url);
          // TODO Add referer checks
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": url
          });
          if (req.method === "GET") {
            if (req.url.startsWith("/release")) {
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
                "Access-Control-Allow-Origin": url
              });
              await this.init();
              this.releasing = true;
              await this.build((...args) => {});
              this.releasing = false;
              res.write(await this.git.diff([hash]));
            } else if (req.url.startsWith("/changes")) {
              let match = req.url.match(/\/changes\?.*incr=(\d+)/) || ["", ""];
              let msg = "fix:";
              if (match[1] == 100) {
                msg = "BREAKING";
              } else if (match[1] == 10) {
                msg = "feat:";
              }
              res.writeHead(200, {
                "Content-Type": "text/plain",
                "Access-Control-Allow-Origin": url
              });
              await this.init(msg);
              await this.build((...args) => {});
              res.write(await this.git.diff());
            } else if (req.url === "/stop") {
              res.write(JSON.stringify({ message: "Bye!" }));
              res.end();
              resolve();
            } else if (req.url === "/mdocr") {
              await this.init();
              res.write(
                JSON.stringify({
                  files: this.files,
                  version: packageInfo.version,
                  path: this.rootPath,
                  isDirty: await this.isDirty(),
                  repository: "git://..."
                })
              );
            } else {
              let match = req.url.match(/\/(\w+)\/(.*)/);
              if (match && this.files[match[2]]) {
                let file = this.files[match[2]];
                if (match[1] === "drafts") {
                  res.writeHead(200, {
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": url
                  });
                  res.write(fs.readFileSync(file.absPath));
                } else if (match[1] === "build") {
                  res.writeHead(200, {
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": url
                  });
                  res.write(await this.processFile(file));
                } else if (match[1] === "pdf") {
                  res.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Access-Control-Allow-Origin": url
                  });
                  res.write(await this.previewer(await this.processFile(file)));
                } else if (match[1] === "html") {
                  res.writeHead(200, {
                    "Content-Type": "text/html",
                    "Access-Control-Allow-Origin": url
                  });
                  res.write(
                    await this.previewer(await this.processFile(file), "html")
                  );
                }
              } else {
                res.writeHead(404);
              }
            }
          } else if (req.method === "PUT") {
            if (req.url === "/release") {
              await this.init();
              await this.publish();
            } else if (req.url === "/commit") {
              /**
              {
                message: ""
              }
               */
              let params: any = JSON.parse(body);
              await this.init(params.message);
              await this.build((...args) => {});
              let status = await this.git.diffSummary();
              for (let i in status.files) {
                await this.git.add(status.files[i].file);
              }
              await this.git.commit(params.message);
            } else {
              let match = req.url.match(/\/(\w+)\/(.*)/);
              if (match && this.files[match[2]]) {
                let file = this.files[match[2]];
                fs.writeFileSync(file.absPath, body);
              } else {
                res.writeHead(404);
              }
            }
          } else if (req.method === "OPTIONS") {
            // Always let throught the OPTIONS for now
            res.writeHead(200, {
              "Content-Type": "text/plain",
              "Access-Control-Allow-Origin": url,
              "Access-Control-Allow-Methods": "GET,PUT,OPTIONS,POST,DELETE"
            });
          } else {
            res.writeHead(404);
          }
          res.end();
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
        builder: yargs => yargs.string("message"),
        desc: "Build all markdowns or specific file running all commands",
        handler: async argv => {
          await drepo.init(argv.message);
          await drepo.build(console.log, argv.file);
        }
      })
      .command({
        command: "publish [file]",
        builder: yargs => yargs.boolean("pretend"),
        desc:
          "Generate new versions for all updated documents or selected file ",
        handler: async argv => {
          await drepo.init();
          await drepo.publish(argv.pretend, argv.file);
        }
      })
      .command({
        command: "postpublish [file]",
        desc: "Execute post processors on all documents or selected file ",
        handler: async argv => {
          await drepo.init();
          await drepo.build((...args) => {}, argv.file);
          await drepo.postpublish(argv.file);
        }
      })
      .command({
        command: "edit",
        builder: yargs => yargs.string("url"),
        desc: "Launch the editor",
        handler: async argv => {
          argv.url = argv.url || "https://mdocr.loopingz.com";
          await drepo.init();
          open(argv.url);
          await drepo.edit(argv.url);
        }
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
