// src/implementations/ssml-formatter.ts

import { SSMLFormatter } from "../interfaces/ssml-highlighter";

const format = (ssml: string, indentation: number = 2): string => {
  let formatted = "";
  let indent = 0;
  const lines = ssml.split(/>\s*</);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line[0] === "/") {
      indent -= indentation;
    }
    formatted +=
      " ".repeat(indent) +
      (i > 0 ? "<" : "") +
      line +
      (i < lines.length - 1 ? ">" : "") +
      "\n";
    if (line[0] !== "/" && line.slice(-1) !== "/") {
      indent += indentation;
    }
  }

  return formatted.trim();
};

export const ssmlFormatter: SSMLFormatter = { format };
