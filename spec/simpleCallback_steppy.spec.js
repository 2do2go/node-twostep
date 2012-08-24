'use strict';


var Steppy = require('../lib/twoStep').Steppy,
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8');

describe('simple callback usage', function() {
	it('calling steppy with less than two steps', function() {
		//should do nothing
		Steppy();

		var i = 0;
		Steppy(function() {
			i = 1;
		});
		expect(i).toBe(1);

		var error = new Error();
		try {
			Steppy(
				function() {throw error;}
			);
		} catch(e) {
			expect(e).toBe(error);
		}
	}),

	it('should check the pass,using uppercased text and wraps', function(done) {
		Steppy(
			function() {
				fs.readFile(__filename, 'utf8', this.slot());
			},
			function(err, text) {
				expect(text).toEqual(selfText);
				this.pass(text.toUpperCase());
			},
			function(err, uppercasedText) {
				expect(uppercasedText).toEqual(selfText.toUpperCase());
				done(err);
			},
			done //in case of error
		);
	});
});
