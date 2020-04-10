import AppBar from "@material-ui/core/AppBar";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import FormatIndentDecreaseIcon from "@material-ui/icons/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@material-ui/icons/FormatIndentIncrease";
import PublishIcon from "@material-ui/icons/Publish";
import RefreshIcon from "@material-ui/icons/Refresh";
import SearchIcon from "@material-ui/icons/Search";
import CommitIcon from "mdi-material-ui/SourceCommitLocal";
import React, { useCallback, useRef } from "react";
import ReactMde, { commands } from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import { Document, Page, pdfjs } from "react-pdf";
import Select from "react-select";
import SplitPane from "react-split-pane";
import "./App.css";
import {
  AddDialog,
  CommitDialog,
  DeleteConfirmationDialog,
  IntroDialog,
  PublishDialog,
  WelcomeDialog,
} from "./Dialogs";
import FileSelector from "./FileSelector";
import { SinceVersion } from "./SinceVersion";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const commit = "#COMMIT#";

const useStyles = makeStyles((theme) => ({
  progress: {
    margin: theme.spacing(2),
  },
  text: {
    padding: theme.spacing(2, 2, 0),
  },
  paper: {
    paddingBottom: 50,
  },
  list: {
    marginBottom: theme.spacing(2),
  },
  subheader: {
    backgroundColor: theme.palette.background.paper,
  },
  dialogAppBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
  appBar: {
    top: "auto",
    bottom: 0,
  },
  grow: {
    flexGrow: 1,
  },
  fabButtons: {
    position: "absolute",
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: "0 auto",
  },
}));

let updateInterval;
let previewInterval;

