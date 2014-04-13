'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js'),
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8');

describe('simple callback usage', function() {

	it('should compare sync and async result of file reading', function(done) {
		Step(
			function() {
				fs.readFile(__filename, 'utf8', this.slot());
			},
			function(err, text) {
				expect(text).to.be(selfText);
				done();
			}
		);
	});

	it('should do same that previous, using wraps', function(done) {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, text) {
				expect(text).to.be(selfText);
				this.pass(null);
			}),
			done
		);
	});

	it('should check the pass,using uppercased text and wraps', function(done) {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
			}),
			Step.throwIfError(function(err, text) {
				expect(text).to.be(selfText);
				this.pass(text.toUpperCase());
			}),
			Step.throwIfError(function(err, uppercasedText) {
				expect(uppercasedText).to.be(selfText.toUpperCase());
				this.pass(null);
			}),
			done
		);
	});

});
