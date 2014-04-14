'use strict';

var Step = require('../lib/twoStep').Step,
	expect = require('expect.js'),
	fs = require('fs'),
	helpers = require('./helpers');

describe('Group test', function() {

	it('should check group', function(done) {
		var files = fs.readdirSync(__dirname);
		var filesContents = [];
		files.forEach(function(file) {
			if (fs.statSync(helpers.makeFilePath(file)).isFile()) {
				filesContents.push(fs.readFileSync(helpers.makeFilePath(file), 'utf8'));
			} else {
				filesContents.push('123');
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
				this.pass(_files);
				var group = this.makeGroup();
				_files.forEach(function(file, i) {
					if (_stats[i].isFile()) {
						fs.readFile(helpers.makeFilePath(file), 'utf8', group.slot());
					} else {
						group.pass('123');
					}
				});
			}),
			Step.throwIfError(function(err, files, contents) {
				expect(contents.length).to.be(filesContents.length);
				expect(files.length).to.be(contents.length);
				for (var i = 0, l = files.length; i < l; i++) {
					expect(contents[i]).to.be(filesContents[i]);
				}
				this.pass(null);
			}),
			done
		);
	});

	it('returns empty array if it wasnt called', function(done) {
		Step(
			function() {
				// create group
				// and we wont call slot! It's madness!!
				var group = this.makeGroup();
			},
			function(err, data) {
				expect(data).to.be.ok();
				expect(data).to.be.an('array');
				expect(data.length).to.be(0);
				this.pass(null);
			},
			done
		);
	});

});
