module.exports = TwoStep;
module.exports.Steppy = Steppy;

var slice = Array.prototype.slice;

/**
 * Group represents one step in Step's execution flow. Makes a decision when
 * the execution should jump to the next step.
 *
 * @param {function(err, args)} callback
 *   Callback to be called on successful execution end

 * @param {function(err, args)} [errorCallback]
 *   If defined, will be called in case of error (default value: callback arg)
 */
function Group(callback, errorCallback) {
	this.args = [null];
	this.left = 0;
	this.callback = callback;
	this.errorCallback = errorCallback || callback;
	this.isDone = false;
}

Group.prototype.done = function done() {
	if (this.isDone) {
		return;
	}
	this.isDone = true;
	//Don't go to next step if no args is passed
	if (this.args.length != 1) {
		this.callback.apply(null, this.args);
	}
};

Group.prototype.error = function error(err) {
	if (this.isDone) {
		return;
	}
	this.isDone = true;
	this.errorCallback(err);
};

// Simple utility for passing a sync value to the next step.
Group.prototype.pass = function pass() {
	var values = slice.call(arguments);
	for (var i = 0, l = values.length; i < l; i++) {
		this.args.push(values[i]);
	}
};

// Register a slot in the next step and return a callback
Group.prototype.slot = function slot() {
	var group = this;
	var index = group.args.length;
	group.args.length++;
	group.left++;
	return function (err, data) {
		process.nextTick(function() {
			if (err) {
				return group.error(err);
			}
			group.args[index] = data;
			if (--group.left === 0) {
				group.done();
			}
		});
	};
};

// Creates a nested group where several callbacks go into a single array.
Group.prototype.makeGroup = function makeGroup() {
	var group = this;
	var index = this.args.length;
	this.args.length++;
	group.left++;
	return new Group(function (err) {
		if (err) {
			return group.error(err);
		}
		var data = slice.call(arguments, 1);
		group.args[index] = data;
		if (--group.left === 0) {
			group.done();
		}
	});
};

/**
 * TwoStep section
 */

// Execute steps immediately
function TwoStep() {
	exec(slice.call(arguments), []);
}

// Create a composite function with steps built-in
TwoStep.fn = function () {
	var steps = slice.call(arguments);
	return function () {
		var args = slice.call(arguments);
		var callback = args.pop();
		exec(steps, args, callback);
	};
};

// Stepper function
function exec(steps, args, callback) {
	var pos = 0;
	function next() {
		var step = steps[pos++];
		if (!step) {
			callback && callback.apply(null, arguments);
			return;
		}
		var group = new Group(next);
		try {
			step.apply(group, arguments);
		} catch (e) {
			group.error(e);
			return;
		}
		if (group.left === 0) {
			group.done();
		}
	};
	next.apply(null, args);
}

// Expose just for fun and extensibility
TwoStep.Group = Group;

//Simple step function, just return callack
TwoStep.simple = function(callback) {
	return callback;
};

//If error happens somewhere after this step, just throw Error next
TwoStep.throwIfError = function(callback) {
	return function() {
		if (arguments[0]) {
			throw arguments[0];
		}
		return callback.apply(this, arguments);
	};
};


/**
 * Steppy section
 */

// Execute steps immediately
function Steppy() {
	execSteppy(slice.call(arguments), []);
}

// Stepper function
function execSteppy(steps, args, callback) {
	if (steps.length < 2) {
		throw new Error('Actually, you don\'t want to run less than two steps');
	}
	var pos = 0;
	var errorHandler = steps[steps.length - 1];

	function next() {
		var step = steps[pos++];
		if (!step) {
			callback && callback.apply(null, arguments);
			return;
		}
		var group = new Group(next, errorHandler);
		try {
			step.apply(group, arguments);
		} catch (e) {
			group.error(e);
			return;
		}
		if (group.left === 0) {
			group.done();
		}
	};
	next.apply(null, args);
}

// Expose just for fun and extensibility
Steppy.Group = Group;
