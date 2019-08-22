import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import RefreshIcon from "@material-ui/icons/Refresh";
import PublishIcon from "@material-ui/icons/Publish";
import SearchIcon from "@material-ui/icons/Search";
import CommitIcon from "mdi-material-ui/SourceCommitLocal";
import SplitPane from "react-split-pane";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import CircularProgress from "@material-ui/core/CircularProgress";
import FileSelector from "./FileSelector";
import Select from "react-select";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${
  pdfjs.version
}/pdf.worker.js`;

const useStyles = makeStyles(theme => ({
  progress: {
    margin: theme.spacing(2)
  },
  text: {
    padding: theme.spacing(2, 2, 0)
  },
  paper: {
    paddingBottom: 50
  },
  list: {
    marginBottom: theme.spacing(2)
  },
  subheader: {
    backgroundColor: theme.palette.background.paper
  },
  appBar: {
    top: "auto",
    bottom: 0
  },
  grow: {
    flexGrow: 1
  },
  fabButtons: {
    position: "absolute",
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: "0 auto"
  }
}));

let updateInterval;
let previewInterval;

export default function App() {
  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  const [mdocr, setMdocr] = React.useState();
  const url = "http://localhost:18181";
  const [value, setValue] = React.useState("");
  const [pageNumber, setPageNumber] = React.useState(1);
  const [current, setCurrent] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [numPages, setNumPages] = React.useState(0);
  const [previewContent, setPreviewContent] = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const [state, setState] = React.useState({
    single: "",
    popper: ""
  });
  const classes = useStyles();
  const theme = useTheme();

  if (!mdocr) {
    (async () => {
      let res = await fetch(`${url}/mdocr`);
      setMdocr(await res.json());
    })();
    return (
      <div>
        <CircularProgress className={classes.progress} />
      </div>
    );
  }

  const handleChange = name => (event, { newValue }) => {
    setState({
      ...state,
      [name]: newValue
    });
  };
  const getBuildMarkdown = async () => {};

  const getPreviewContent = async prev => {
    if (prev.value === "none") return;
    setPreviewLoading(true);
    let res = await fetch(`${url}/${prev.value}/${current.gitPath}`);
    if (prev.value === "pdf") {
      setPreviewContent(await res.arrayBuffer());
    } else {
      setPreviewContent(await res.text());
    }
    setPreviewLoading(false);
  };
  let previewElement = (
    <SearchIcon style={{ width: "128px", height: "128px", color: "#999" }} />
  );
  let addComponent = false;
  if (previewLoading) {
    addComponent = true;
    previewElement = <CircularProgress className={classes.progress} />;
  } else if (preview && preview.value !== "none") {
    if (preview.value === "build") {
      previewElement = <pre>{previewContent}</pre>;
    } else if (preview.value === "html") {
      previewElement = (
        <div
          className="previewContent"
          style={{ padding: 10 }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      );
    } else if (preview.value === "pdf") {
      let pages = [];
      for (let i = 1; i <= numPages; i++) {
        pages.push(<Page id={i} pageNumber={i} />);
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
          top: "48px"
        }}
      >
        {previewElement}
      </div>
    );
  }

  const onMarkdownChange = val => {
    setValue(val);
    if (updateInterval) {
      clearTimeout(updateInterval);
    }
    updateInterval = setTimeout(async () => {
      let res = await fetch(`${url}/drafts/${current.gitPath}`, {
        method: "PUT",
        body: val
      });
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

  const getDraftMarkdown = async () => {};
  return (
    <SplitPane
      split="vertical"
      defaultSize={parseInt(
        localStorage.getItem("splitPos") || window.innerWidth / 2,
        10
      )}
      onChange={size => localStorage.setItem("splitPos", size)}
    >
      <div>
        <ReactMde
          value={value}
          onChange={onMarkdownChange}
          minEditorHeight="inherit"
          generateMarkdownPreview={async markdown => {
            if (!current) {
              return "";
            }
            let res = await fetch(`${url}/build/${current.gitPath}`);
            return `<pre>${await res.text()}</pre>`;
          }}
        />
        <AppBar position="fixed" color="primary" className={classes.appBar}>
          <Toolbar>
            <FileSelector
              drafts={Object.values(mdocr.files)}
              onChange={async value => {
                setCurrent(value);
                let res = await fetch(`${url}/drafts/${value.gitPath}`);
                setValue(await res.text());
              }}
            />
            <IconButton color="inherit">
              <AddIcon />
            </IconButton>
            <div className={classes.grow}>Repository: {mdocr.path}</div>
            <IconButton color="inherit">
              <CommitIcon />
            </IconButton>
            <IconButton edge="end" color="inherit">
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
            borderRadius: "2px 2px 0 0"
          }}
        >
          <div style={{ padding: 10 }}>Preview</div>
          <div style={{ paddingRight: 10, paddingTop: 3, flexGrow: 1 }}>
            <Select
              value={preview}
              onChange={value => {
                if (previewInterval) {
                  clearTimeout(previewInterval);
                }
                setPreview(value);
                getPreviewContent(value);
              }}
              placeholder="Select a type of preview"
              options={[
                { label: "PDF", value: "pdf" },
                { label: "HTML", value: "html" },
                { label: "Markdown", value: "build" },
                { label: "-", value: "none" }
              ]}
            />
          </div>
          <div>
            <IconButton color="inherit">
              <RefreshIcon
                onClick={() => {
                  getPreviewContent(preview);
                }}
              />
            </IconButton>
          </div>
        </div>
        {previewElement}
      </div>
    </SplitPane>
  );
}
