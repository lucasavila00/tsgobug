import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const packageDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(packageDir, "src", "fixture.ts");

const program = ts.createProgram({
	rootNames: [fixturePath],
	options: {
		allowImportingTsExtensions: true,
		baseUrl: packageDir,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		noEmit: true,
		strict: true,
		target: ts.ScriptTarget.ES2022,
		types: [],
	},
});

const sourceFile = program.getSourceFile(fixturePath);
if (sourceFile == null) {
	throw new Error(`Failed to load fixture ${fixturePath}.`);
}

const checker = program.getTypeChecker();
const call = findPrivateBuildCapabilitiesCall(sourceFile);
const callType = checker.getTypeAtLocation(call);
const calleeType = checker.getTypeAtLocation(call.expression);
const signature = checker.getSignaturesOfType(calleeType, ts.SignatureKind.Call)[0];
if (signature == null) {
	throw new Error("Private call expression callee did not expose a call signature.");
}
const returnType = checker.getReturnTypeOfSignature(signature);

console.log(call.getText(sourceFile));
console.log(`  checker.getTypeAtLocation(callExpression): ${checker.typeToString(callType)}`);
console.log(
	`  checker.getTypeAtLocation(callExpression.expression): ${checker.typeToString(calleeType)}`,
);
console.log(
	`  checker.getReturnTypeOfSignature(signature): ${checker.typeToString(returnType)}`,
);

function findPrivateBuildCapabilitiesCall(sourceFile) {
	let found = null;
	const visit = (node) => {
		if (
			found == null &&
			ts.isCallExpression(node) &&
			node.getText(sourceFile).includes("#buildCapabilities")
		) {
			found = node;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	if (found == null) {
		throw new Error("Fixture did not contain a private #buildCapabilities() call.");
	}
	return found;
}
