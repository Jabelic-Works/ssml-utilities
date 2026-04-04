import { tokenize } from "../lexer";
import { SourcePosition, SourceSpan, Token } from "../parser/types";
import { parseTagStructure, TagStructure, TextRange } from "../tag/tag-parser";
import { getValidationProfile } from "./profiles";
import {
  SSMLDiagnostic,
  SSMLValidationOptions,
  SSMLValidationProfile,
  ValidationAttributeRule,
  ValidationTagRule,
} from "./types";

interface OpenTagContext {
  tagName: string;
  rule: ValidationTagRule;
  token: Token;
}

const FALLBACK_TAG_RULE: ValidationTagRule = {
  allowText: true,
  allowedChildren: "any",
  allowUnknownChildren: true,
};

export function validateSSML(
  ssml: string,
  options: SSMLValidationOptions = {}
): SSMLDiagnostic[] {
  if (!ssml) {
    return [];
  }

  const profile = getValidationProfile(options.profile);
  const tokens = tokenize(ssml);
  const diagnostics: SSMLDiagnostic[] = [];
  const stack: OpenTagContext[] = [];

  for (const token of tokens) {
    if (token.type === "text") {
      handleTextToken(token, stack, diagnostics);
      continue;
    }

    const structure = parseTagStructure(token.value);
    if (!structure) {
      continue;
    }

    const tagName = structure.tagName.toLowerCase();
    if (structure.isClosingTag) {
      handleClosingTag(token, tagName, stack, diagnostics);
      continue;
    }

    const rule = profile.supportedTags[tagName];
    validateTagAgainstProfile(token, structure, tagName, rule, diagnostics);
    validateNesting(profile, tagName, rule, stack, token, diagnostics);

    if (rule) {
      validateAttributes(token, structure, tagName, rule, diagnostics);
    }

    if (!structure.isSelfClosing) {
      stack.push({
        tagName,
        rule: rule ?? FALLBACK_TAG_RULE,
        token,
      });
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    if (!unclosed) {
      continue;
    }

    diagnostics.push({
      code: "unclosed-tag",
      severity: "error",
      message: `Tag <${unclosed.tagName}> is not closed.`,
      span: unclosed.token.sourceSpan ?? fallbackSpan(),
      tagName: unclosed.tagName,
    });
  }

  return diagnostics;
}

function handleTextToken(
  token: Token,
  stack: OpenTagContext[],
  diagnostics: SSMLDiagnostic[]
): void {
  if (!token.sourceSpan || token.value.trim().length === 0) {
    return;
  }

  const parent = stack[stack.length - 1];
  if (!parent) {
    return;
  }

  if (parent.rule.allowText === false || parent.rule.selfContained) {
    diagnostics.push({
      code: "text-not-allowed",
      severity: "error",
      message: `Tag <${parent.tagName}> cannot contain text content.`,
      span: token.sourceSpan,
      tagName: parent.tagName,
    });
  }
}

function handleClosingTag(
  token: Token,
  tagName: string,
  stack: OpenTagContext[],
  diagnostics: SSMLDiagnostic[]
): void {
  const span = token.sourceSpan ?? fallbackSpan();
  if (stack.length === 0) {
    diagnostics.push({
      code: "unexpected-closing-tag",
      severity: "error",
      message: `Unexpected closing tag </${tagName}>.`,
      span,
      tagName,
    });
    return;
  }

  const top = stack[stack.length - 1];
  if (top.tagName === tagName) {
    stack.pop();
    return;
  }

  const matchingIndex = findLastMatchingIndex(stack, tagName);
  if (matchingIndex === -1) {
    diagnostics.push({
      code: "unexpected-closing-tag",
      severity: "error",
      message: `Unexpected closing tag </${tagName}>.`,
      span,
      tagName,
    });
    return;
  }

  diagnostics.push({
    code: "invalid-nesting",
    severity: "error",
    message: `Closing tag </${tagName}> does not match the current open tag.`,
    span,
    tagName,
  });

  while (stack.length > matchingIndex + 1) {
    const unclosed = stack.pop();
    if (!unclosed) {
      continue;
    }

    diagnostics.push({
      code: "unclosed-tag",
      severity: "error",
      message: `Tag <${unclosed.tagName}> is not closed before </${tagName}>.`,
      span: unclosed.token.sourceSpan ?? fallbackSpan(),
      tagName: unclosed.tagName,
    });
  }

  stack.pop();
}

function validateTagAgainstProfile(
  token: Token,
  structure: TagStructure,
  tagName: string,
  rule: ValidationTagRule | undefined,
  diagnostics: SSMLDiagnostic[]
): void {
  if (!rule) {
    diagnostics.push({
      code: "unsupported-tag",
      severity: "error",
      message: `Tag <${tagName}> is not supported by the selected validation profile.`,
      span: token.sourceSpan ?? fallbackSpan(),
      tagName,
    });
  }

  for (const invalidFragment of structure.invalidFragments) {
    diagnostics.push({
      code: "invalid-attribute",
      severity: "error",
      message: `Invalid attribute syntax found on <${tagName}>.`,
      span: toNestedSpan(token, invalidFragment),
      tagName,
    });
  }
}

function validateNesting(
  profile: SSMLValidationProfile,
  tagName: string,
  rule: ValidationTagRule | undefined,
  stack: OpenTagContext[],
  token: Token,
  diagnostics: SSMLDiagnostic[]
): void {
  const parent = stack[stack.length - 1];
  if (!parent) {
    return;
  }

  const parentRule = parent.rule;
  if (parentRule.allowedChildren === "any" || parentRule.allowedChildren === undefined) {
    return;
  }

  const childIsKnown = Boolean(rule ?? profile.supportedTags[tagName]);
  if (
    parentRule.allowedChildren.includes(tagName) ||
    (!childIsKnown && parentRule.allowUnknownChildren)
  ) {
    return;
  }

  diagnostics.push({
    code: "invalid-nesting",
    severity: "error",
    message: `Tag <${tagName}> is not allowed inside <${parent.tagName}>.`,
    span: token.sourceSpan ?? fallbackSpan(),
    tagName,
  });
}

function validateAttributes(
  token: Token,
  structure: TagStructure,
  tagName: string,
  rule: ValidationTagRule,
  diagnostics: SSMLDiagnostic[]
): void {
  for (const attribute of structure.attributes) {
    const attributeRule = findAttributeRule(rule, attribute.name);
    if (!attributeRule) {
      diagnostics.push({
        code: "invalid-attribute",
        severity: "error",
        message: `Attribute "${attribute.name}" is not supported on <${tagName}>.`,
        span: toNestedSpan(token, attribute.nameRange),
        tagName,
        attributeName: attribute.name,
      });
      continue;
    }

    if (!attribute.hasExplicitValue && !attributeRule.allowEmpty) {
      diagnostics.push({
        code: "invalid-attribute-value",
        severity: "error",
        message: `Attribute "${attribute.name}" on <${tagName}> must have a value.`,
        span: toNestedSpan(token, attribute.sourceRange),
        tagName,
        attributeName: attribute.name,
      });
      continue;
    }

    if (!attribute.hasExplicitValue) {
      continue;
    }

    if (
      attributeRule.allowedValues &&
      !attributeRule.allowedValues.includes(attribute.value)
    ) {
      diagnostics.push({
        code: "invalid-attribute-value",
        severity: "error",
        message: `Value "${attribute.value}" is not valid for attribute "${attribute.name}" on <${tagName}>.`,
        span: toNestedSpan(token, attribute.valueRange ?? attribute.sourceRange),
        tagName,
        attributeName: attribute.name,
      });
      continue;
    }

    if (
      attributeRule.validateValue &&
      !attributeRule.validateValue(attribute.value)
    ) {
      diagnostics.push({
        code: "invalid-attribute-value",
        severity: "error",
        message: `Value "${attribute.value}" is not valid for attribute "${attribute.name}" on <${tagName}>.`,
        span: toNestedSpan(token, attribute.valueRange ?? attribute.sourceRange),
        tagName,
        attributeName: attribute.name,
      });
    }
  }
}

function findAttributeRule(
  rule: ValidationTagRule,
  attributeName: string
): ValidationAttributeRule | undefined {
  if (rule.attributes?.[attributeName]) {
    return rule.attributes[attributeName];
  }

  const matchedPattern = rule.attributePatterns?.find((patternRule) =>
    patternRule.pattern.test(attributeName)
  );

  return matchedPattern?.rule ?? undefined;
}

function findLastMatchingIndex(
  stack: OpenTagContext[],
  tagName: string
): number {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].tagName === tagName) {
      return index;
    }
  }

  return -1;
}

function toNestedSpan(token: Token, range: TextRange): SourceSpan {
  if (!token.sourceSpan) {
    return fallbackSpan();
  }

  const start = advancePosition(token.sourceSpan.start, token.value.slice(0, range.start));
  const end = advancePosition(token.sourceSpan.start, token.value.slice(0, range.end));

  return { start, end };
}

function advancePosition(
  start: SourcePosition,
  source: string
): SourcePosition {
  let current: SourcePosition = {
    offset: start.offset,
    line: start.line,
    column: start.column,
  };

  for (const char of source) {
    current = stepPosition(current, char);
  }

  return current;
}

function stepPosition(position: SourcePosition, char: string): SourcePosition {
  const next: SourcePosition = {
    offset: position.offset + 1,
    line: position.line,
    column: position.column,
  };

  if (char === "\n") {
    next.line += 1;
    next.column = 1;
  } else {
    next.column += 1;
  }

  return next;
}

function fallbackSpan(): SourceSpan {
  return {
    start: { offset: 0, line: 1, column: 1 },
    end: { offset: 0, line: 1, column: 1 },
  };
}
