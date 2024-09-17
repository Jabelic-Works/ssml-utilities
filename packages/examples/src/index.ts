// src/example.ts

import { ssmlProcessor } from "@ssml-utilities/core";

// 通常のSSML入力
const inputSSML = `
<speak>
  Welcome to the SSML example.
  <break time="500ms"/>
  <emphasis level="strong">This is important!</emphasis>
  <prosody rate="slow" pitch="low">Speaking slower and lower.</prosody>
  <say-as interpret-as="date">2023-05-20</say-as>
</speak>
`;

const { highlighter, validator, formatter } = ssmlProcessor;

console.log("Original SSML:");
console.log(inputSSML);

// SSML の検証
const validationResult = validator.validate(inputSSML);
console.log("\nValidation Result:");
console.log(validationResult);

if (validationResult.isValid) {
  // SSML のハイライト
  const highlightedSSML = highlighter.highlight(inputSSML);
  console.log("\nHighlighted SSML:");
  console.log(highlightedSSML);

  // SSML の整形
  const formattedSSML = formatter.format(inputSSML);
  console.log("\nFormatted SSML:");
  console.log(formattedSSML);
} else {
  console.log("SSML is not valid. Please fix the errors and try again.");
  console.log("Errors:", validationResult.errors);
}
