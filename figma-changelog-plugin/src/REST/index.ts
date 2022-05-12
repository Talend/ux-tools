import { pipe } from "fp-ts/function";
import * as ArrayFP from "fp-ts/Array";
import { Version } from "../display-version-history";
import { FIGMA_KEY } from "../secrets";

export const getVersionHistory: (
  fileKey: string,
  currentLogs?: Version[],
  nextPage?: string
) => Promise<{ newLogs: Version[]; next?: string }> = (
  fileKey: string,
  currentLogs?: Version[],
  nextPage?: string
) => {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open(
      "GET",
      nextPage || `https://api.figma.com/v1/files/${fileKey}/versions`
    );
    request.setRequestHeader("X-FIGMA-TOKEN", FIGMA_KEY);
    request.responseType = "json";
    request.onload = () => {
      const { response } = request;
      const newLogs = pipe(
        currentLogs || [],
        ArrayFP.concat(response.versions)
      );

      return resolve({
        newLogs,
        next: response.pagination.next_page,
      });
    };
    request.send();
  });
};
