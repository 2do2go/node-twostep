'use strict';


var Steppy = require('../lib/twoStep').Steppy,
	expect = require('expect.js'),
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	error = new Error('Steppy error');

describe('Steppy error handling', function() {

	it('should throw error and catch it in last callback', function(done) {
		Steppy(
			function() {
				throw error;
			},
			function(err, text) {
				//this step will never be executed
				expect(1).to.be(0);
			},
			function(err) {
				//this step will never be executed
				expect(1).to.be(0);
			},
			function(err) {
				expect(err).to.be(error);
				done();
			}
		);
	});

	it('throwing error from the last step catch it outside', function(done) {
		var error = new Error('from the last step');
		try {
			Steppy(
				function(err) {
					throw(error);
				}
			);
		} catch(e) {
			expect(e).to.be(error);
			done();
		}
	});

});
