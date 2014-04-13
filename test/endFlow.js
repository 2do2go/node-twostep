'use strict';
var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	expect = require('expect.js');

describe('Break the flow if no arguments to next step will be passed', function() {

	it('should execute just 2 steps', function(done) {
		var selfText = fs.readFileSync(__filename, 'utf8');
		Step(
			Step.simple(function() {
				this.pass(__filename);
			}),
			Step.throwIfError(function(err, fileName) {
				fs.readFile(fileName, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, data) {
				expect(data).to.be(selfText);
				done();
			}),
			Step.throwIfError(function(err, data) {
				//this step should not be executed
				expect(0).to.be(1);
			}),
			Step.simple(function(err) {
				//this step should not be executed
				expect(0).to.be(1);
			})
		);
	});

	it('should throw error to last step', function(done) {
		var error = new Error('file is bad');
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, data) {
				throw error;
			}),
			Step.throwIfError(function(err, data) {
				//this step should'nt be executed
				expect(0).to.be(1);
			}),
			Step.simple(function(err) {
				//error have to be passed to this step
				expect(err).to.be(error);
				done();
			})
		);
	});

});
