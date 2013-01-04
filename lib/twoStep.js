module.exports = TwoStep;

var slice = Array.prototype.slice;

/**
 * Group represents one step in Step's execution flow. Makes a decision when
 * the execution should jump to the next step.
 *
 * @param {function(err, args)} callback
 *   Callback to be called on successful execution end
 */
function Group(callback) {
	this.args = [null];
	this.reservedSlots = 0;
	this.callback = callback;
	this.isDone = false;
}

Group.prototype.done = function done(err) {
	if (this.isDone) {
		return;
	}
	this.isDone = true;
	this.args[0] = err;
	this.callback.apply(null, this.args);
};

Group.prototype.error = function error(err) {
	this.done(err);
};

/**
 * Reserve space for one argument in the `args` array.
 * @return {Number} index of the reserved slot
 */
Group.prototype._reserveSlot = function() {
	var self = this;
	self.reservedSlots++;
	return self.args.push(undefined) - 1;
};

/**
 * Fill the reserved slot addressed by `index` with the given `value`.
 */
Group.prototype._fillSlot = function(index, data) {
	this.args[index] = data;
	if (!--this.reservedSlots) {
		this.done();
	}
};

// Register a slot in the next step and return a callback
Group.prototype.slot = function slot() {
	var self = this;
	var index = self._reserveSlot();
	return function(err, data) {
		process.nextTick(function() {
			if (err) {
				return self.error(err);
			}
			self._fillSlot(index, data);
		});
	};
};

/**
 * Creates a nested group, all results of which will be passed into the reserved
 * slot as a single array
 */
Group.prototype.makeGroup = function makeGroup() {
	var self = this;
	var callback = self.slot();
	return new Group(function (err) {
		var data = slice.call(arguments, 1);
		callback(err, data);
	});
};

/**
 * Wrapper for passing synchronous values to the next step
 */
Group.prototype.pass = function pass(/*values*/) {
	var values = slice.call(arguments);
	for (var i = 0, l = values.length; i < l; i++) {
		this.slot()(null, values[i]);
	}
};


/**
 * TwoStep section
 */

/**
 * Execute given steps immediately
 */
function TwoStep(/*step1, ..., stepN*/) {
	var steps = slice.call(arguments);
	var callback = steps.pop();
	makeSteps.apply(null, steps)(callback);
}

function makeSteps() {
	var steps = slice.call(arguments);
	return function(/*arg1, ... argN, callback*/) {
		var initArgs = slice.call(arguments);
		var callback = initArgs.pop();
		if (!callback) {
			throw new Error('Callback is missing');
		}
		iterateSteps(steps, initArgs, callback);
	};
};

// Stepper function
function iterateSteps(steps, initArgs, callback) {
	var pos = 0;

	function next(err /*...*/) {
		if (pos >= steps.length) {
			return callback.apply(null, arguments);
		}
		var step = steps[pos++];
		var group = new Group(next);
		try {
			step.apply(group, arguments);
		} catch (e) {
			return group.error(e);
		}
	};
	next.apply(null, initArgs);
}

// Expose just for fun and extensibility
TwoStep.Group = Group;

// Create a composite function with steps built-in
TwoStep.fn = makeSteps;

//Simple step function, just return callack
TwoStep.simple = function(callback) {
	return callback;
};

/**
 * Rethrow an error if it was passed as the first argument
 */
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

/**
 * Execute given steps immediately.
 * Always handle occuring errors in the last step.
 */
TwoStep.Steppy = function(/*step1, ..., stepN*/) {
	var steps = slice.call(arguments, 0, -1).map(function(step) {
		return TwoStep.throwIfError(step);
	});
	var callback = slice.call(arguments, -1);
	TwoStep.apply(null, steps.concat(callback));
};
