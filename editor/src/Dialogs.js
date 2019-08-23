import React from "react";

import Slide from "@material-ui/core/Slide";
import Dialog from "@material-ui/core/Dialog";
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

  const { diffFiles, isLoading } = useDiffChangesApi(
    `${props.url}${props.diffUrl}`
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
        onChange={({ target: { value } }) => setCommitMessage(value)}
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
        (diffFiles || []).map(renderFile)
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
