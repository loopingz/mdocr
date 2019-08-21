import { suite, test } from "mocha-typescript";
import * as assert from "assert";
import * as mkdirp from "mkdirp";
import * as simpleGit from "simple-git";
import * as doAsync from "doasync";
import { MDocsRepository } from "./mdocs";
import * as fs from "fs";
import * as rimraf from "rimraf";

const ImportContent: string = `
This is my import file

<Import file="./import2.md" />

Imported: <CurrentVersion />
`;
@suite
class MDocsTest {
  git: any;
  mdocs: any;

  before() {
    if (fs.existsSync("./test/data")) {
      rimraf.sync("./test/data");
    }
    mkdirp.sync("./test/data");
    this.git = doAsync(simpleGit("./test/data"));
    this.mdocs = new MDocsRepository({ rootPath: "./test/data", pdf: true });
  }

  appendFile(file, str) {
    fs.writeFileSync(file, fs.readFileSync(file).toString() + "\n" + str);
  }

  async initScenario() {
    await this.git.init();
    mkdirp.sync("./test/data/drafts/docs");
    mkdirp.sync("./test/data/imports");
    fs.writeFileSync("./test/data/imports/import.md", ImportContent);
    fs.writeFileSync(
      "./test/data/imports/import2.md",
      `
This is my import 2 file
`
    );
    fs.writeFileSync(
      "./test/data/drafts/docs/test.md",
      `---
Title: Test File
---
# Test Doc
<Import file="../../imports/import.md" />

Version: <CurrentVersion />

<VersionsTable />
`
    );
    fs.writeFileSync(
      "./test/data/drafts/docs/test2.md",
      `---
Title: Test File 2
Versions:
  - Id: 1.0.0
    Authors: Georges Abitbol
    Date: 2019-01-01
    Reviewer: Thomas A. Anderson
---
# Test Doc
<Import file="../../imports/import.md" />

Version: <CurrentVersion />

<VersionsTable />
`
    );
    fs.writeFileSync(
      "./test/data/drafts/docs/test3.md",
      `
# Test Doc 3
<Import file="../../imports/import.md" />

Version: <CurrentVersion />

<VersionsTable />
`
    );
    await this.git.add("drafts/docs/*.md");
    await this.git.add("imports/*.md");
    await this.git.commit("feature: first commit");
    fs.writeFileSync(
      "./test/data/drafts/docs/test.md",
      `
# Test Doc
<Import file="../../imports/import.md" />

Version: <CurrentVersion />

<VersionsTable />

<Demo>
    <SubDemo>Bouzouf</SubDemo>
</Demo>
`
    );
    await this.git.add("drafts/docs/test.md");
    await this.git.commit("fix: second commit");
  }

  @test
  async overall() {
    await this.initScenario();

    // Add a custom command
    this.mdocs.addCommand("Demo", (cmd, ctx, mdocs) => {
      let res = cmd.childNodes.filter(i => i.nodeName === "subdemo").length;
      assert.equal(
        res,
        1,
        "The Demo command should get one subdemo child node"
      );
      return `This is my custom command, you have ${res} SubDemo nodes`;
    });

    this.mdocs.addPublisher(async file => {
      console.log("Can work on", file);
    });
    await this.mdocs.init();
    await this.mdocs.publish();

    // TODO Add asserts

    await this.git.commit("feature: first commit");
    this.appendFile("./test/data/drafts/docs/test.md", "patch versioned");
    await this.git.add("drafts/docs/test.md");
    await this.git.commit("fix: should increase patch version");
    this.appendFile("./test/data/drafts/docs/test2.md", "minor versioned");
    await this.git.add("drafts/docs/test2.md");
    await this.git.commit("feature: should increase minor version");
    this.appendFile("./test/data/drafts/docs/test3.md", "major versioned");
    await this.git.add("drafts/docs/test3.md");
    await this.git.commit("feature: BREAKING to major");

    await this.mdocs.init();
    await this.mdocs.publish();

    // TODO Add asserts
    this.appendFile("./test/data/drafts/docs/test3.md", "should stash");

    await this.mdocs.init();
    await this.mdocs.publish();

    // TODO Add asserts nothing has changed
  }
}
