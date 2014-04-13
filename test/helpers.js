
var path = require('path');

exports.makeFilePath = function(file) {
	return path.join(__dirname, file);
};
