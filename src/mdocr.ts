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

async function Import(cmd, ctx, mdocr) {
  let file = path.dirname(ctx.path) + "/" + cmd.arguments.file;
  if (fs.existsSync(file)) {
    return await mdocr.processContent(fs.readFileSync(file).toString(), ctx);
  }
}

async function CurrentVersion(cmd, ctx) {
  if (ctx.isDirty || !ctx.meta.Versions) {
    return ctx.nextVersion + "-SNAPSHOT";
  } else if (ctx.meta.Versions) {
    return ctx.meta.Versions[0].Id;
  }
}

async function VersionsTable(cmd, ctx) {
  let res = `
| Version | Date       | Authors     | Reviewers    |
|---------|------------|-------------|--------------|
`;
  ctx.meta.Versions = ctx.meta.Versions || [];
  let versions = [...ctx.meta.Versions];
  if (ctx.isDirty) {
    versions.unshift({
      Id: ctx.nextVersion + "-SNAPSHOT",
      Date: dateFormat(Date.now(), "yyyy-mm-dd"),
      Authors: [...new Set(ctx.commits.map(i => i.author_name))].join(","), // Creating a unique set of authors
      Reviewer: "N/A"
    });
  }
  versions.forEach(version => {
    res += `| ${version.Id}     | ${version.Date} | ${version.Authors} | ${
      version.Reviewer
    } |\n`;
  });
  return res;
}

//analyse({ path: "drafts/policies/acceptable-usage-policy.md" });
/**
 * Main Class for MDocs
 */
export default class MDocsRepository {
  protected rootPath: string;
  protected git: any;
  protected publishers: any[] = [];
  protected commands: any = {
    Import,
    CurrentVersion,
    VersionsTable
  };
  protected targets: any = {};
  protected files: any = {};
  protected config: any = {};
  /**
   *
   * @param rootPath Path to the git repository of documents
   */
  constructor(config: any = {}) {
    this.rootPath = path.normalize(config.rootPath || process.cwd());
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
      this.config.publishedDir || "published/"
    );
    if (this.config.pdf) {
      this.publishers.push(this.pdf.bind(this));
    }
  }

  addCommand(command, plugin) {
    this.commands[command] = plugin;
  }

  addPublisher(pub) {
    this.publishers.push(pub);
  }

  async init() {
    let files = this.config.files
      .map(file =>
        glob({ gitignore: true })
          .readdirSync(file)
          .join("|")
      )
      .join("|")
      .split("|");
    for (let i in files) {
      this.files[files[i]] = await this.analyse(files[i]);
      this.targets[this.files[files[i]].gitTarget] = files[i];
    }
  }

  async analyse(filePath) {
    let file: any = {
      path: filePath,
      absPath: path.resolve(filePath)
    };
    if (filePath.startsWith(this.rootPath + "/")) {
      file.gitPath = filePath.substr(this.rootPath.length + 1);
    }
    let foundRelease = false;
    file.meta = {};
    let content = fs.readFileSync(file.path).toString();
    if (content.startsWith("---")) {
      let y = content.substr(3);
      y = y.substr(0, y.indexOf("---"));
      file.meta = yaml.parse(y);
      file.hasMeta = true;
    } else {
      file.hasMeta = false;
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
    return this.processContent(fs.readFileSync(file.path).toString(), file);
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
    return result;
  }

  getSourceFromTarget(target) {
    return this.files[this.targets[target]];
  }

  async getDocumentVersion(src) {
    let Reviewer = (await this.git.raw([
      "config",
      "--get",
      "user.name"
    ])).trim();
    let Authors = [...new Set(src.commits.map(i => i.author_name))].join(",");
    if (Authors.length === 0) {
      Authors = Reviewer;
    }
    return {
      Id: src.nextVersion,
      Date: dateFormat(Date.now(), "yyyy-mm-dd"),
      Authors,
      Reviewer
    };
  }

  async publish(preview = false, file: string = undefined) {
    let summary = await this.git.diffSummary();
    let status = await this.git.status();
    if (summary.files.length > 0) {
      console.log(
        "You need to work from a clean repository, stash your changes"
      );
      return;
    }
    await this.build((...args) => {}, file);
    status = await this.git.status();
    let files = status.files
      .filter(f => {
        return f.path.startsWith(this.config.buildDir);
      })
      .map(i => i.path);
    console.log("post build", files);
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
          src.path,
          fs
            .readFileSync(src.path)
            .toString()
            .replace(/---[\s\S]*---/, `---\n${y}---`)
        );
      } else {
        fs.writeFileSync(
          src.path,
          `---\n${y}---\n` + fs.readFileSync(src.path).toString()
        );
      }
    }
    if (preview) {
      return;
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
  }

  async getNextVersion(file) {
    let commits = file.commits || [];
    let versions = file.meta.Versions || [];
    let incr = Math.max(...commits.map(i => i.incr));
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
      c.incr = 1;
      if (c.message.indexOf("BREAKING") >= 0) {
        c.incr = 100;
      } else if (c.message.startsWith("feature:")) {
        c.incr = 10;
      }
      if (c.message.startsWith("release:")) {
        c.incr = 1;
      }
      c.release = c.message.startsWith("release:");
      return c;
    });
    return commits;
  }

  async pdf(file) {
    return new Promise(resolve => {
      markdownpdf({
        //preProcessHtml: preProcessMd,
        remarkable: {
          preset: "commonmark",
          plugins: [require("remarkable-plantuml"), require("remarkable-meta")]
        }
      })
        .from(file.target)
        .to(file.published.replace(/\.md/, ".pdf"), resolve);
    });
  }

  async build(log = console.log, file: string = undefined) {
    // Get all files -> a bit dirty
    let summary = await this.git.diffSummary();
    let updates = summary.files.filter(f => {
      if (this.files[f.file]) {
        let { insertions, deletions, changes } = f;
        this.files[f.file].changes = { insertions, deletions, changes };
      }
      return this.files[f.file] !== undefined;
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

  static async commandLine() {
    let drepo = new MDocsRepository();

    require("yargs")
      .command(
        ["build [file]"],
        "Build all markdowns or specific file running all commands",
        {},
        async argv => {
          await drepo.init();
          await drepo.build(console.log, argv.file);
        }
      )
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
      .demandCommand()
      .help()
      .wrap(120).argv;
  }
}

if (require.main === module) {
  MDocsRepository.commandLine();
}

export { MDocsRepository };
/*
// PDF to S3
drepo.addPublisher(async file => {
  let pdfFile = file.publishedFile.replace(/\.md/, ".pdf");
  let key = pdfFile.replace(drepo.config.publishedDir, "");
  return;
  //await drepo.pdf(src);
  let s3 = new (require("aws-sdk/clients/s3"))();
  // await s3.putObject
  await s3
    .putObject({
      Body: fs.readFileSync(pdfFile),
      Bucket: "nuxeo-security",
      Key: pdfFile.replace(drepo.config.publishedDir, "")
    })
    .promise();
});
*/
