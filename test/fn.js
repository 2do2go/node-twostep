'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js'),
	fs = require('fs');

var myBuiltinFn = Step.fn(
	Step.simple(function(file) {
		fs.readFile(file, 'utf8', this.slot());
	}),
	Step.throwIfError(function(err, text){
		this.pass(text.toUpperCase());
	})
);

describe('Step built-in function', function() {

	it('should check text', function(done) {
		var selfText = fs.readFileSync(__filename, 'utf8');
		myBuiltinFn(__filename, function(err, upperedText) {
			expect(selfText.toUpperCase()).to.be(upperedText);
			done();
		});
	});

});
