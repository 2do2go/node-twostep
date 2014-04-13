'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js');

describe('Check that all callbacks are async', function() {

	it('should execute steps with sync callbacks like async', function(done) {
		var objectWithSyncMethods = {},
			checkString = 'check',
			checkStringsCount = 10;
		objectWithSyncMethods.syncFuncWithCallback = function(param, callback) {
			callback(null, checkString + param);
		};

		Step(
			Step.simple(function() {
				var group = this.makeGroup();
				for (var i = 0; i < checkStringsCount; i++) {
					objectWithSyncMethods.syncFuncWithCallback(i, group.slot());
				}
			}),
			Step.throwIfError(function(err, checkStrings) {
				expect(checkStrings.length).to.equal(checkStringsCount);
				for (var i = 0; i < checkStringsCount; i++) {
					expect(checkStrings[i]).to.equal(checkString + i);
				}
				this.pass(null);
			}),
			done
		);
	});

});
