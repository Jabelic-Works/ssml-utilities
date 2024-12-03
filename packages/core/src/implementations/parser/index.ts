import { SSMLDAG } from "../dag";
import { tokenize } from "../lexer";
import { buildDAGFromTokens } from "../dag/builder";
import { Result } from "../result";

export function parseSSML(ssml: string): Result<SSMLDAG, string> {
  const tokens = tokenize(ssml);
  const dagResult = buildDAGFromTokens(tokens);
  if (dagResult.ok) {
    console.log("Parsed DAG:", debugPrintDAG(dagResult.value));
  } else {
    console.error("Failed to parse SSML:", dagResult.error);
  }
  return dagResult;
}

function debugPrintDAG(dag: SSMLDAG): string {
  return dag.debugPrint();
}

export function debugParseSSML(ssml: string): string {
  const result = parseSSML(ssml);
  if (result.ok) {
    return debugPrintDAG(result.value);
  } else {
    return `Error: ${result.error}`;
  }
}
