TwoStep
=======
A simple control-flow library for node.JS that makes parallel execution,
serial execution, and error handling painless. Based on gist https://gist.github.com/1524578

Differents with gist:

* test coverage was added
* try...catch blocks for all steps
* useful wrappers: throwIfError and simple
* Steppy was added (details below)
* group, that was created with makeGroup may not be called and in this case it will pass empty array to the next step

Installation
-----------

    npm install twostep

Usage
-----------

  All callbacks are executing in theirs steps.

    var TwoStep = require('twostep').Step,
		FS = require('fs');

    Step(
      function one() {
        this.pass(__filename + ".bak");
        FS.readFile(__filename, 'utf8', this.slot());
      },
      function two(err, target, contents) {
        if (err) throw err;
        this.pass(target);
        FS.writeFile(target, contents, this.slot())
      },
      function three(err, target) {
        if (err) throw err;
        console.log("%s written to successfully", target);
        FS.readdir(__dirname, this.slot());
      },
      function four(err, fileNames) {
        if (err) throw err;
        this.pass(fileNames);
        var group = this.makeGroup();
        fileNames.forEach(function (filename) {
          FS.stat(filename, group.slot());
        });
      },
      function five(err, fileNames, stats) {
        if (err) throw err;
        this.pass(fileNames.filter(function (name, i) {
          return stats[i].isFile();
        }));
        var group = this.makeGroup();
        stats.forEach(function (stat, i) {
          if (stat.isFile()) FS.readFile(fileNames[i], 'utf8', group.slot());
        });
      },
      function six(err, fileNames, contents) {
        if (err) throw err;
        var merged = {};
        fileNames.forEach(function (name, i) {
          merged[name] = contents[i].substr(0, 80);
        });
        console.log(merged);
      }
    );

  This can be some simple if we will use wrappers.

    var Step = require('twostep').Step,
		FS = require('fs');

    Step(
        Step.simple(function() {
    		this.pass(__filename + ".bak");
    		FS.readFile(__filename, 'utf8', this.slot());
    	}),
    	Step.throwIfError(function(err, target, contents) {
    		this.pass(target);
    		FS.writeFile(target, contents, this.slot())
    	}),
    	Step.throwIfError(function(err, target) {
    		console.log("%s written to successfully", target);
    		FS.readdir(__dirname, this.slot());
    	}),
    	Step.throwIfError(function(err, fileNames) {
    		this.pass(fileNames);
    		var group = this.makeGroup();
    		fileNames.forEach(function(filename) {
    			FS.stat(filename, group.slot());
    		});
    	}),
    	Step.throwIfError(function(err, fileNames, stats) {
    		this.pass(fileNames.filter(function(name, i) {
    			return stats[i].isFile();
    		}));
    		console.log(fileNames)
    		var group = this.makeGroup();
    		stats.forEach(function(stat, i) {
    			if (stat.isFile()) {
    				FS.readFile(fileNames[i], 'utf8', group.slot());
    			}
    		});
    	}),
    	Step.throwIfError(function(err, fileNames, contents) {
    		var merged = {};
    		fileNames.forEach(function (name, i) {
    			merged[name] = contents[i].substr(0, 80);
    		});
    		console.log(merged);
    	}),
        Step.simple(function(err) {
		    if (err) {
			    console.log('Do something to handle error');
		    }
	    })
    );

Wrapper Step.throwIfError free you of all time writing

     if (err) throw err;

All steps throwIfError will be skipped. Error just will be passed through the steps.
To handle it you can use

    Step.simple(function(err) {})

or something other function, that get error in first parameter.
It's very usefull for common mechanism of error handling.

Or, it can be even easier if we will use Steppy instead of Step. It wraps all functions
except the last one in throwIfError wrapper by default, because it's the most common
usage of Step.

    var Steppy = require('twostep').Steppy,
		FS = require('fs');

    Steppy(
        function() {
    		this.pass(__filename + ".bak");
    		FS.readFile(__filename, 'utf8', this.slot());
    	},
    	function(err, target, contents) {
    		this.pass(target);
    		FS.writeFile(target, contents, this.slot())
    	}
    	function(err, target) {
    		console.log("%s written to successfully", target);
    		FS.readdir(__dirname, this.slot());
    	},
    	function(err, fileNames) {
    		this.pass(fileNames);
    		var group = this.makeGroup();
    		fileNames.forEach(function(filename) {
    			FS.stat(filename, group.slot());
    		});
    	},
    	function(err, fileNames, stats) {
    		this.pass(fileNames.filter(function(name, i) {
    			return stats[i].isFile();
    		}));
    		console.log(fileNames)
    		var group = this.makeGroup();
    		stats.forEach(function(stat, i) {
    			if (stat.isFile()) {
    				FS.readFile(fileNames[i], 'utf8', group.slot());
    			}
    		});
    	},
    	function(err, fileNames, contents) {
    		var merged = {};
    		fileNames.forEach(function (name, i) {
    			merged[name] = contents[i].substr(0, 80);
    		});
    		console.log(merged);
    	},
        function(err) {
			// if we're here then we definitely have an error
			console.log('Do something to handle error');
	    }
    );

Test
------
In project folder just run:

    npm install

After installtion run:

    npm test