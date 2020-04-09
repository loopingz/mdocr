import { suite, test } from "mocha-typescript";
import * as assert from "assert";
import * as simpleGit from "simple-git";
import * as doAsync from "doasync";
import { MDocsRepository, TemplateExtension } from "./mdocr";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as fetch from "node-fetch";

class TestExtension extends TemplateExtension {
  constructor() {
    super("testExt", ["upperblock"], true);
  }

  _run(context, body) {
    return body().toUpperCase();
  }
}

const ImportContent: string = `
This is my include file

{% include "includes/include2.md" %}

Imported: {% currentVersion %}
`;
@suite
class MDocsTest {
  git: any;
  mdocr: any;

  before() {
    if (fs.existsSync("./test/data")) {
      rimraf.sync("./test/data");
    }
    fs.mkdirSync("./test/data", { recursive: true });
    this.git = doAsync(simpleGit("./test/data"));
    this.mdocr = new MDocsRepository({ rootPath: "./test/data", pdf: true });
  }

  appendFile(file, str) {
    fs.writeFileSync(file, fs.readFileSync(file).toString() + "\n" + str);
  }

  async initScenario() {
    await this.git.init();
    fs.mkdirSync("./test/data/drafts/docs", { recursive: true });
    fs.mkdirSync("./test/data/includes", { recursive: true });
    fs.writeFileSync("./test/data/includes/include.md", ImportContent);
    fs.writeFileSync(
      "./test/data/includes/include2.md",
      `
This is my include 2 file
`
    );
    fs.writeFileSync(
      "./test/data/drafts/docs/test.md",
      `---
Title: Test File
---
# Test Doc
{% include "includes/include.md" %}

Version: {% currentVersion %}

{% versionsTable %}
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
{% include "includes/include.md" %}

Version: {% currentVersion %}

{% versionsTable %}
`
    );
    fs.writeFileSync(
      "./test/data/drafts/docs/test3.md",
      `
# Test Doc 3
{% include "includes/include.md" %}

Version: {% currentVersion %}

`
    );
    await this.git.add("drafts/docs/*.md");
    await this.git.add("includes/*.md");
    await this.git.commit("feat: first commit");
    fs.writeFileSync(
      "./test/data/drafts/docs/test.md",
      `
# Test Doc
{% include "includes/include.md" %}

Version: {% currentVersion %}

{% versionsTable %}

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

    let called = [];
    this.mdocr.addPublisher(async (file) => {
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

    await this.git.commit("feat: first commit");
    this.appendFile("./test/data/drafts/docs/test.md", "patch versioned");
    await this.git.add("drafts/docs/test.md");
    await this.git.commit("fix: should increase patch version");
    this.appendFile("./test/data/drafts/docs/test2.md", "minor versioned");
    await this.git.add("drafts/docs/test2.md");
    await this.git.commit("feat(scope): should increase minor version");
    this.appendFile("./test/data/drafts/docs/test3.md", "major versioned");
    await this.git.add("drafts/docs/test3.md");
    await this.git.commit("feature: BREAKING to major"); // For retro

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
      content.match(/1\.0\.0\s*|\s*2019-01-01\s*|\s*Georges Abitbol\s*|\s*|\s*Thomas A. Anderson\s*/g),
      undefined
    );
  }

  @test
  async uncommittedFiles() {
    await this.initScenario();
    fs.writeFileSync("./test/data/drafts/docs/plop.md", "should stash");
    await this.mdocr.init();
    assert.equal(await this.mdocr.publish(), false, "Should not allow modified tree");
    fs.unlinkSync("./test/data/drafts/docs/plop.md");
  }

  @test
  async uncommittedChanges() {
    await this.initScenario();
    this.appendFile("./test/data/drafts/docs/test3.md", "should stash");

    await this.mdocr.init();
    assert.equal(await this.mdocr.publish(), false, "Should not allow modified tree");
  }

  async ajax(url, method = "GET", format = "text", body = undefined) {
    let res = await fetch(`http://localhost:18181${url}`, {
      method,
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (format === "raw") {
      return res;
    }
    return await res[format]();
  }

  async pause(ms: number = 1000) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  @test
  async testServerAndExtension() {
    this.mdocr.addTemplateExtension(new TestExtension());
    this.mdocr.addTemplateFilter("myFilter", (str) => {
      return (str || "").toLowerCase();
    });
    this.mdocr.addBuildContext({ myctx: "To 90 percent and More" });
    // Not yet ready the chdir seems to generate issue with git spawn
    // Build
    await this.initScenario();
    await this.mdocr.init();
    this.mdocr.edit();
    // Wait for the server to start
    await this.pause(500);

    let mdocr = await this.ajax("/mdocr", "GET", "json");
    assert.equal(mdocr.path.endsWith("/test/data"), true);
    assert.equal(mdocr.isDirty, false);

    let text = fs.readFileSync("./test/data/drafts/docs/test.md").toString();
    assert.equal(text, await this.ajax("/drafts/drafts/docs/test.md"));
    text +=
      " {% upperblock %} this Should be uppercase {% endupperblock %}\n{{ myctx | myFilter }}\n{% currentVersion %}\n";
    text += " HTTP UPDATE";
    await this.ajax("/drafts/drafts/docs/test.md", "PUT", "text", text);

    assert.equal(text, await this.ajax("/drafts/drafts/docs/test.md"));
    assert.equal(text, fs.readFileSync("./test/data/drafts/docs/test.md"));

    mdocr = await this.ajax("/mdocr", "GET", "json");
    assert.equal(mdocr.isDirty, true);

    let result = await this.ajax("/changes", "GET");
    assert.equal(result.indexOf("+ HTTP UPDATE") >= 0, true);

    let md = await this.ajax("/build/drafts/docs/test.md");
    let html = await this.ajax("/html/drafts/docs/test.md");
    let pdf = await this.ajax("/pdf/drafts/docs/test.md");

    // The block parsing should arrive
    assert.equal(md.indexOf("THIS SHOULD BE UPPERCASE") >= 0, true);
    // The context should be "To 90 percent and More" then the filter to lower case should apply
    assert.equal(md.indexOf("to 90 percent and more") >= 0, true);

    // Ensure we have CSS and a SNAPSHOT
    assert.equal(html.match(/font-face.*Imported: 1.0.0-SNAPSHOT/), null);
    // Ensure PDF is not empty
    assert.notEqual(pdf, "");

    await this.ajax("/commit", "PUT", "text", JSON.stringify({ message: "feat: BREAKING i want my 80" }));

    result = await this.ajax("/release", "GET");
    assert.equal(result.indexOf("+ HTTP UPDATE") >= 0, true);

    await this.ajax("/release", "PUT");

    await this.ajax(
      "/drafts/drafts/docs/test.md",
      "PUT",
      "text",
      fs.readFileSync("./test/data/drafts/docs/test.md") + "\n2nd version"
    );

    result = await this.ajax("/changes", "GET");
    assert.equal(result.indexOf("1.0.1-SNAPSHOT") >= 0, true);
    result = await this.ajax("/changes?incr=10", "GET");
    assert.equal(result.indexOf("1.1.0-SNAPSHOT") >= 0, true);
    result = await this.ajax("/changes?incr=100", "GET");
    assert.equal(result.indexOf("2.0.0-SNAPSHOT") >= 0, true);

    let res = await this.ajax("/plop404", "PUT", "raw");
    assert.equal(res.status, 404);
    res = await this.ajax("/plop404", "POST", "raw");
    assert.equal(res.status, 404);
    res = await this.ajax("/plop404", "GET", "raw");
    assert.equal(res.status, 404);
    res = await this.ajax("/plop404", "OPTIONS", "raw");
    assert.equal(res.status, 200);

    // Create a new content
    result = await this.ajax("/files", "DELETE", "json", JSON.stringify({ file: "drafts/docs/test.md" }));
    assert.equal(fs.existsSync("./test/data/drafts/docs/test.md"), false);
    assert.equal(fs.existsSync("./test/data/build/docs/test.md"), false);
    assert.equal(fs.existsSync("./test/data/published/docs/test.md"), false);

    result = await this.ajax(
      "/files",
      "POST",
      "json",
      JSON.stringify({ file: "drafts/docs/newfile.md", title: "MyTest" })
    );
    assert.equal(fs.existsSync("./test/data/drafts/docs/newfile.md"), true);
    assert.equal(
      fs.readFileSync("./test/data/drafts/docs/newfile.md").toString().indexOf("---\nTitle: MyTest\n---") >= 0,
      true
    );
    // Stop the server
    await fetch("http://localhost:18181/stop");
  }
}
