'use strict';


var Step = require('../lib/twoStep').Step,
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8');

describe('simple callback usage', function() {
	it('should compare sync and async result of file reading', function() {
		Step(
			function() {
				fs.readFile(__filename, 'utf8', this.slot());
				asyncSpecWait();
			},
			function(err, text) {
				asyncSpecDone();
				expect(text).toEqual(selfText);
			}
		);
	}),
	it('should do same that previous, using wraps', function() {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, text) {
				asyncSpecDone();
				expect(text).toEqual(selfText);
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	}),
	it('should check the pass,using uppercased text and wraps', function() {
		Step(
			Step.simple(function() {
				fs.readFile(__filename, 'utf8', this.slot());
				asyncSpecWait();
			}),
			Step.throwIfError(function(err, text) {
				asyncSpecDone();
				expect(text).toEqual(selfText);
				this.pass(text.toUpperCase())
			}),
			Step.throwIfError(function(err, uppercasedText) {
				expect(uppercasedText).toEqual(selfText.toUpperCase());
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	})
});
