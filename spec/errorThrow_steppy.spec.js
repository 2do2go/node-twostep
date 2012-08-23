'use strict';


var Steppy = require('../lib/twoStep').Steppy,
	fs = require('fs'),
	selfText = fs.readFileSync(__filename, 'utf8'),
	error = new Error('Steppy error');

describe('simple callback usage', function() {
	it('should throw error and catch it in last callback', function(done) {
		Steppy(
			function() {
				throw error;
			},
			function(err, text) {
				//this step will never be executed
				expect(1).toEqual(0);
			},
			function(err) {
				//this step will never be executed
				expect(1).toEqual(0);
			},
			function(err) {
				expect(err).toEqual(error);
				done();
			}
		);
	});
});
