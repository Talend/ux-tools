/* eslint-disable no-restricted-globals */
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as ReactDOM from "react-dom";
import * as ChangelogRequest from "./changelog-request";
import * as ChangelogAdd from "./add-history";

type FormInputs = {
  label: string;
  description: string;
};

const getVersionHistory = async (
  fileKey: string,
  setLogs: (logs: []) => void
) => {
  const request = new XMLHttpRequest();
  request.open("GET", `https://api.figma.com/v1/files/${fileKey}/versions`);
  request.setRequestHeader(
    "X-FIGMA-TOKEN",
    "370887-1fe1f21d-a423-4ef2-acfc-36d96b95b76a"
  );
  request.responseType = "json";
  request.onload = () => {
    const { response } = request;
    setLogs(response.versions);
    window.parent.postMessage(
      {
        pluginMessage: {
          type: "set-history",
          value: response.versions,
        },
      },
      "*"
    );
  };
  request.send();
};

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  useEffect(() => {
    window.onmessage = async (event) => {
      setIsLoading(true);
      if (event.data.pluginMessage.type === "get-changelog") {
        await getVersionHistory(event.data.pluginMessage.fileKey, setLogs);
      }
    };
  }, []);

  const onCreate = () => {
    parent.postMessage(
      { pluginMessage: { type: ChangelogRequest.messageName } },
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
    // eslint-disable-next-line no-console
    console.log(data);
    setIsAdding(true);
    onAdd(data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="label">Version label</label>
        <input
          type="text"
          id="label"
          placeholder="ex: v1.2.3"
          {...register("label", { required: true })}
        />
        {errors.label && <p>This field is required</p>}

        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="description">Description of this version</label>
        <textarea
          id="description"
          placeholder="ex: Added mock up for coffee-making feature"
          {...register("description", { required: true })}
        />
        {errors.description && <p>This field is required</p>}
        <button type="submit" disabled={isAdding}>{isAdding ? "Adding version..." : "Gooo"}</button>
      </form>
      <button id="cancel" type="button" onClick={onCancel}>
        Cancel
      </button>
      <button id="create" type="button" onClick={onCreate} disabled={isLoading}>
        {isLoading ? "Generating changelog..." : "Create changelog"}
      </button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("react-page"));
