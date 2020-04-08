import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import Slide from "@material-ui/core/Slide";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import AddBoxIcon from "@material-ui/icons/AddBox";
import CloseIcon from "@material-ui/icons/Close";
import EditIcon from "@material-ui/icons/Edit";
import SearchIcon from "@material-ui/icons/Search";
import React from "react";
import { Diff, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { SinceVersion } from "./SinceVersion";

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: "relative",
  },
  title: {
    marginLeft: theme.spacing(2),
  },
  root: {
    width: "100%",
  },
  container: {},
}));

const useStylesReddit = makeStyles((theme) => ({
  root: {
    border: "1px solid #e2e2e1",
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#fcfcfb",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:hover": {
      backgroundColor: "#fff",
    },
    "&$focused": {
      backgroundColor: "#fff",
      borderColor: theme.palette.primary.main,
    },
  },
  focused: {},
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function getVersionIncrement(message) {
  let incr = 1;
  if (message.indexOf("BREAKING") >= 0) {
    incr = 100;
  } else if (message.startsWith("feature:") || message.startsWith("feat:") || message.startsWith("feat(")) {
    incr = 10;
  }
  if (message.startsWith("release:")) {
    incr = 1;
  }
  return incr;
}

const useDiffChangesApi = (diffUrl) => {
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

  const { diffFiles, isLoading } = useDiffChangesApi(`${props.url}${props.diffUrl}?incr=${incr}`);

  const label = props.label || "Commit changes";
  const actionLabel = props.actionLabel || "commit";
  const renderFile = (file) => {
    const { oldRevision, newRevision, type, hunks } = file;
    return [
      <Typography variant="h6" className={classes.title}>
        {file.newPath}
      </Typography>,
      <Diff key={oldRevision + "-" + newRevision} viewType="split" diffType={type} hunks={hunks} />,
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
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
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
      {isLoading ? <CircularProgress className={classes.progress} /> : (diffFiles || []).filter(filter).map(renderFile)}
    </div>
  );
}

export function PublishDialog(props) {
  return (
    <Dialog fullScreen {...props} TransitionComponent={Transition}>
      {props.open ? (
        <DiffDialog
          label="Publish new versions"
          filter={(file) => {
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
        <DiffDialog label="Commit changes" actionLabel="commit" diffUrl="/changes" commit {...props} />
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
    <div fullScreen={true} open={true} aria-labelledby="responsive-dialog-title">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "30px",
        }}
      >
        <img src="mdocR.svg" alt="MdocR Logo" style={{ width: "200px" }} />
      </div>
      <DialogTitle id="responsive-dialog-title" style={{ color: "#3399cc", textAlign: "center" }}>
        Repository Editor
      </DialogTitle>
      <DialogContent>
        <div style={{ display: "flex", width: "100%", minHeight: "100%" }}>
          <div
            style={{
              borderRight: "2px solid #3399cc",
              padding: "10px",
              width: "50%",
              minHeight: "calc(100% - 260px)",
            }}
          >
            <DialogContentText>MDocr Editor Version: {props.uiVersion}</DialogContentText>
            <DialogContentText>
              You can use MDocr to manage your Markdown documents in a Git repository.
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
              MDocR use conventional commits to generate the version of the document. It also give you the ability to
              pull datas from your own systems to automate some contents
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
              Once the documents are ready to publish, you can publish and activate the post publish actions
            </DialogContentText>
          </div>
        </div>
      </DialogContent>
    </div>
  );
}

export function WelcomeDialog(props) {
  const [addMode, setAddMode] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const classes = useStyles();
  const columns = [
    {
      label: "Document",
      id: "path",
      align: "left",
      minWidth: 200,
    },
    {
      label: "Version",
      id: "currentVersion",
      align: "center",
    },
    {
      label: "Next Version",
      id: "nextVersion",
      align: "center",
    },
  ];
  const rows = Object.keys(props.mdocr.files).map((p) => ({ ...props.mdocr.files[p], code: p }));
  return (
    <div fullScreen={true} open={true} aria-labelledby="responsive-dialog-title">
      <div style={{ position: "fixed", width: "100%", backgroundColor: "white", zIndex: 3 }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "30px" }}>
          <img src="mdocR.svg" alt="MdocR Logo" style={{ width: "200px" }} />
        </div>
        <DialogTitle id="responsive-dialog-title" style={{ color: "#3399cc", textAlign: "center" }}>
          {"Choose a file to edit"}
        </DialogTitle>
        <DialogContent>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div style={{ flexGrow: 1 }}>
              <DialogContentText>
                Current path: {props.mdocr.path}
                <br />
                Current repository: {props.mdocr.repository}
                <br />
                <br />
                Please select a file
              </DialogContentText>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <SinceVersion current={props.mdocr.version} since="2.0.0">
                <Button
                  color="primary"
                  startIcon={<AddBoxIcon />}
                  onClick={() => {
                    setAddMode(true);
                  }}
                >
                  New Document
                </Button>
              </SinceVersion>
              <TextField
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                label="Filter"
                value={filter}
                onChange={(evt) => setFilter(evt.target.value)}
              />
            </div>
          </div>
        </DialogContent>
      </div>
      <DialogContent style={{ paddingTop: "350px" }}>
        <TableContainer className={classes.container}>
          <Table stickyHeader aria-label="sticky table" size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .filter((row) => row.path.indexOf(filter) >= 0)
                .map((row) => {
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.code}
                      onDoubleClick={() => {
                        props.onChange({ ...row, value: row.path, label: row.path });
                      }}
                    >
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && typeof value === "number" ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                      <TableCell key="action">
                        <IconButton aria-label="edit" size="small" className={classes.margin}>
                          <EditIcon
                            onClick={() => {
                              props.onChange({ ...row, value: row.path, label: row.path });
                            }}
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <AddDialog handleClose={() => setAddMode(false)} open={addMode} />
    </div>
  );
}

export function AddDialog(props) {
  const [filename, setFilename] = React.useState("");
  const [title, setTitle] = React.useState("");
  return (
    <Dialog onClose={props.handleClose} aria-labelledby="simple-dialog-title" open={props.open}>
      <DialogTitle id="simple-dialog-title" style={{ color: "#3399cc" }}>
        Add a new document
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          The document will be added to your repository, filename should include the path.
        </DialogContentText>
        <div>
          <TextField
            required
            value={filename}
            onChange={(event) => {
              setFilename(event.target.value);
            }}
            id="filename"
            label="Filename (with .md)"
            defaultValue=""
            variant="filled"
            fullWidth
          />
        </div>
        <div>
          <TextField
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            id="title"
            label="Title"
            defaultValue=""
            variant="filled"
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.handleClose}>Cancel</Button>
        <Button
          disabled={!(filename && filename.endsWith(".md") && title)}
          onClick={() => props.handleClose(filename, title)}
          color="primary"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DeleteConfirmationDialog(props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.handleClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle id="alert-dialog-slide-title">{"Delete confirmation?"}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want to delete this document, its built and published versions?
          <br />
          <br />
          {props.file}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.handleClose(false)}>Cancel</Button>
        <Button onClick={() => props.handleClose(true)} style={{ color: "red" }}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
