# TwoStep


Is a simple control-flow library for node.js that makes serial execution,
parallel execution and error handling painless. Inspired by [step] twostep was
based on Tim Caswell ([step] author) [gist](https://gist.github.com/1524578),
but later it was refactored and almost totally rewritten. Twostep follows and
extends the ideas behind the [step].

Features

* serial and parallel (with results grouping support) execution
* simple error handling
* simplified error handling for common use case (when error handled at the
last step) using Steppy (see details below)
* ability to pass the arbitrary values between steps (using `this.pass()`)
* pure js code (no dependencies, < 200 lines of code)
* good test coverage
* super battle-tested (we ubiquitously use twostep in a big project
(50 000+ lines of code))


## Installation

```sh
npm install twostep
```


## Usage

All steps (functions) passed to the `Step` will be executed in series. Inside
each step `this.slot()` for wating of async call, `this.pass()` for
passing value to the next step or `this.makeGroup()` for creating group (for
 calling `slot()` or `pass()` for the group and having results
 grouped to array) can be called. If error is occured inside step it will be
 passed to the next step as first argument. First argument of the step is
 always an error (falsy if no error), subsequent arguments - results of calls
 accepted by `this.pass()`, `this.slot()` or `this.makeGroup()` in the order
they were called at previous step.

```js

var Step = require('twostep').Step,
	fs = require('fs');

Step(
	function() {
		// pass filename to the next step as second argument (error always first)
		this.pass(__filename + '.bak');
		// read the file content, it will be passed as third argument (because
		// this.pass was called before)
		fs.readFile(__filename, 'utf8', this.slot());
	},
	function(err, bakFile, content) {
		// if we have an error, throw it to skip this step
		if (err) throw err;
		this.pass(bakFile);
		fs.readdir(__dirname, this.slot());
		fs.writeFile(bakFile, content, this.slot())
		// `readdir` and `writeFile` will be exeuted in parallel when both of
		// them done next step will be called
	},
	function(err, bakFile, dirContent) {
		if (err) throw err;
		console.log('%s successfully written', bakFile);
		this.pass(dirContent);
		// make the group
		var group = this.makeGroup();
		// wait for ordered results using group.slot() - all results
		// will be passed as an array with same order (as at calls)
		dirContent.forEach(function(name) {
			fs.stat(name, group.slot());
		});
	},
	function(err, dirContent, stats) {
		if (err) throw err;
		var fileNames = dirContent.filter(function(name, i) {
			return stats[i].isFile();
		});
		console.log('files in dir: %s', fileNames);
		// don't call next step manually, it's the last step if no error
	},
	function(err) {
		// this step will be called only if an error was occured at any step
		// above, so here we can handle the error.
		console.log('Error occured: ', err.stack || err);
		process.exit(1);
	}
);

```

In the example above we did `if (err) throw err;` at the start of every step to
pass the error (if it exists) to the next step for handle the error at the last
step. We can simply avoid writing this annoying line using `Steppy` (can be
imported as `var Steppy = require('twostep').Steppy`) instead of
`Step`. `Steppy` automatically wraps every single step with error check and
calls the last step if error occurs.

Created group has same api as `this` but if `pass()` or `slot()` was
not called for the group empty array will be passed to the next step as group result.
If `this.pass()`, `this.slot()` or `this.makeGroup()` will not be called then
next step will never be called.


## Tests

into cloned repository run

```sh
npm install
```

after installtion run

```sh
npm test
```


[step]: https://github.com/creationix/step
