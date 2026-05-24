Title: getTypeAtLocation returns method type for private method call

Using `@typescript/native-preview`, `checker.getTypeAtLocation` returns the
callable method type for a private method call expression instead of the call
result type.

Example:

```ts
type Result = { readonly value: string };

export class Cache {
	run(): Result {
		return this.#buildCapabilities();
	}

	#buildCapabilities(): Result {
		return { value: "ok" };
	}
}
```

For the expression:

```ts
this.#buildCapabilities()
```

tsgo reports:

```txt
checker.getTypeAtLocation(callExpression): () => Result
checker.getTypeAtLocation(callExpression.expression): () => Result
checker.getReturnTypeOfSignature(signature): Result
```

Regular TypeScript reports:

```txt
checker.getTypeAtLocation(callExpression): Result
checker.getTypeAtLocation(callExpression.expression): () => Result
checker.getReturnTypeOfSignature(signature): Result
```

Expected: `checker.getTypeAtLocation(callExpression)` should return `Result`.

Actual: it returns `() => Result`.

Repro:

```sh
npm install
npm run reproduce
npm run reproduce:ts
```
