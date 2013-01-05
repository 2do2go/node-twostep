'use strict';


var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	error = new Error('Step error');

describe('simple callback usage', function() {
	it('should throw error and catch it in last callback', function() {
		Step(
			Step.simple(function() {
				throw error;
			}),
			Step.simple(function(err) {
				expect(err).toEqual(error);
				throw err;
			}),
			Step.throwIfError(function(err, text) {
				//this step shall never be executed
				expect(1).toEqual(0);
			}),
			Step.simple(function(err) {
				expect(err).toEqual(error);
			})
		);
	})
});
