'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js'),
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	etcFileName = '/etc/passwd',
	etcText = fs.readFileSync(etcFileName, 'utf8');

describe('Parallel call usage', function() {

	it('should execute parallel and pass values to correct slots', function(done) {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				fs.readFile(etcFileName, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, _selfText, _etcText) {
				expect(_selfText).to.be(selfText);
				expect(_etcText).to.be(etcText);
				this.pass(null);
			}),
			done
		);
	});

	it('should pass 2 parameters using this.pass', function(done) {
		var firstExpectString = 'one',
			secondExpectString = 'two';
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				this.pass(firstExpectString, secondExpectString);
			}),
			Step.throwIfError(function(err, _selfText, _first, _second) {
				expect(_selfText).to.be(selfText);
				expect(_first).to.be(firstExpectString);
				expect(_second).to.be(secondExpectString);
				this.pass(null);
			}),
			done
		);
	});

	it('same that previous but parameters order changed', function(done) {
		var firstExpectString = 'one',
			secondExpectString = 'two';
		Step(
			Step.simple(function() {
				this.pass(firstExpectString);
				fs.readFile(__filename, 'utf8', this.slot());
				this.pass(secondExpectString);
			}),
			Step.throwIfError(function(err, _first, _selfText, _second) {
				expect(_selfText).to.be(selfText);
				expect(_first).to.be(firstExpectString);
				expect(_second).to.be(secondExpectString);
				this.pass(null);
			}),
			done
		);
	});

});
