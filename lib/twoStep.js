'use strict';

/**
 * Twostep - a simple flow-control library for node.js.
 *
 * Steppy - even more simple in usage tool covering majority
 * of the everyday routine use-cases.
 */

var slice = Array.prototype.slice;

/**
 * Group represents one step in Step's execution flow.
 * Makes a decision when the execution should jump to the next step.
 *
 * @param {function(err, args...)} callback
 *   Callback to be called when all data is collected or an error occured.
 */
function Group(callback) {
	this.slots = [null];
	this.reservedSlots = 0;
	this.callback = callback;
	this.isDone = false;
}

Group.prototype.done = function done(err) {
	if (this.isDone) return;
	this.isDone = true;
	this.slots[0] = err;
	this.callback.apply(null, this.slots);
};

Group.prototype.error = function error(err) {
	this.done(err);
};

/**
 * Reserve space for one argument in the `slots` array.
 * @return {Number} index of the reserved slot
 */
Group.prototype._reserveSlot = function() {
	this.reservedSlots++;
	return this.slots.push(undefined) - 1;
};

/**
 * Fill the reserved slot addressed by `index` with the given `value`.
 */
Group.prototype._fillSlot = function(index, data) {
	this.slots[index] = data;
	if (!--this.reservedSlots) {
		this.done();
	}
};

/**
 * Reserve one slot in the arguments array to be passed
 * to the group's callback. Group's callback will not be called until
 * all reserved slots are filled with data or the error occures.
 *
 * @return {function(err, data)} callback to fill the slot with data
 */
Group.prototype.slot = function slot() {
	var self = this;
	var index = self._reserveSlot();
	var called = false;
	return function(err, data) {
		if (called) {
			console.warn('\x1b[31mWarning! Slot is called more than once!\x1b[0m');
			return;
		}
		called = true;
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
	var callback = this.slot();
	var newGroup = new Group(function (err) {
		// omit first 2 elements because of fake element
		var data = slice.call(arguments, 2);
		callback(err, data);
	});
	newGroup.slot()(null, null);
	return newGroup;
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
 * Chaining together all passed functions.
 * The results of the step call are passed to the following step
 * in the form of stepN(err, args...).
 * The execution result of the whole chain is passed
 * via the callback call: callback(err, result).
 *
 * @return {function(args..., callback)} the resulting chain of steps
 */
function chainSteps(/*fun1, fun2, ..., funN*/) {
	var steps = slice.call(arguments);
	return function(/*arg1, ... argN, callback*/) {
		var initArgs = slice.call(arguments);
		var callback = initArgs.pop();
		if (!callback) {
			throw new Error('Callback is missing');
		}
		iterateSteps(steps, initArgs, callback);
	};
}

/**
 * Similar to `makeSteps` but the chaining continues only on
 * successful execution of the previous step and breaks after
 * the first error occured.
 */
function chainStepsNoError() {
	var steps = slice.call(arguments).map(function(step) {
		return notHandlingError(step);
	});
	return chainSteps.apply(null, steps);
}


/**
 * The heart of the TwoStep, function executing and chaining all given steps
 */
function iterateSteps(steps, initArgs, callback) {
	var pos = 0;

	function next(/*err, args...*/) {
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
	}
	next.apply(null, initArgs);
}


function notHandlingError(func) {
    return function(err) {
		if (err) throw err;
		return func.apply(this, arguments);
	};
}

function identity(arg) {
    return arg;
}

/**
 * Chain and execute given steps immediately. The last step in chain
 * will be the error- and result-handling callback.
 */
function chainAndCall(chainer) {
    return function(/*step1, step2, ...*/) {
        var steps = slice.call(arguments);
	    var callback = steps.pop();
	    chainer.apply(null, steps)(callback);
    };
}

exports.Step = chainAndCall(chainSteps);
exports.Step.fn = chainSteps;
exports.Step.simple = identity;
exports.Step.throwIfError = notHandlingError;

exports.Steppy = chainAndCall(chainStepsNoError);
exports.Steppy.fn = chainStepsNoError;

exports.Group = Group;

