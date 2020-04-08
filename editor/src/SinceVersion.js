import React from "react";
import * as semver from "semver";

export function SinceVersion(props) {
  if (semver.gte(props.current, props.since)) {
    return <div>{props.children}</div>;
  }
  return <div></div>;
}
