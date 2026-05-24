type Result = { readonly value: string };

export class Cache {
	run(): Result {
		return this.#buildCapabilities();
	}

	#buildCapabilities(): Result {
		return { value: "ok" };
	}
}
