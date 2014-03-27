'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js'),
	fs = require('fs'),
	helpers = require('./helpers');

describe('group test', function() {

	it('should check group', function(done) {
		var files = fs.readdirSync(__dirname);
		var filesContents = [];
		files.forEach(function(file) {
			if (fs.statSync(helpers.makeFilePath(file)).isFile()) {
				filesContents.push(fs.readFileSync(helpers.makeFilePath(file), 'utf8'));
			}
		});

		Step(
			Step.simple(function() {
				fs.readdir(__dirname, this.slot());
			}),
			Step.throwIfError(function(err, _files) {
				this.pass(_files);

				var group = this.makeGroup();
				_files.forEach(function(file) {
					fs.stat(helpers.makeFilePath(file), group.slot());
				});
			}),
			Step.throwIfError(function(err, _files, _stats) {
				expect(_stats.length).to.be(_files.length);
				this.pass(_files.filter(function(file, i) {
					return _stats[i].isFile();
				}));
				var group = this.makeGroup();
				_files.forEach(function(file, i) {
					if (_stats[i].isFile()) {
						fs.readFile(helpers.makeFilePath(file), 'utf8', group.slot());
					}
				});
			}),
			Step.throwIfError(function(err, _files, _filesContents) {
				expect(_filesContents.length).to.be(filesContents.length);
				expect(_files.length).to.be(_filesContents.length);
				for (var i = 0, l = _files.length; i < l; i++) {
					expect(_filesContents[i]).to.be(filesContents[i]);
				}
				this.pass(null);
			}),
			done
		);
	});

});
