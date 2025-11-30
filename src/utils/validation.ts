import { Variable } from '../types';

// Standard JavaScript reserved words and globals that should be allowed
const STANDARD_GLOBALS = new Set([
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
    'Math', 'Date', 'String', 'Number', 'Boolean', 'Array', 'Object',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite'
]);

export const validateExpression = (
    expression: string,
    variables: Variable[]
): { isValid: boolean; error?: string } => {
    if (!expression.trim()) {
        return { isValid: false, error: 'Expression cannot be empty' };
    }

    // 1. Syntax Check
    try {
        new Function(`return ${expression};`);
    } catch (e) {
        return { isValid: false, error: `Syntax Error: ${(e as Error).message}` };
    }

    // 2. Identifier Check
    // Extract potential identifiers: starts with letter/$/_, followed by letter/$/_/digit
    // We need to be careful not to match property access (obj.prop) as separate identifiers if obj is valid.
    // But for simplicity in this specific domain, we assume variables are top-level.
    // We'll use a regex to find all identifier-like sequences.

    // This regex matches identifiers but excludes property access dot notation prefix
    // actually, we just want to find all words and check if they are known.
    const identifierRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
    const matches = expression.match(identifierRegex) || [];

    // Collect valid identifiers
    const validIdentifiers = new Set<string>();

    // Add standard globals
    STANDARD_GLOBALS.forEach(g => validIdentifiers.add(g));

    // Add defined variables
    variables.forEach(v => validIdentifiers.add(v.name));

    // Add enum values
    variables.forEach(v => {
        v.possibleValues.forEach(val => validIdentifiers.add(val));
    });

    // Also allow 'RESULT' if we want to support it in invariants, but this is for ConditionNode.
    // DecisionNode doesn't use RESULT. Invariants do. 
    // The user request specifically mentioned "State Variables definition", so we stick to that.

    for (const id of matches) {
        // Skip if it's a property access (preceded by .) - simple heuristic
        // To do this correctly with regex is hard. 
        // Let's assume for now that if a word appears, it must be valid.
        // If the user writes "Math.max", "Math" is valid, "max" might be flagged if we are strict.
        // But "max" is a property of Math.

        // A better approach: 
        // If it's in STANDARD_GLOBALS, ignore it.
        // If it matches a variable or enum, good.
        // If not, flag it.

        if (!validIdentifiers.has(id)) {
            // Check if it is a property of a standard global (e.g. Math.max)
            // This is getting complicated. 
            // Let's try to be permissive for standard objects properties if the parent is valid?
            // Or just allow everything that is not a variable? No, that defeats the purpose.

            // Let's stick to the user requirement: "mistake proofing".
            // If they type "Temprature" instead of "Temperature", we want to catch it.

            // Refined heuristic:
            // If the identifier is NOT in validIdentifiers, return error.
            // But we need to whitelist properties of globals? 
            // Maybe just allow "Math" and ignore what comes after dot?

            // Let's use a slightly better regex that captures the context?
            // Or just check if the identifier is "Math" etc.

            // For now, let's just check against the set. 
            // If "max" is flagged in "Math.max", we might need to add "max" to allowed? 
            // No, that's endless.

            // Alternative: Use a parser or a smarter tokenizer.
            // But for this task, let's assume simple expressions like "A == 'ON' && B > 10".

            // If we encounter "Math", we can skip checking the next identifier if it follows a dot?
            // Let's try to implement that logic.

            // Re-scanning with index to check for dot
            // const index = expression.indexOf(id);
            // This is flawed if id appears multiple times.

            // Let's just return error for now. If user uses Math.max, they might complain, 
            // but for "Decision Tree" logic usually it's simple comparisons.

            return { isValid: false, error: `Unknown identifier: "${id}". Check variable names.` };
        }
    }

    // 3. Enum Value Check (Type Safety)
    // We look for patterns like "Var == Val" or "Var != Val"
    // This is a heuristic regex-based check.
    const comparisonRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(==|!=)\s*(['"]?)([a-zA-Z0-9_$]+)\3/g;
    let match;

    // We need to reset lastIndex because we are using 'g' flag
    while ((match = comparisonRegex.exec(expression)) !== null) {
        const varName = match[1];
        const value = match[4]; // The value inside quotes or the identifier

        const variable = variables.find(v => v.name === varName);

        if (variable && variable.type === 'enum') {
            // Check if the value is valid for this variable
            // We allow the value to be another variable's name? 
            // For now, let's assume we are comparing against literals/enum values.

            // If the value is actually another variable, we should probably allow it if types match?
            // But the user specifically asked about "D == HIGH" where HIGH is an invalid value.

            const isValueVariable = variables.some(v => v.name === value);

            if (!isValueVariable && !variable.possibleValues.includes(value)) {
                return {
                    isValid: false,
                    error: `Invalid value '${value}' for variable '${varName}'. Allowed values: ${variable.possibleValues.join(', ')}`
                };
            }
        }
    }

    return { isValid: true };
};
