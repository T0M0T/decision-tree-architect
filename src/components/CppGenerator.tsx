import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Copy, Download, Code, FileCode } from 'lucide-react';

export const CppGenerator = () => {
    const {
        variables,
        nodes,
        edges,
        testCases,
        simulationResults,
        modelCheckerResults
    } = useStore();

    const [testMode, setTestMode] = useState<'simulation' | 'modelchecker'>('simulation');

    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_]/g, '_');

    const generateCode = useMemo(() => {
        if (nodes.length === 0) return '// No decision tree defined.';

        const rootNode = nodes.find(n => n.type === 'root');
        if (!rootNode) return '// No root node found.';

        let code = `#include <iostream>\n#include <string>\n#include <vector>\n#include <memory>\n#include <functional>\n#include <cassert>\n\n`;

        // 1. Enums
        code += `// --- Enums ---\n`;
        variables.forEach(v => {
            const enumName = sanitize(v.name);
            code += `enum class ${enumName} {\n`;
            v.possibleValues.forEach((val: string) => {
                code += `    ${sanitize(val)},\n`;
            });
            // Add Error/Missing value for safety
            code += `    ERROR_MISSING\n`;
            code += `};\n\n`;
        });

        // 2. Context Struct
        code += `// --- Context ---\n`;
        code += `struct Context {\n`;
        variables.forEach(v => {
            const typeName = sanitize(v.name);
            const varName = typeName.toLowerCase();
            code += `    ${typeName} ${varName};\n`;
        });
        code += `};\n\n`;

        // 3. Node Classes (Composite Pattern)
        code += `// --- Node Classes ---\n`;
        code += `class Node {\n`;
        code += `public:\n`;
        code += `    virtual ~Node() = default;\n`;
        code += `    virtual std::string evaluate(const Context& ctx) const = 0;\n`;
        code += `};\n\n`;

        code += `class LeafNode : public Node {\n`;
        code += `    std::string result;\n`;
        code += `public:\n`;
        code += `    explicit LeafNode(std::string res) : result(std::move(res)) {}\n`;
        code += `    std::string evaluate(const Context&) const override {\n`;
        code += `        return result;\n`;
        code += `    }\n`;
        code += `};\n\n`;

        code += `class DecisionNode : public Node {\n`;
        code += `    using ConditionFunc = std::function<bool(const Context&)>;\n`;
        code += `    ConditionFunc condition;\n`;
        code += `    std::shared_ptr<Node> trueNode;\n`;
        code += `    std::shared_ptr<Node> falseNode;\n`;
        code += `public:\n`;
        code += `    DecisionNode(ConditionFunc cond, std::shared_ptr<Node> yes, std::shared_ptr<Node> no)\n`;
        code += `        : condition(std::move(cond)), trueNode(std::move(yes)), falseNode(std::move(no)) {}\n`;
        code += `    std::string evaluate(const Context& ctx) const override {\n`;
        code += `        if (condition(ctx)) {\n`;
        code += `            return trueNode->evaluate(ctx);\n`;
        code += `        } else {\n`;
        code += `            return falseNode->evaluate(ctx);\n`;
        code += `        }\n`;
        code += `    }\n`;
        code += `};\n\n`;

        // Helper to transpile expression "A == HIGH" -> "ctx.a == A::HIGH"
        const transpileExpression = (expr: string): string => {
            if (!expr) return "false";

            let transpiled = expr;
            // Regex: Variable Operator Value
            const regex = /\b(\w+)\s*(==|!=)\s*['"]?(\w+)['"]?/g;

            transpiled = transpiled.replace(regex, (match, varName, op, val) => {
                const variable = variables.find(v => v.name === varName);
                if (variable) {
                    const sanitizedVarName = sanitize(variable.name);
                    const paramName = sanitizedVarName.toLowerCase();

                    if (variable.possibleValues.includes(val)) {
                        const sanitizedVal = sanitize(val);
                        // Add "ctx." prefix
                        return `ctx.${paramName} ${op} ${sanitizedVarName}::${sanitizedVal}`;
                    }
                }
                return match;
            });
            return transpiled;
        };

        // 4. Tree Construction
        code += `// --- Helper Functions ---
std::shared_ptr<Node> Leaf(std::string result) {
    return std::make_shared<LeafNode>(std::move(result));
}

std::shared_ptr<Node> Decision(std::function<bool(const Context&)> cond, std::shared_ptr<Node> yes, std::shared_ptr<Node> no) {
    return std::make_shared<DecisionNode>(std::move(cond), std::move(yes), std::move(no));
}

// --- Tree Construction ---
\n`;
        code += `std::shared_ptr<Node> build_tree() {\n`;

        // Flattened generation logic
        const generateFlatTree = (): string => {
            const rootNode = nodes.find(n => n.type === 'root');
            if (!rootNode) return `    return Leaf("ERROR: No Root Node");`;

            const outEdge = edges.find(e => e.source === rootNode.id);
            if (!outEdge) return `    return Leaf("ERROR: Root disconnected");`;

            const startNodeId = outEdge.target;
            const visited = new Set<string>();
            const sequence: string[] = [];

            // Post-order traversal to ensure children are defined before parents
            const visit = (nodeId: string) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);

                const node = nodes.find(n => n.id === nodeId);
                if (!node) return;

                if (node.type === 'decision') {
                    const yesEdge = edges.find(e => e.source === nodeId && e.sourceHandle === 'yes');
                    const noEdge = edges.find(e => e.source === nodeId && e.sourceHandle === 'no');
                    if (yesEdge) visit(yesEdge.target);
                    if (noEdge) visit(noEdge.target);
                }
                sequence.push(nodeId);
            };

            visit(startNodeId);

            let body = "";

            const getVarName = (id: string): string => {
                const n = nodes.find(node => node.id === id);
                if (n && n.data && n.data.nodeId) {
                    return `n_${sanitize(n.data.nodeId as string)}`;
                }
                return `n_${sanitize(id)}`;
            };

            sequence.forEach(nodeId => {
                const node = nodes.find(n => n.id === nodeId);
                if (!node) return;

                const varName = getVarName(nodeId);

                if (node.type === 'leaf') {
                    const nId = node.data.nodeId || "";
                    const label = node.data.label as string || "";
                    const sanitizedLabel = sanitize(label).toUpperCase();
                    body += `    auto ${varName} = Leaf("${nId}_${sanitizedLabel}");\n`;
                } else if (node.type === 'decision') {
                    const expression = node.data.expression as string;
                    const cppCondition = transpileExpression(expression || "");

                    const yesEdge = edges.find(e => e.source === nodeId && e.sourceHandle === 'yes');
                    const noEdge = edges.find(e => e.source === nodeId && e.sourceHandle === 'no');

                    const yesVar = yesEdge ? getVarName(yesEdge.target) : `Leaf("Undefined (Yes)")`;
                    const noVar = noEdge ? getVarName(noEdge.target) : `Leaf("Undefined (No)")`;

                    body += `    auto ${varName} = Decision(\n`;
                    body += `        [](const Context& ctx) { return ${cppCondition}; },\n`;
                    body += `        ${yesVar},\n`;
                    body += `        ${noVar}\n`;
                    body += `    );\n`;
                }
            });

            body += `\n    return ${getVarName(startNodeId)};`;
            return body;
        };

        code += generateFlatTree();
        code += `\n}\n\n`;

        // 5. Test Cases
        code += `// --- Test Cases ---\n`;
        code += `void run_tests() {\n`;
        code += `    auto root = build_tree();\n`;
        code += `    std::cout << "Running tests..." << std::endl;\n\n`;

        if (testMode === 'simulation') {
            testCases.forEach(tc => {
                const result = simulationResults[tc.id];
                if (!result || !result.result) return;

                // Find the leaf node to construct the expected string "ID_LABEL"
                const leafNode = nodes.find(n => n.data.nodeId === result.result);
                let expectedStr = result.result;
                if (leafNode) {
                    const label = leafNode.data.label as string || "";
                    const sanitizedLabel = sanitize(label).toUpperCase();
                    expectedStr = `${result.result}_${sanitizedLabel}`;
                }

                code += `    // Case: ${tc.name}\n`;
                code += `    assert(root->evaluate(Context{\n`;
                code += variables.map(v => {
                    const val = tc.values[v.name];
                    const enumType = sanitize(v.name);
                    const varName = enumType.toLowerCase();
                    if (!val) {
                        return `        .${varName} = ${enumType}::ERROR_MISSING`;
                    }
                    return `        .${varName} = ${enumType}::${sanitize(val)}`;
                }).join(',\n');
                code += `\n    }) == "${expectedStr}");\n`;
                code += `    std::cout << "  [PASS] ${tc.name}" << std::endl;\n\n`;
            });
        } else {
            // Model Checker
            modelCheckerResults.forEach((res, idx) => {
                // Find the leaf node to construct the expected string "ID_LABEL"
                const leafNode = nodes.find(n => n.data.nodeId === res.result);
                let expectedStr = res.result;
                if (leafNode) {
                    const label = leafNode.data.label as string || "";
                    const sanitizedLabel = sanitize(label).toUpperCase();
                    expectedStr = `${res.result}_${sanitizedLabel}`;
                }

                code += `    // Pattern ${idx + 1}\n`;
                code += `    assert(root->evaluate(Context{\n`;
                code += variables.map(v => {
                    const val = res.combo[v.name];
                    const enumType = sanitize(v.name);
                    const varName = enumType.toLowerCase();
                    if (!val) {
                        return `        .${varName} = ${enumType}::ERROR_MISSING`;
                    }
                    return `        .${varName} = ${enumType}::${sanitize(val)}`;
                }).join(',\n');
                code += `\n    }) == "${expectedStr}");\n`;
            });
            code += `    std::cout << "  [PASS] Checked ${modelCheckerResults.length} patterns." << std::endl;\n\n`;
        }

        code += `    std::cout << "All tests passed successfully!" << std::endl;\n`;
        code += `}\n\n`;

        // 6. Main
        code += `int main() {\n`;
        code += `    try {\n`;
        code += `        run_tests();\n`;
        code += `    } catch (const std::exception& e) {\n`;
        code += `        std::cerr << "Test failed: " << e.what() << std::endl;\n`;
        code += `        return 1;\n`;
        code += `    }\n`;
        code += `    return 0;\n`;
        code += `}\n`;

        return code;
    }, [variables, nodes, edges, testCases, simulationResults, modelCheckerResults, testMode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generateCode);
        alert('Code copied to clipboard!');
    };

    const handleDownload = () => {
        const blob = new Blob([generateCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'decision_tree.cpp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FileCode className="text-blue-400" />
                        C++ Code Generator
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Generate executable C++ code and tests from your decision tree.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <Copy size={16} />
                        Copy Code
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                    >
                        <Download size={16} />
                        Download .cpp
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Settings Panel */}
                <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4 border border-gray-700 h-fit">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Code size={18} />
                        Generation Settings
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Test Generation Mode</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-900/50 cursor-pointer hover:bg-gray-700/50 transition-colors">
                                    <input
                                        type="radio"
                                        name="testMode"
                                        value="simulation"
                                        checked={testMode === 'simulation'}
                                        onChange={(e) => setTestMode(e.target.value as any)}
                                        className="text-blue-500 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">Selected Cases</div>
                                        <div className="text-xs text-gray-500">Use cases from Simulation panel</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-900/50 cursor-pointer hover:bg-gray-700/50 transition-colors">
                                    <input
                                        type="radio"
                                        name="testMode"
                                        value="modelchecker"
                                        checked={testMode === 'modelchecker'}
                                        onChange={(e) => setTestMode(e.target.value as any)}
                                        className="text-blue-500 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">All Patterns</div>
                                        <div className="text-xs text-gray-500">Use all combinations from Model Checker</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg text-xs text-blue-200">
                            <p>
                                <strong>Note:</strong> Ensure you have run the Simulation or Model Checker to populate the test data before generating code.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Code Preview */}
                <div className="lg:col-span-3 bg-gray-950 rounded-xl border border-gray-700 flex flex-col overflow-hidden shadow-2xl">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-mono text-gray-400">decision_tree.cpp</span>
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto font-mono text-sm text-gray-300 leading-relaxed">
                        {generateCode}
                    </pre>
                </div>
            </div>
        </div>
    );
};
