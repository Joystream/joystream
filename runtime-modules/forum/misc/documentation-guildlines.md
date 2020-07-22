### Documentation Guidelines:
<!-- Original author of paragraph: Various. Based on collation of review comments to PRs addressing issues with -->
<!-- label 'S3-SRML' in https://github.com/paritytech/substrate-developer-hub/issues -->

Documentation comments (i.e. `/// comment`) - should accompany module functions and be restricted to the module interface, not the internals of the module implementation. Only state inputs, outputs, and a brief description that mentions whether calling it requires root, but without repeating the source code details. Capitalise the first word of each documentation comment and end it with a full stop.
See [Generic example of annotating source code with documentation comments](https://github.com/paritytech/substrate#72-contributing-to-documentation-for-substrate-packages)

	* Self-documenting code - Try to refactor code to be self-documenting.
	* Code comments - Supplement complex code with a brief explanation, not every line of code.
	* Identifiers - surround by backticks (i.e. `INHERENT_IDENTIFIER`, `InherentType`, `u64`
	* Usage scenarios - should be simple doctests. The compiler should ensure they stay valid.
	* Extended tutorials - should be moved to external files and refer to.
