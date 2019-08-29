import { suite, test } from "mocha-typescript";
import * as assert from "assert";
import * as mkdirp from "mkdirp";
import * as simpleGit from "simple-git";
import * as doAsync from "doasync";
import { MDocsRepository } from "./mdocr";
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
  mdocr: any;

  before() {
    if (fs.existsSync("./test/data")) {
      rimraf.sync("./test/data");
    }
    mkdirp.sync("./test/data");
    this.git = doAsync(simpleGit("./test/data"));
    this.mdocr = new MDocsRepository({ rootPath: "./test/data", pdf: true });
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
    <SubDemo>Bouzouf2</SubDemo>
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
    this.mdocr.addCommand("Demo", (cmd, ctx, mdocr) => {
      let res = cmd.childNodes.filter(i => i.nodeName === "subdemo").length;
      assert.equal(
        res,
        2,
        "The Demo command should get one subdemo child node"
      );
      return `This is my custom command, you have ${res} SubDemo nodes`;
    });
    let called = [];
    this.mdocr.addPublisher(async file => {
      called.push(file);
    });
    await this.mdocr.init();
    await this.mdocr.publish();

    assert.equal(called.length, 3, "Should publish 3 documents");
    // TODO Add asserts
    assert.equal(called[0].nextVersion, "1.0.0");
    assert.equal(called[1].nextVersion, "1.1.0");
    assert.equal(called[2].nextVersion, "1.0.0");
    let content = fs.readFileSync("./test/data/build/docs/test.md").toString();
    assert.notEqual(content.match(/Imported: 1\.0\.0/g), null);
    assert.notEqual(content.match(/Version: 1\.0\.0/g), null);

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

    called.splice(0, 3);
    await this.mdocr.init();
    await this.mdocr.publish();

    assert.equal(called.length, 3, "Should publish 3 documents");

    assert.equal(called[0].nextVersion, "1.0.1");
    assert.equal(called[1].nextVersion, "1.2.0");
    assert.equal(called[2].nextVersion, "2.0.0");

    content = fs.readFileSync("./test/data/build/docs/test3.md").toString();
    assert.notEqual(content.match(/Imported: 2\.0\.0/g), undefined);
    assert.notEqual(content.match(/Version: 2\.0\.0/g), undefined);

    content = fs.readFileSync("./test/data/build/docs/test2.md").toString();
    assert.notEqual(content.match(/Imported: 1\.2\.0/g), undefined);
    assert.notEqual(content.match(/Version: 1\.2\.0/g), undefined);
    assert.notEqual(
      content.match(
        /1\.0\.0\s*|\s*2019-01-01\s*|\s*Georges Abitbol\s*|\s*|\s*Thomas A. Anderson\s*/g
      ),
      undefined
    );
  }

  @test
  async uncommittedFiles() {
    await this.initScenario();
    fs.writeFileSync("./test/data/drafts/docs/plop.md", "should stash");
    await this.mdocr.init();
    assert.equal(
      await this.mdocr.publish(),
      false,
      "Should not allow modified tree"
    );
    fs.unlinkSync("./test/data/drafts/docs/plop.md");
  }

  @test
  async uncommittedChanges() {
    await this.initScenario();
    this.appendFile("./test/data/drafts/docs/test3.md", "should stash");

    await this.mdocr.init();
    assert.equal(
      await this.mdocr.publish(),
      false,
      "Should not allow modified tree"
    );
  }

  //@test
  async buildCommandLine() {
    // Not yet ready the chdir seems to generate issue with git spawn
    // Build
    await this.initScenario();
    // Fake process
    let cur = process.cwd();
    let argv = process.argv;
    process.chdir("./test/data");
    process.argv = ["mdocr", "build"];
    await MDocsRepository.commandLine();
    // Reset normal process
    process.argv = argv;
    process.chdir(cur);
  }
}
