'use strict';


var Step = require('../lib/twoStep'),
	fs = require('fs');

function makeFilePath(file) {
	return __dirname + '/' + file;
}
describe('group test', function() {
	it('should check group', function(done) {
		var files = fs.readdirSync(__dirname);
		var filesContents = [];
		files.forEach(function(file) {
			if (fs.statSync(makeFilePath(file)).isFile()) {
				filesContents.push(fs.readFileSync(makeFilePath(file), 'utf8'));
			}
		});
		Step(
			Step.simple(function() {
				fs.readdir(__dirname, this.slot());
			}),
			Step.throwIfError(function(err, _files) {
				done();

				this.pass(_files);

				var group = this.makeGroup();
				_files.forEach(function(file) {
					fs.stat(makeFilePath(file), group.slot());
				});
			}),
			Step.throwIfError(function(err, _files, _stats) {
				done();
				expect(_stats.length).toEqual(_files.length);
				this.pass(_files.filter(function(file, i) {
					return _stats[i].isFile();
				}));
				var group = this.makeGroup();
				_files.forEach(function(file, i) {
					if (_stats[i].isFile()) {
						fs.readFile(makeFilePath(file), 'utf8', group.slot());
					}
				});
			}),
			Step.throwIfError(function(err, _files, _filesContents) {
				done();
				expect(_filesContents.length).toEqual(filesContents.length);
				expect(_files.length).toEqual(_filesContents.length);
				for (var i = 0, l = _files.length; i < l; i++) {
					expect(_filesContents[i]).toEqual(filesContents[i]);
				}
			}),
			Step.simple(function(err) {
				expect(err).toEqual(null);
			})
		);
	})
});