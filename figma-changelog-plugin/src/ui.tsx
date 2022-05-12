/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import classnames from "classnames";
import { pipe } from "fp-ts/function";
import * as ArrayFP from "fp-ts/Array";
import * as NonEmptyArrayFP from "fp-ts/NonEmptyArray";
import * as OptionFP from "fp-ts/Option";
import { useForm, SubmitHandler } from "react-hook-form";

import * as REST from "./REST";
import * as FetchVersionHistory from "./fetch-version-history";
import * as ChangelogAdd from "./add-history";
import * as DisplayHistory from "./display-version-history";

import styles from "./ui.module.scss";

type FormInputs = {
  label: string;
  description: string;
};

function App() {
  const [logs, setLogs] = useState<DisplayHistory.Version[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInputs>();

  // Set up listeners and fetch version history on start
  useEffect(() => {
    parent.postMessage(
      { pluginMessage: { type: FetchVersionHistory.messageName } },
      "*"
    );
    window.onmessage = async (event) => {
      if (event.data.pluginMessage.type === "get-changelog") {
        setIsFetching(true);
        let keepFetching = true;
        let nextPage;
        // If event requests page creation as well, reset the logs and start anew.
        let logArray = event.data.pluginMessage.createPage ? [] : logs;

        while (keepFetching) {
          const results: { newLogs: DisplayHistory.Version[]; next?: string } =
            // eslint-disable-next-line no-await-in-loop
            await REST.getVersionHistory(
              event.data.pluginMessage.fileKey,
              logArray,
              nextPage
            );

          logArray = results.newLogs;
          nextPage = results.next;
          keepFetching = !!results.next;

          if (!keepFetching) {
            setLogs(logArray);
            setIsFetching(false);

            if (event.data.pluginMessage.createPage) {
              setIsAdding(false);
              reset();
              parent.postMessage(
                {
                  pluginMessage: {
                    type: DisplayHistory.messageName,
                    historyLogs: logArray,
                  },
                },
                "*"
              );
            }
          }
        }
        // eslint-disable-next-line no-console
      }

      if (event.data.pluginMessage.type === "page-created") {
        setIsLoading(false);
      }
    };
  }, []);

  // Button events
  const onCreatePageAndFrame = () => {
    setIsLoading(true);
    parent.postMessage(
      {
        pluginMessage: { type: DisplayHistory.messageName, historyLogs: logs },
      },
      "*"
    );
  };

  const onAdd = (data: { label: string; description: string }) => {
    parent.postMessage(
      { pluginMessage: { type: ChangelogAdd.messageName, data } },
      "*"
    );
  };

  const onCancel = () => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  };

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    setIsAdding(true);
    onAdd(data);
  };

  return (
    <div className={styles.stackVertical}>
      <h1 className={styles.title}>Changelog generator</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={classnames(styles.stackVertical, styles.form)}
      >
        <fieldset
          className={classnames(
            styles.stackVertical,
            styles.stackVertical_xxsmall,
            styles.fieldset
          )}
        >
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="label" className={styles.label}>
            Version label
          </label>
          <input
            type="text"
            id="label"
            placeholder="ex: v1.2.3"
            className={classnames({ [styles.inputError]: errors.label })}
            {...register("label", { required: true })}
          />
          {errors.label && (
            <p className={styles.error}>This field is required</p>
          )}
          <p className={styles.currentVersion}>
            {isFetching
              ? "Fetching history (this can take long)..."
              : pipe(
                  logs,
                  NonEmptyArrayFP.fromArray,
                  OptionFP.fold(
                    () => "No version yet",
                    (versions) =>
                      pipe(
                        versions,
                        ArrayFP.filter(
                          (version) => !!version.label && !!version.description
                        ),
                        NonEmptyArrayFP.fromArray,
                        OptionFP.fold(
                          () => "No version yet (may have some autosaves)",
                          (clean) => `Latest version is ${clean[0].label}`
                        )
                      )
                  )
                )}
          </p>
        </fieldset>

        <fieldset
          className={classnames(
            styles.stackVertical,
            styles.stackVertical_xxsmall,
            styles.fieldset
          )}
        >
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label htmlFor="description" className={styles.label}>
            Description of this version
          </label>
          <textarea
            id="description"
            placeholder="ex: Added mock up for coffee-making feature"
            className={classnames({ [styles.inputError]: errors.description })}
            {...register("description", { required: true })}
          />
          {errors.description && (
            <p className={styles.error}>This field is required</p>
          )}
        </fieldset>

        <div className={styles.stackHorizontal}>
          <div
            className={classnames(
              styles.stackHorizontal,
              styles.stackHorizontal_xsmall
            )}
          >
            <button
              id="cancel"
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={classnames(styles.button, styles.button_secondary)}
            >
              Cancel
            </button>
            <button
              id="create"
              type="button"
              onClick={onCreatePageAndFrame}
              disabled={isLoading || isFetching}
              className={classnames(styles.button, styles.button_secondary)}
            >
              {isLoading ? "Generating..." : "Generate page"}
            </button>
          </div>
          <button
            type="submit"
            disabled={isFetching || isAdding}
            className={classnames(styles.button, styles.button_primary)}
          >
            {isAdding ? "Adding version..." : "Add version"}
          </button>
        </div>
      </form>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("react-page"));
