var Step = require('../lib/twoStep'),
	fs = require('fs');

var myBuiltinFn = Step.fn(
	Step.simple(function(file) {
		fs.readFile(file, 'utf8', this.slot());
		asyncSpecWait();
	}),
	Step.throwIfError(function(err, text){
		asyncSpecDone();
		this.pass(text.toUpperCase());
	})
);

describe('Step built-in function', function() {
	it('should check text', function() {
		var selfText = fs.readFileSync(__filename, 'utf8');
		myBuiltinFn(__filename, function(err, upperedText) {
			expect(selfText.toUpperCase()).toEqual(upperedText);
		});
	})
});