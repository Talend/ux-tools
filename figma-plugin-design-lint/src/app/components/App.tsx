/* tslint:disable:no-shadowed-variable jsx-no-multiline-js */
import * as React from "react";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { availableRadii } from "../../plugin/tokenFunctions";

import Navigation from "./Navigation";
import NodeList from "./NodeList";
import Preloader from "./Preloader";
import EmptyState from "./EmptyState";
import Panel from "./Panel";
import BulkErrorList from "./BulkErrorList";

import "../styles/figma.ds.css";
import "../styles/ui.css";
import "../styles/empty-state.css";

const App = ({}) => {
  const [errorArray, setErrorArray] = useState([]);
  const [activePage, setActivePage] = useState("layers");
  const [ignoredErrorArray, setIgnoreErrorArray] = useState([]);
  const [activeError, setActiveError] = React.useState({});
  const [selectedNode, setSelectedNode] = React.useState({});
  const [isVisible, setIsVisible] = React.useState(false);
  const [nodeArray, setNodeArray] = useState([]);
  const [selectedListItems, setSelectedListItem] = React.useState([]);
  const [activeNodeIds, setActiveNodeIds] = React.useState([]);
  const [borderRadiusValues, setBorderRadiusValues] = useState([
    availableRadii()
  ]);
  const [lintVectors, setLintVectors] = useState(false);
  const [initialLoad, setInitialLoad] = React.useState(false);
  const [timedLoad, setTimeLoad] = React.useState(false);

  let newWindowFocus = false;
  let counter = 0;

  const updateSelectedList = id => {
    setSelectedListItem(selectedListItems => {
      selectedListItems.splice(0, selectedListItems.length);
      return selectedListItems.concat(id);
    });

    setActiveNodeIds(activeNodeIds => {
      if (activeNodeIds.includes(id)) {
        // Remove this node if it exists in the array already from intial run.
        // Don't ignore it if there's only one layer total.
        if (activeNodeIds.length !== 1) {
          return activeNodeIds.filter(activeNodeId => activeNodeId !== id);
        } else {
          return activeNodeIds;
        }
      }
      // Since the ID is not already in the list, we want to add it
      return activeNodeIds.concat(id);
    });
  };

  const updateNavigation = page => {
    setActivePage(page);
  };

  const updateActiveError = error => {
    setActiveError(error);
  };

  const ignoreAll = errors => {
    setIgnoreErrorArray(ignoredErrorArray => [...ignoredErrorArray, ...errors]);
  };

  const updateIgnoredErrors = error => {
    if (ignoredErrorArray.some(e => e.node.id === error.node.id)) {
      if (ignoredErrorArray.some(e => e.value === error.value)) {
        return;
      } else {
        setIgnoreErrorArray([error].concat(ignoredErrorArray));
      }
    } else {
      setIgnoreErrorArray([error].concat(ignoredErrorArray));
    }
  };

  const updateErrorArray = errors => {
    setErrorArray(errors);
  };

  const updateVisible = val => {
    setIsVisible(val);
  };

  const updateLintRules = bool => {
    setLintVectors(bool);

    parent.postMessage(
      {
        pluginMessage: {
          type: "update-lint-rules-from-settings",
          boolean: bool
        }
      },
      "*"
    );
  };

  const onFocus = () => {
    newWindowFocus = true;
    counter = 0;
  };

  const onBlur = () => {
    newWindowFocus = false;
    pollForChanges();
  };

  /*  const initApp = React.useCallback(() => {
    parent.postMessage(
      { pluginMessage: { type: "init-app" } },
      "*"
    );
  }, []);*/

  const runApp = React.useCallback(() => {
    parent.postMessage(
      { pluginMessage: { type: "run-app", lintVectors } },
      "*"
    );
  }, []);

  // Recursive function for detecting if the user updates a layer.
  // polls for up to two minutes.
  function pollForChanges() {
    if (newWindowFocus === false && counter < 600) {
      parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      counter++;

      setTimeout(() => {
        pollForChanges();
      }, 750);
    }
  }

  function updateVisibility() {
    if (isVisible === true) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }

  // If no layer is selected after 3 seconds, show the empty state.
  setTimeout(function() {
    setTimeLoad(true);
  }, 3000);

  React.useEffect(() => {
    // Update client storage so the next time we run the app
    // we don't have to ignore our errors again.
    if (initialLoad !== false && ignoredErrorArray.length) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "update-storage",
            storageArray: ignoredErrorArray
          }
        },
        "*"
      );
    }
  }, [ignoredErrorArray]);

  React.useEffect(() => {
    runApp();

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    window.onmessage = event => {
      const { type, message, errors, storage } = event.data.pluginMessage;

      /*if (type === "fetchTheme") {
        getTheme().catch(error => console.error(error));
      }

      if (type === "readyToLaunch") {
        runApp();
      }*/

      // Plugin code returns this message after finished a loop through the layers.
      if (type === "complete") {
        const nodeObject = JSON.parse(message);

        setNodeArray(nodeObject);
        updateErrorArray(errors);

        setTimeout(() => {
          // Fetch the first nodes properties and lint them.
          parent.postMessage(
            {
              pluginMessage: {
                type: "fetch-layer-data",
                id: nodeObject[0].id,
                nodeArray: nodeObject
              }
            },
            "*"
          );

          // Set this node as selected in the side menu
          setSelectedListItem(selectedListItems => {
            selectedListItems.splice(0, selectedListItems.length);
            return selectedListItems.concat(nodeObject[0].id);
          });

          setActiveNodeIds(activeNodeIds => {
            return activeNodeIds.concat(nodeObject[0].id);
          });
          setInitialLoad(true);
        }, 1500);
      } else if (type === "fetched storage") {
        const clientStorage = JSON.parse(storage);

        setIgnoreErrorArray(ignoredErrorArray => [
          ...ignoredErrorArray,
          ...clientStorage
        ]);
      } else if (type === "fetched border radius") {
        // Update border radius values from storage
        const clientStorage = JSON.parse(storage);
        setBorderRadiusValues([...clientStorage]);
      } else if (type === "reset storage") {
        const clientStorage = JSON.parse(storage);
        setIgnoreErrorArray([...clientStorage]);
        parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      } else if (type === "fetched layer") {
        // Grabs the properties of the first layer.
        setSelectedNode(() => JSON.parse(message));

        // Ask the controller to lint the layers for errors.
        parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      } else if (type === "updated errors") {
        // Once the errors are returned, update the error array.
        updateErrorArray(errors);
      }
    };
  }, []);

  return (
    <div className="container">
      <AnimatePresence>
        <Navigation
          onPageSelection={updateNavigation}
          activePage={activePage}
          key="navigation"
        />
        {activeNodeIds.length !== 0 ? (
          <div key="nodes">
            {activePage === "layers" ? (
              <NodeList
                onErrorUpdate={updateActiveError}
                onVisibleUpdate={updateVisible}
                onSelectedListUpdate={updateSelectedList}
                onRefreshSelection={runApp}
                visibility={isVisible}
                nodeArray={nodeArray}
                errorArray={errorArray}
                ignoredErrorArray={ignoredErrorArray}
                selectedListItems={selectedListItems}
                activeNodeIds={activeNodeIds}
                borderRadiusValues={borderRadiusValues}
                lintVectors={lintVectors}
                updateLintRules={updateLintRules}
              />
            ) : (
              <BulkErrorList
                errorArray={errorArray}
                ignoredErrorArray={ignoredErrorArray}
                onIgnoredUpdate={updateIgnoredErrors}
                onIgnoreAll={ignoreAll}
                ignoredErrors={ignoredErrorArray}
                onClick={updateVisibility}
                onSelectedListUpdate={updateSelectedList}
              />
            )}
          </div>
        ) : timedLoad === false ? (
          <Preloader />
        ) : (
          <EmptyState onHandleRunApp={runApp} />
        )}
      </AnimatePresence>

      {Object.keys(activeError).length !== 0 && errorArray.length ? (
        <Panel
          visibility={isVisible}
          node={selectedNode}
          errorArray={errorArray}
          onIgnoredUpdate={updateIgnoredErrors}
          onIgnoreAll={ignoreAll}
          ignoredErrors={ignoredErrorArray}
          onClick={updateVisibility}
          onSelectedListUpdate={updateSelectedList}
        />
      ) : null}
    </div>
  );
};

export default App;
