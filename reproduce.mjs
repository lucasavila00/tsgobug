import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SyntaxKind } from "@typescript/native-preview/unstable/ast";
import { API, SignatureKind } from "@typescript/native-preview/unstable/sync";

const packageDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(packageDir, "src", "fixture.ts");
const configPath = join(packageDir, ".tsgo-repro.tsconfig.json");
const configContent = JSON.stringify(
	{
		compilerOptions: {
			allowImportingTsExtensions: true,
			baseUrl: packageDir,
			module: "NodeNext",
			moduleResolution: "NodeNext",
			noEmit: true,
			strict: true,
			target: "ES2022",
			types: [],
		},
		files: [fixturePath],
	},
	null,
	"\t",
);

const api = new API({
	cwd: packageDir,
	fs: {
		fileExists: (fileName) => (fileName === configPath ? true : undefined),
		readFile: (fileName) => (fileName === configPath ? configContent : undefined),
	},
});

try {
	const project = api.updateSnapshot({ openProject: configPath }).getProject(configPath);
	if (project == null) {
		throw new Error(`Failed to open project ${configPath}.`);
	}
	const sourceFile = project.program.getSourceFile(fixturePath);
	if (sourceFile == null) {
		throw new Error(`Failed to load fixture ${fixturePath}.`);
	}
	const call = findPrivateBuildCapabilitiesCall(sourceFile);
	const callType = project.checker.getTypeAtLocation(call);
	const calleeType = project.checker.getTypeAtLocation(call.expression);
	const signature = project.checker.getSignaturesOfType(calleeType, SignatureKind.Call)[0];
	if (signature == null) {
		throw new Error("Private call expression callee did not expose a call signature.");
	}
	const returnType = project.checker.getReturnTypeOfSignature(signature);

	console.log(sourceText(sourceFile, call));
	console.log(
		`  checker.getTypeAtLocation(callExpression): ${project.checker.typeToString(callType)}`,
	);
	console.log(
		`  checker.getTypeAtLocation(callExpression.expression): ${project.checker.typeToString(calleeType)}`,
	);
	console.log(
		`  checker.getReturnTypeOfSignature(signature): ${project.checker.typeToString(returnType)}`,
	);
} finally {
	api.close();
}

function findPrivateBuildCapabilitiesCall(sourceFile) {
	let found = null;
	const visit = (node) => {
		if (
			found == null &&
			node.kind === SyntaxKind.CallExpression &&
			sourceText(sourceFile, node).includes("#buildCapabilities")
		) {
			found = node;
			return;
		}
		node.forEachChild(visit);
	};
	visit(sourceFile);
	if (found == null) {
		throw new Error("Fixture did not contain a private #buildCapabilities() call.");
	}
	return found;
}

function sourceText(sourceFile, node) {
	return sourceFile.text.slice(node.pos, node.end).trim();
}
