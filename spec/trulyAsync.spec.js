'use strict';
var Step = require('../lib/twoStep').Step;

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
				done();
				expect(checkStrings.length).toEqual(checkStringsCount);
				for (var i = 0; i < checkStringsCount; i++) {
					expect(checkStrings[i]).toEqual(checkString + i);
				}
			}),
			Step.simple(function(err) {
				//this step should not be executed
				expect(0).toEqual(1);
			})
		)
	})
});
