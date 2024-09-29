export interface SSMLValidator {
  validate(ssml: string): ValidationResult;
}
type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};
type ValidationError = {
  message: string;
  line: number;
  column: number;
};

export const ssmlValidator: SSMLValidator = {
  validate(ssml: string): ValidationResult {
    const errors: ValidationError[] = [];
    const stack: string[] = [];
    const regex = /<(\/?)([\w-]+)([^>]*)>/g;
    let match;

    while ((match = regex.exec(ssml)) !== null) {
      const [, slash, tagName, attrs] = match;
      if (!slash) {
        // Opening tag
        if (attrs.endsWith("/")) {
          // Self-closing tag, don't push to stack
        } else {
          stack.push(tagName);
        }
      } else {
        // Closing tag
        if (stack.pop() !== tagName) {
          errors.push({
            message: `Mismatched closing tag: ${tagName}`,
            line: 1, // You might want to implement line counting
            column: match.index,
          });
        }
      }
    }

    if (stack.length > 0) {
      errors.push({
        message: `Unclosed tags: ${stack.join(", ")}`,
        line: 1,
        column: ssml.length,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
