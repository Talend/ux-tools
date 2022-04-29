import { pipe } from "fp-ts/function";
import tokens from "@talend/design-tokens/lib/light/dictionary";
import * as ArrayFP from "fp-ts/Array";

export const fontTokens = pipe(
  tokens,
  ArrayFP.filter((token) => token.type === "typography")
);

export const fillTokens = pipe(
  tokens,
  ArrayFP.filter((token) => token.type === "color")
);
