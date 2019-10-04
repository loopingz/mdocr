import React from "react";

import Slide from "@material-ui/core/Slide";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { parseDiff, Diff } from "react-diff-view";
import "react-diff-view/style/index.css";
import CircularProgress from "@material-ui/core/CircularProgress";
import FileSelector from "./FileSelector";

const useStyles = makeStyles(theme => ({
  appBar: {
    position: "relative"
  },
  title: {
    marginLeft: theme.spacing(2)
  }
}));

const useStylesReddit = makeStyles(theme => ({
  root: {
    border: "1px solid #e2e2e1",
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#fcfcfb",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:hover": {
      backgroundColor: "#fff"
    },
    "&$focused": {
      backgroundColor: "#fff",
      borderColor: theme.palette.primary.main
    }
  },
  focused: {}
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function getVersionIncrement(message) {
  let incr = 1;
  if (message.indexOf("BREAKING") >= 0) {
    incr = 100;
  } else if (
    message.startsWith("feature:") ||
    message.startsWith("feat:") ||
    message.startsWith("feat(")
  ) {
    incr = 10;
  }
  if (message.startsWith("release:")) {
    incr = 1;
  }
  return incr;
}

const useDiffChangesApi = diffUrl => {
  const [diffFiles, setDiffFiles] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const result = await fetch(diffUrl);
        setDiffFiles(parseDiff(await result.text()));
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [diffUrl]);

  return { diffFiles, isLoading, isError };
};

export function DiffDialog(props) {
  const classes = useStyles();
  const txtClasses = useStylesReddit();
  const [commitMessage, setCommitMessage] = React.useState(undefined);
  const [incr, setIncr] = React.useState(1);

  const { diffFiles, isLoading } = useDiffChangesApi(
    `${props.url}${props.diffUrl}?incr=${incr}`
  );

  const label = props.label || "Commit changes";
  const actionLabel = props.actionLabel || "commit";
  const renderFile = file => {
    const { oldRevision, newRevision, type, hunks } = file;
    return [
      <Typography variant="h6" className={classes.title}>
        {file.newPath}
      </Typography>,
      <Diff
        key={oldRevision + "-" + newRevision}
        viewType="split"
        diffType={type}
        hunks={hunks}
      />
    ];
  };

  const onClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };

  const onAction = async () => {
    if (props.onAction && (await props.onAction(commitMessage))) {
      if (props.onClose) {
        props.onClose();
      }
    }
  };

  const filter = props.filter || (() => true);
  // Move this one
  let mid = <div style={{ flex: 1 }} />;
  if (props.commit) {
    mid = (
      <TextField
        InputProps={{ classes: txtClasses, disableUnderline: true }}
        label="Conventional Commit Message"
        placeholder="feature: my new awesome feature"
        style={{ flex: 1, marginLeft: 30, marginRight: 30, color: "white" }}
        variant="filled"
        value={commitMessage}
        onChange={({ target: { value } }) => {
          if (incr !== getVersionIncrement(value)) {
            setIncr(getVersionIncrement(value));
          }
          setCommitMessage(value);
        }}
      />
    );
  }
  return (
    <div>
      <AppBar className={classes.dialogAppBar}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {label}
          </Typography>
          {mid}
          <Button color="inherit" onClick={onAction}>
            {actionLabel}
          </Button>
        </Toolbar>
      </AppBar>
      {isLoading ? (
        <CircularProgress className={classes.progress} />
      ) : (
        (diffFiles || []).filter(filter).map(renderFile)
      )}
    </div>
  );
}

export function PublishDialog(props) {
  return (
    <Dialog fullScreen {...props} TransitionComponent={Transition}>
      {props.open ? (
        <DiffDialog
          label="Publish new versions"
          filter={file => {
            return true || file.newPath.startsWith("current/"); // TODO Should be variable - no filter for now
          }}
          actionLabel="publish"
          diffUrl="/release"
          {...props}
        />
      ) : null}
    </Dialog>
  );
}

export function CommitDialog(props) {
  return (
    <Dialog fullScreen {...props} TransitionComponent={Transition}>
      {props.open ? (
        <DiffDialog
          label="Commit changes"
          actionLabel="commit"
          diffUrl="/changes"
          commit
          {...props}
        />
      ) : null}
    </Dialog>
  );
}

async function checkMdocr(url, callback) {
  try {
    let res = await fetch(`${url}/mdocr`);
    callback(await res.json());
  } catch (err) {
    setTimeout(checkMdocr.bind(this, url, callback), 1000);
  }
}

export function IntroDialog(props) {
  checkMdocr(props.url, props.onMdocr);
  return (
    <Dialog
      fullScreen={true}
      open={true}
      aria-labelledby="responsive-dialog-title"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "-50px"
        }}
      >
        <img src="mdocR.svg" style={{ width: "200px" }} />
      </div>
      <DialogTitle
        id="responsive-dialog-title"
        style={{ color: "#3399cc", textAlign: "center" }}
      >
        Repository Editor
      </DialogTitle>
      <DialogContent>
        <div style={{ display: "flex", width: "100%", minHeight: "100%" }}>
          <div
            style={{
              borderRight: "2px solid #3399cc",
              padding: "10px",
              width: "50%",
              minHeight: "calc(100% - 260px)"
            }}
          >
            <DialogContentText>
              MDocr Editor Version: {props.uiVersion}
            </DialogContentText>
            <DialogContentText>
              You can use MDocr to manage your Markdown documents in a Git
              repository.
            </DialogContentText>
            <DialogContentText>
              <h3>Install requirements</h3>
              <ul>
                <li>NodeJS</li>
                <li>Git client</li>
                <li>
                  Install MDocR binary
                  <pre>npm install -g mdocr</pre>
                  <span style={{ fontSize: "8px" }}>OR</span>
                  <pre>yarn global add mdocr</pre>
                </li>
              </ul>
            </DialogContentText>
            <DialogContentText>
              <h3>Initiate a repository</h3>
              <pre>git init</pre>
            </DialogContentText>
            <DialogContentText>
              <h3>Launch in your repository</h3>
              <pre>mdocr edit</pre>
            </DialogContentText>
          </div>
          <div style={{ padding: "10px", width: "50%" }}>
            <DialogContentText>
              MDocR use conventional commits to generate the version of the
              document. It also give you the ability to pull datas from your own
              systems to automate some contents
            </DialogContentText>
            <DialogContentText>
              <h3>Conventional commits</h3>
              What is conventional commits?
            </DialogContentText>
            <DialogContentText>
              <h3>Integrations</h3>
            </DialogContentText>
            <DialogContentText>
              <h3>Publish</h3>
              Once the documents are ready to publish, you can publish and
              activate the post publish actions
            </DialogContentText>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WelcomeDialog(props) {
  return (
    <Dialog
      fullScreen={true}
      open={true}
      aria-labelledby="responsive-dialog-title"
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img src="mdocR.svg" style={{ width: "200px" }} />
      </div>
      <DialogTitle
        id="responsive-dialog-title"
        style={{ color: "#3399cc", textAlign: "center" }}
      >
        {"Choose a file to edit"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Current path: {props.mdocr.path}
          <br />
          Current repository: {props.mdocr.repository}
        </DialogContentText>
        <DialogContentText>Please select a file</DialogContentText>
        <FileSelector
          drafts={Object.values(props.mdocr.files)}
          onChange={props.onChange}
        />
      </DialogContent>
    </Dialog>
  );
}
