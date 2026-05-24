# tsgo private call expression type bug

This package is a minimal reproduction for an `@typescript/native-preview` checker issue.
For a private method call expression, `checker.getTypeAtLocation(callExpression)` returns
the callable function type instead of the call result type.

## Reproduce

```sh
npm install
npm run reproduce
```

Expected current output:

```txt
this.#buildCapabilities()
  checker.getTypeAtLocation(callExpression): () => Result
  checker.getTypeAtLocation(callExpression.expression): () => Result
  checker.getReturnTypeOfSignature(signature): Result
```

The bug is that `checker.getTypeAtLocation(callExpression)` returns the callable function
type:

```txt
() => Result
```

The expected type is the call result type:

```txt
Result
```

The script also prints `checker.getReturnTypeOfSignature(signature)`, which shows the
checker can still recover the correct result type from the callee signature.

## Why this matters

Code that asks the checker for the type of an arbitrary expression generally expects a call
expression to resolve to its result type. With this behavior, tools that inspect expressions
must add a workaround for private method calls: resolve the callee's call signature and use
`checker.getReturnTypeOfSignature(...)` for call expression values.

That workaround should be removable once this reproduction prints `Result` for
`checker.getTypeAtLocation(callExpression)`.
