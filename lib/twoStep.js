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
	this.args = this.args.concat(values);
};

/**
 * Reserve space for one argument in the `args` array.
 * @return {Number} slot index
 */
Group.prototype._reserveSlot = function() {
	this.left++;
	return this.args.push(undefined) - 1;
};

/**
 * Fill the reserved slot addressed by `index` with the given `value`.
 *
 */
Group.prototype._fillSlot = function(index, value) {
	this.args[index] = value;
	if (!--this.left) {
		this.done();
	}
};

// Register a slot in the next step and return a callback
Group.prototype.slot = function slot() {
	var group = this;
	var index = group._reserveSlot();

	return function (err, data) {
		process.nextTick(function() {
			if (err) {
				return group.error(err);
			}
			group._fillSlot(index, data);
		});
	};
};

// Creates a nested group where several callbacks go into a single array.
Group.prototype.makeGroup = function makeGroup() {
	var group = this;
	var index = group._reserveSlot();
	return new Group(function (err) {
		if (err) {
			return group.error(err);
		}
		var data = slice.call(arguments, 1);
		group._fillSlot(index, data);
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
	var pos = 0;

	function next() {
		var step = steps[pos++];
		if (!step) {
			return callback && callback.apply(null, arguments);
		}
		//trow error from any step to the last, error handling step,
		//and from the last step rethrow error outside Steppy
		var errorHandler = (pos < steps.length) ?
			steps[steps.length - 1] : function(err) {throw err};

		var group = new Group(next, errorHandler);
		try {
			step.apply(group, arguments);
		} catch (e) {
			return group.error(e);
		}
		if (group.left === 0) {
			group.done();
		}
	};
	next.apply(null, args);
}

// Expose just for fun and extensibility
Steppy.Group = Group;
