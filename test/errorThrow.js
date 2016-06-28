'use strict';


var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	expect = require('expect.js'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	error = new Error('Step error'),
	secondError = new Error('Step second error');

describe('Step error handling', function() {

	it('thrown error should be catched at last callback', function(done) {
		Step(
			Step.simple(function() {
				throw error;
			}),
			Step.simple(function(err) {
				expect(err).to.be(error);
				throw err;
			}),
			Step.throwIfError(function(err, text) {
				//this step shall never be executed
				expect(1).toEqual(0);
			}),
			Step.simple(function(err) {
				expect(err).to.be(error);
				done();
			})
		);
	});

	it('error passed to callback should be passed to next step', function(done) {
		Step(
			function() {
				var callback = this.slot();
				callback(error);
			},
			function(err) {
				expect(err).to.be(error);
				done();
			}
		);
	});

	it('if two errors passed to callbacks first of them ' +
		'will be passed to next step', function(done) {
		Step(
			function() {
				var callback = this.slot();
				callback(error);
				var secondCallback = this.slot();
				secondCallback(secondError);
			},
			function(err) {
				expect(err).to.be(error);
				done();
			}
		);
	});

});
