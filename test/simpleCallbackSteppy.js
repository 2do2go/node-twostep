'use strict';

var Steppy = require('../lib/twoStep').Steppy,
	expect = require('expect.js'),
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8');

describe('Steppy simple callback usage', function() {

	it('calling steppy with less than two steps', function(done) {
		//can't call without a single step
		try {
			Steppy();
		} catch(e) {
			expect(e).to.be.ok();
		}

		var i = 0;
		Steppy(function() {
			i = 1;
		});
		expect(i).to.be(1);

		var error = new Error();
		try {
			Steppy(
				function() {throw error;}
			);
		} catch(e) {
			expect(e).to.be(error);
		}

		done();
	}),

	it('should check the pass, using uppercased text and wraps', function(done) {
		Steppy(
			function() {
				fs.readFile(__filename, 'utf8', this.slot());
			},
			function(err, text) {
				expect(text).to.be(selfText);
				this.pass(text.toUpperCase());
			},
			function(err, uppercasedText) {
				expect(uppercasedText).to.be(selfText.toUpperCase());
				this.pass(null);
			},
			done
		);
	});
});
