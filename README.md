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
last step)
* ability to pass the arbitrary values between steps (using `this.pass()`)
* pure js code (no dependencies, < 200 lines of code)
* full test coverage ([100%](https://rawgit.com/2do2go/node-twostep/master/coverage/index.html))
* super battle-tested (we ubiquitously use twostep in a big project
(50 000+ lines of code))

[![Build Status](https://travis-ci.org/2do2go/node-twostep.svg?branch=master)](https://travis-ci.org/2do2go/node-twostep)


## Installation

```sh
npm install twostep
```


## Usage

All steps (functions) passed to the `Step` will be executed in series. Inside
each step `this.slot()` for wating of async call, `this.pass()` for
passing value to the next step or `this.makeGroup()` for creating group (for
having results grouped to array) can be called.

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
step. We can avoid writing this annoying line using `Steppy`. With `Steppy`
example described above transforms to

```js

var Steppy = require('twostep').Steppy,
	fs = require('fs');

Steppy(
	function() {
		this.pass(__filename + '.bak');
		fs.readFile(__filename, 'utf8', this.slot());
	},
	function(err, bakFile, content) {
		this.pass(bakFile);
		fs.readdir(__dirname, this.slot());
		fs.writeFile(bakFile, content, this.slot())
	},
	function(err, bakFile, dirContent) {
		console.log('%s successfully written', bakFile);
		this.pass(dirContent);
		var group = this.makeGroup();
		dirContent.forEach(function(name) {
			fs.stat(name, group.slot());
		});
	},
	function(err, dirContent, stats) {
		var fileNames = dirContent.filter(function(name, i) {
			return stats[i].isFile();
		});
		console.log('files in dir: %s', fileNames);
	},
	function(err) {
		console.log('Error occured: ', err.stack || err);
		process.exit(1);
	}
);

```


## API

### Step(step1, step2, stepN...)

Steps container accepts functions and executes them in series. If error is
occured inside step it will be passed to the next step as first argument. First
argument of the step is always an error (falsy if no error), subsequent
arguments - values passed to the reserved slots (created via `this.pass()`,
`this.slot()` or `this.makeGroup()`) of previous step in the order the slots
were reserved.

### Steppy(step1, step2, stepN...)

Same steps container as `Step` but it also automatically wraps every single step
with error check and calls the last step if error occurs.

### Methods which can be called inside each step

#### this.slot()

Reserves one slot at the current step. Next step will be called when
all reserved slots of current step will be filled with data or the error occurs.
Returns callback `function(err, data)` to fill the slot with data.

#### this.pass(value1, value2, valueN...)

Passes one or several synchronous values to the next step.

#### this.makeGroup()

Reserves slot, creates and returns a group, all results of which will be passed
into the reserved slot as a single array. `pass`, `slot` methods can be called
for created group. If group methods were not called empty array will be passed
into reserved slot.



## Tests

into cloned repository run

```sh
npm install
```

after installtion run

```sh
npm test
```

for run tests and generate coverage report run

```sh
npm run testAndCover
```

detailed coverage report will be saved at ./coverage/index.html


## License

MIT


[step]: https://github.com/creationix/step