export default function App() {
  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  const defaultSize = parseInt(localStorage.getItem("splitPos") || window.innerWidth / 2, 10);
  const [mdocr, setMdocr] = React.useState();
  const url = "http://localhost:18181";
  const [value, setValue] = React.useState("");
  const [meta, setMeta] = React.useState("");
  const [displayMeta, setDisplayMeta] = React.useState(false);
  const [current, setCurrent] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [numPages, setNumPages] = React.useState(0);
  const [previewEnable, setPreviewEnable] = React.useState(true);
  const [previewContent, setPreviewContent] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [commitMode, setCommitMode] = React.useState(false);
  const [publishMode, setPublishMode] = React.useState(false);
  const [addMode, setAddMode] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState(false);
  const [previewScrollTop, setPreviewScrollTop] = React.useState(0);
  const [previewCounter, setPreviewCounter] = React.useState(0);
  const [splitPos, setSplitPos] = React.useState(defaultSize);
  const classes = useStyles();
  const ref = useRef(null);

  const setRef = useCallback(
    (node) => {
      if (window.document.getElementById("preview")) {
        window.document.getElementById("preview").scrollTop = previewScrollTop;
      } else if (ref.current) {
        // Make sure to cleanup any events/references added to the last instance

        ref.current.scrollTop = previewScrollTop;
      }
      if (node) {
        // Check if a node is actually passed. Otherwise node would be null.
        // You can now do what you need to, addEventListeners, measure, etc.
      }
      // Save a reference to the node
      ref.current = node;
    },
    [previewScrollTop]
  );
  if (!mdocr) {
    return <IntroDialog uiVersion={commit} onMdocr={setMdocr} url={url} />;
  }

  const getPreviewContent = async (prev) => {
    if (prev.value === "none") return;
    if (prev.value === "pdf") {
      let items = document.getElementsByClassName("react-pdf__Document");
      if (items.length) {
        setPreviewScrollTop(items[0].scrollTop);
      } else {
        setPreviewScrollTop(0);
      }
    } else {
      let p = document.getElementById("preview");
      setPreviewScrollTop(p ? p.scrollTop : 0);
    }
    setPreviewCounter(previewCounter + 1);
    setPreviewLoading(true);
    let res = await fetch(`${url}/${prev.value}/${current.path}`);
    if (prev.value === "pdf") {
      setPreviewContent(await res.arrayBuffer());
    } else {
      setPreviewContent(await res.text());
    }
    setPreviewLoading(false);
  };

  let previewElement = <SearchIcon style={{ width: "128px", height: "128px", color: "#999" }} />;
  let addComponent = false;
  const addHandler = async (filename, title) => {
    setAddMode(false);
    if (filename && title) {
      let res = await fetch(`${url}/drafts/${filename}`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      let md = await res.json();
      setMdocr(md);
      let j;
      for (j in md.files) {
        if (md.files[j].path === filename) {
          setCurrent(md.files[j]);
        }
      }
    }
  };

  if (previewLoading) {
    addComponent = true;
    previewElement = <CircularProgress className={classes.progress} />;
  } else if (preview && preview.value !== "none") {
    if (preview.value === "build") {
      previewElement = (
        <pre id="preview" className="buildContent" ref={setRef}>
          {previewContent}
        </pre>
      );
    } else if (preview.value === "html") {
      previewElement = (
        <div
          id="preview"
          className="previewContent"
          ref={setRef}
          style={{ padding: 10 }}
          dangerouslySetInnerHTML={{ __html: previewContent.replace(/<style>[\w\W]*<\/style>/gm, "") }}
        />
      );
    } else if (preview.value === "pdf") {
      let pages = [];
      let pagesLoaded = 0;
      for (let i = 1; i <= numPages; i++) {
        pages.push(
          <Page
            id={i}
            pageNumber={i}
            onLoadSuccess={() => {
              pagesLoaded++;
              if (pagesLoaded === numPages) {
                let items = document.getElementsByClassName("react-pdf__Document");
                if (items.length) {
                  items[0].scrollTop = previewScrollTop;
                }
              }
            }}
          />
        );
      }
      previewElement = (
        <Document
          file={previewContent}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
          }}
        >
          {pages}
        </Document>
      );
    }
  } else {
    addComponent = true;
  }

  if (addComponent) {
    previewElement = (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          width: "100%",
          bottom: "60px",
          top: "48px",
        }}
      >
        {previewElement}
      </div>
    );
  }
  const onMarkdownChange = (val) => {
    setValue(val);
    if (updateInterval) {
      clearTimeout(updateInterval);
    }
    updateInterval = setTimeout(async () => {
      let body;
      if (displayMeta) {
        body = val;
      } else {
        body = meta + val;
      }
      await fetch(`${url}/drafts/${current.path}`, {
        method: "PUT",
        body,
      });
      setMdocr({ ...mdocr, isDirty: true });
      if (preview) {
        if (previewInterval) {
          clearTimeout(previewInterval);
        }
        let interval = 5000;
        if (preview.value === "build") {
          interval = 100;
        }
        previewInterval = setTimeout(() => {
          if (preview) {
            getPreviewContent(preview);
          }
        }, interval);
      }
    }, 1000);
  };

  const refreshCurrent = async (file = current) => {
    if (!file) {
      return;
    }
    let res = await fetch(`${url}/drafts/${file.path}`);
    let md = await res.text();
    if (md.startsWith("---")) {
      let curMeta = md.substr(0, md.substr(3).indexOf("---") + 7);
      setMeta(curMeta);
      md = md.substr(curMeta.length);
    }
    setValue(md);
    if (preview) {
      getPreviewContent(preview);
    }
  };

  if (!current && mdocr) {
    return (
      <WelcomeDialog
        uiVersion={commit}
        mdocr={mdocr}
        onAdd={addHandler}
        onChange={async (value) => {
          setCurrent(value);
          refreshCurrent(value);
        }}
      />
    );
  }
  let listCommands = commands.getDefaultCommands();
  listCommands.push({
    commands: [
      {
        name: "metadata",
        buttonProps: {
          "aria-label": "Display Metadata",
          color: "#000",
          title: displayMeta ? "Hide Meta" : "Display Meta",
        },
        icon: () => <div>Display Meta</div>,
        execute: (state0: TextState, api: TextApi) => {
          setDisplayMeta(!displayMeta);
        },
        keyCommand: "meta",
      },
    ],
  });
  let val = value;
  if (displayMeta) {
    val = meta + value;
  }
  const overlaysPos = previewEnable ? splitPos : window.innerWidth;
  const previewEnableButton = previewEnable ? <FormatIndentIncreaseIcon /> : <FormatIndentDecreaseIcon />;
  return (
    <div>
      <IconButton
        onClick={() => setPreviewEnable(!previewEnable)}
        style={{ zIndex: 2, position: "fixed", left: overlaysPos - 40 }}
      >
        {previewEnableButton}
      </IconButton>
      <SplitPane
        split="vertical"
        defaultSize={defaultSize}
        size={previewEnable ? splitPos : window.innerWidth}
        onChange={(size) => {
          localStorage.setItem("splitPos", size);
          setSplitPos(size);
        }}
      >
        <div>
          <ReactMde
            value={val}
            onChange={onMarkdownChange}
            minEditorHeight="inherit"
            commands={listCommands}
            generateMarkdownPreview={async (markdown) => {
              if (!current) {
                return "";
              }
              let res = await fetch(`${url}/build/${current.gitPath}`);
              return `<pre>${await res.text()}</pre>`;
            }}
          />
          <AppBar position="fixed" color="primary" className={classes.appBar}>
            <Toolbar>
              <div
                title="Welcome Panel"
                onClick={() => {
                  setCurrent(undefined);
                }}
                style={{
                  cursor: "pointer",
                  position: "fixed",
                  bottom: "60px",
                  left: overlaysPos - (previewEnable ? 32 : 80),
                }}
              >
                <img src="mdocR.svg" alt="MdocR Logo" style={{ width: "64px" }} />
              </div>
              <SinceVersion current={mdocr.version} since="2.0.0">
                <IconButton color="inherit" onClick={() => setDeleteConfirmation(true)} style={{ marginLeft: "-24px" }}>
                  <DeleteIcon />
                </IconButton>
              </SinceVersion>
              <FileSelector
                drafts={Object.values(mdocr.files)}
                onChange={async (value) => {
                  setCurrent(value);
                  refreshCurrent(value);
                }}
                value={current}
              />
              <SinceVersion current={mdocr.version} since="2.0.0">
                <IconButton color="inherit" onClick={() => setAddMode(true)}>
                  <AddIcon />
                </IconButton>
              </SinceVersion>
              <div className={classes.grow}>Repository: {mdocr.path}</div>
              <IconButton disabled={!mdocr.isDirty} color="inherit" onClick={() => setCommitMode(true)}>
                <CommitIcon />
              </IconButton>
              <IconButton edge="end" color="inherit" disabled={mdocr.isDirty} onClick={() => setPublishMode(true)}>
                <PublishIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        </div>
        <div>
          <div
            style={{
              backgroundColor: "#f9f9f9",
              display: "flex",
              height: "44px",
              borderBottom: "1px solid #c8ccd0",
              borderRadius: "2px 2px 0 0",
            }}
          >
            <div style={{ padding: 10 }}>Preview</div>
            <div style={{ paddingRight: 10, paddingTop: 3, flexGrow: 1 }}>
              <Select
                value={preview}
                onChange={(value) => {
                  if (previewInterval) {
                    clearTimeout(previewInterval);
                  }
                  setPreviewScrollTop(0);
                  setPreview(value);
                  getPreviewContent(value);
                }}
                placeholder="Select a type of preview"
                options={[
                  { label: "PDF", value: "pdf" },
                  { label: "HTML", value: "html" },
                  { label: "Markdown", value: "build" },
                  { label: "-", value: "none" },
                ]}
              />
            </div>
            <div>
              <IconButton
                color="inherit"
                onClick={() => {
                  getPreviewContent(preview);
                }}
              >
                <RefreshIcon />
              </IconButton>
            </div>
          </div>
          {previewElement}
        </div>
      </SplitPane>

      <PublishDialog
        open={publishMode}
        onClose={() => setPublishMode(false)}
        url={url}
        onAction={async () => {
          await fetch(`${url}/release`, {
            method: "PUT",
          });
          await refreshCurrent();
          return true;
        }}
      />

      <CommitDialog
        open={commitMode}
        onClose={() => setCommitMode(false)}
        url={url}
        onAction={async (message) => {
          await fetch(`${url}/commit`, {
            method: "PUT",
            body: JSON.stringify({ message }),
          });
          setMdocr({ ...mdocr, isDirty: false });
          return true;
        }}
      />

      <AddDialog mdocr={mdocr} handleClose={addHandler} open={addMode} />
      <DeleteConfirmationDialog
        handleClose={async (validation) => {
          setDeleteConfirmation(false);
          if (validation) {
            let res = await fetch(`${url}/drafts/${current.path}`, {
              method: "DELETE",
            });
            setMdocr({ ...(await res.json()) });
            setCurrent(undefined);
          }
        }}
        file={current.path}
        open={deleteConfirmation}
      />
    </div>
  );
}
