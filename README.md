# MDocr [![Build Status](https://travis-ci.org/loopingz/mdocr.svg?branch=master)](https://travis-ci.org/loopingz/webda) [![SonarCloud.io][![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=loopingz_mdocr&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=loopingz_mdocr)
<p align="center"><img src="/docs/mdocR.png" alt="MDOCR logo"/></p>

MDocr allows you to manage your documents in Markdown inside a Git repository.

Use conventional commits to automate their versions.

Use:

- `commands`: to automate content inside your MDs
- `postprocessors`: to automate publishing
- pdf
- confluence
- etc

## Quickstart

Install

```
npm install -g mdocr
# OR
yarn global add mdocr
```

Usage

```
# Init a folder
mdocr init
# Build docs with their new modification
mdocr build
# Publish docs and create a new version of each modified doc
mdocr publish
# Call post processors on each documents
mdocr postpublish
```

## Built in Commands

**CurrentVersion**

To retrieve current document version:

```
# My New Doc
Version: <CurrentVersion />
```

will be replace by on build

```
# My New Doc
Version: 1.0.2
```

**VersionsTable**

To retrieve display document versions:

```
# My New Doc
Version: <CurrentVersion />
```

will be replace by on build

```
# My New Doc
Version: 1.0.2
```

**Import**

To import another MD inside your document

```
# My New Doc
Version: <CurrentVersion />
```

will be replace by on build

```
# My New Doc
Version: 1.0.2
```

## How it works?

Flow:

![MDocR flow](http://www.plantuml.com/plantuml/proxy?src=https://raw.github.com/loopingz/mdocr/master/docs/flow.puml)

## Customization

PreProcessor example

```

```

## Branching strategy (for v3)

`main` branch represent the current version of the document
`source` branch represent the source of the pages

### main

The main branch will contain final documents with no `commands` tags.
It will also be the source for tags.

### source

You will find only