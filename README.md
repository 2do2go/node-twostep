TwoStep
=======
A simple control-flow library for node.JS that makes parallel execution, 
serial execution, and error handling painless. Based on gist https://gist.github.com/1524578

In different to that gist was added test coverage, try ... catch blocks for all steps and some usefull wrappers.

Installation
-----------

    npm install twostep
    
Usage
-----------

  All callbacks are executing in theirs steps.
  
    var TwoStep = require('twostep');
    var FS = require('fs');
 
    TwoStep(
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
  
    var TwoStep = require('twostep');
    var FS = require('fs');
    
    TwoStep(
        TwoStep.simple(function() {
    		this.pass(__filename + ".bak");
    		FS.readFile(__filename, 'utf8', this.slot());
    	}),
    	TwoStep.throwIfError(function(err, target, contents) {
    		this.pass(target);
    		FS.writeFile(target, contents, this.slot())
    	}),
    	TwoStep.throwIfError(function(err, target) {
    		console.log("%s written to successfully", target);
    		FS.readdir(__dirname, this.slot());
    	}),
    	TwoStep.throwIfError(function(err, fileNames) {
    		this.pass(fileNames);
    		var group = this.makeGroup();
    		fileNames.forEach(function(filename) {
    			FS.stat(filename, group.slot());
    		});
    	}),
    	TwoStep.throwIfError(function(err, fileNames, stats) {
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
    	TwoStep.throwIfError(function(err, fileNames, contents) {
    		var merged = {};
    		fileNames.forEach(function (name, i) {
    			merged[name] = contents[i].substr(0, 80);
    		});
    		console.log(merged);
    	}),
        TwoStep.simple(function(err) {
		    if (err) {
			    console.log('Do something to handle error');
		    }
	    })
    );
    
Wrapper TwoStep.throwIfError free you of all time writing

     if (err) throw err;
     
All steps throwIfError will be skipped. Error just will be passed through the steps.
To handle it you can use 

    TwoStep.simple(function(err) {}) 
    
or something other function, that get error in first parameter.
It's very usefull for common mechanism of error handling.
        
Test
------
In project folder just run:

    npm install
    
After installtion run:

    npm test