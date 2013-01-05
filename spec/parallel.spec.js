'use strict';


var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	etcFileName = '/etc/passwd',
	etcText = fs.readFileSync(etcFileName, 'utf8');

describe('parallel call usage', function() {
	it('should execute parallel and pass values to correct slots', function() {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				fs.readFile(etcFileName, 'utf8', this.slot());
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, _selfText, _etcText) {
				asyncSpecDone();
				expect(_selfText).toEqual(selfText);
				expect(_etcText).toEqual(etcText);
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	}),
	it('should pass 2 parameters using this.pass', function() {
		var firstExpectString = 'one',
			secondExpectString = 'two';
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				this.pass(firstExpectString, secondExpectString);
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, _selfText, _first, _second) {
				asyncSpecDone();
				expect(_selfText).toEqual(selfText);
				expect(_first).toEqual(firstExpectString);
				expect(_second).toEqual(secondExpectString);
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	}),
	it('same that previous but parameters order changed', function() {
		var firstExpectString = 'one',
			secondExpectString = 'two';
		Step(
			Step.simple(function() {
				this.pass(firstExpectString);
				fs.readFile(__filename, 'utf8', this.slot());
				this.pass(secondExpectString);
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, _first, _selfText, _second) {
				asyncSpecDone();
				expect(_selfText).toEqual(selfText);
				expect(_first).toEqual(firstExpectString);
				expect(_second).toEqual(secondExpectString);
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	})
});
