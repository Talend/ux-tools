import * as React from "react";
import * as ReactDOM from "react-dom";
import "./ui.css";

const App = () => {
  const onCreate = () => {
    parent.postMessage({ pluginMessage: { type: "create-request" } }, "*");
  };

  const onRevamp = () => {
    parent.postMessage({ pluginMessage: { type: "revamp-svg" } }, "*");
  }

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  return (
    <div>
      <button id="cancel" onClick={onCancel}>
        Cancel
      </button>
      <button id="revamp" onClick={onRevamp}>
        Revamp
      </button>
      <button id="create" onClick={onCreate}>
        Process
      </button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("react-page"));
