import { SSMLDiagnostic } from "@ssml-utilities/validation";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function mergeClasses(
  ...classNames: Array<string | false | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}

export function getIntersectingDiagnostics(
  diagnostics: SSMLDiagnostic[] | undefined,
  startOffset: number,
  endOffset: number,
  codes?: string[]
): SSMLDiagnostic[] {
  if (!diagnostics || diagnostics.length === 0) {
    return [];
  }

  return diagnostics.filter((diagnostic) => {
    const matchesCode = !codes || codes.includes(diagnostic.code);
    const intersects =
      diagnostic.span.start.offset < endOffset &&
      diagnostic.span.end.offset > startOffset;

    return matchesCode && intersects;
  });
}
