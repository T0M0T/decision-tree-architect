import { Variable } from '../types';

// Regex patterns
export const REGEX_VAR_NAME = /[a-zA-Z_$][a-zA-Z0-9_$]*/;
export const REGEX_OPERATOR = /==|!=/;
// Capture: Variable, Operator, Value
export const REGEX_COMPARISON = new RegExp(`(${REGEX_VAR_NAME.source})\\s*(${REGEX_OPERATOR.source})\\s*(.+)`);

/**
 * Formats the expression by ensuring proper spacing around operators and parentheses.
 */
export const formatExpression = (expression: string): string => {
    return expression
        .replace(/\s*(==|!=|&&|\|\|)\s*/g, ' $1 ') // Add spaces around operators
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .replace(/\(\s+/g, '(') // Remove space after (
        .replace(/\s+\)/g, ')') // Remove space before )
        .trim();
};

/**
 * Calculates the completion suggestion based on the current input and cursor position.
 */
export const getCompletionSuggestion = (
    value: string,
    cursorPos: number,
    variables: Variable[]
): string => {
    // 1. Find the word being typed (prefix)
    let start = cursorPos - 1;
    while (start >= 0 && /[a-zA-Z0-9_$]/.test(value[start])) {
        start--;
    }
    start++; // Start of the word

    const prefix = value.slice(start, cursorPos);

    // If prefix is empty or cursor is not at the end of the prefix, skip
    if (!prefix || (cursorPos < value.length && /[a-zA-Z0-9_$]/.test(value[cursorPos]))) {
        return '';
    }

    // 2. Determine context (Variable or Enum Value)
    const textBefore = value.slice(0, start).trim();
    let candidates: string[] = [];

    // Check for "Variable == " context
    const enumContextMatch = textBefore.match(/([a-zA-Z0-9_$]+)\s*(==|!=)\s*$/);
    if (enumContextMatch) {
        const varName = enumContextMatch[1];
        const variable = variables.find(v => v.name === varName);
        if (variable && variable.type === 'enum') {
            candidates = variable.possibleValues.filter(v => v.toUpperCase().startsWith(prefix.toUpperCase()));
        }
    }

    // If no enum context, search variables
    if (candidates.length === 0) {
        candidates = variables
            .map(v => v.name)
            .filter(n => n.toUpperCase().startsWith(prefix.toUpperCase()));
    }

    if (candidates.length > 0) {
        const match = candidates[0];
        // Return the part of match that is NOT in prefix
        return match.slice(prefix.length);
    }

    return '';
};

/**
 * Parses a simple comparison expression like "A == HIGH".
 * Returns null if it doesn't match the pattern.
 */
export const parseComparison = (expression: string) => {
    const match = expression.match(REGEX_COMPARISON);
    if (!match) return null;
    return {
        variable: match[1],
        operator: match[2],
        value: match[3].trim().replace(/^['"]|['"]$/g, '') // Remove quotes
    };
};

/**
 * Checks if a string is a valid JavaScript identifier.
 */
export const isValidIdentifier = (str: string): boolean => {
    // Basic check: starts with letter/$/_, followed by letter/$/_/digit
    // Also exclude reserved words if necessary, but for now just syntax check
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
};
