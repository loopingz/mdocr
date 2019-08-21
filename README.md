# MDocs

MDocs allows you to manage your documents in Markdown inside a Git repository.

Use conventional commits to automate their versions.

Use:

* `commands`: to automate content inside your MDs
* `postprocessors`: to automate publishing
 * pdf 
 * confluence
 * etc

## Quickstart

Install

```
npm install -g mdocs
# OR
yarn global add mdocs
```

Usage

```
# Build docs with their new modification
mdocs build
# Publish docs and create a new version of each modified doc
mdocs publish
# Call post processors on each documents
mdocs postpublish
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

```

```

## Customization

PreProcessor example

```

``` 	