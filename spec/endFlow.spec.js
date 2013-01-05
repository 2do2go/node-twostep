'use strict';
var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	helpers = require('./helpers');

describe('Break the flow if no arguments to next step will be passed', function() {
	it('should execute just 2 steps', function() {
		var selfText = fs.readFileSync(__filename, 'utf8');
		Step(
			Step.simple(function() {
				asyncSpecWait();
				this.pass(__filename);
			}),
			Step.throwIfError(function(err, fileName) {
				fs.readFile(__filename, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, data) {
				asyncSpecDone();
				expect(data).toEqual(selfText);
			}),
			Step.throwIfError(function(err, data) {
				//this step should not be executed
				expect(0).toEqual(1);
			}),
			Step.simple(function(err) {
				//this step should not be executed
				expect(0).toEqual(1);
			})
		)
	}),
	it('should throw error to last step', function() {
		var error = new Error('file is bad');
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, data) {
				asyncSpecDone();
				throw error;
			}),
			Step.throwIfError(function(err, data) {
				//this step should'nt be executed
				expect(0).toEqual(1);
			}),
			Step.simple(function(err) {
				//error have to be passed to this step
				expect(err).toEqual(error);
			})
		)
	})
});
