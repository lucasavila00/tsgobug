Title:
checker.getTypeAtLocation returns callable type instead of result type for private method calls


Description:
When using @typescript/native-preview, checker.getTypeAtLocation(callExpression) returns the callable function type for a private method call like
this.#buildCapabilities() instead of the call result type. In the reproduction, the call expression is typed as () => Result, while the expected type is
Result. The correct result type is still available through the callee signature via checker.getReturnTypeOfSignature(signature).