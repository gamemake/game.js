
var crypto = require('crypto');

String.prototype.format = function() {
	var formatted = this;
	for (var i = 0; i < arguments.length; i++) {
		var regexp = new RegExp('\\{'+i+'\\}', 'gi');
		formatted = formatted.replace(regexp, arguments[i]);
	}
	return formatted;
};

exports.genSessionKey = function(key)
{
	var md5sum = crypto.createHash('md5');
	md5sum.update(JSON.stringify(new Date()));
	if(key!=undefined) {
		md5sum.update(String(key));
	}
	return md5sum.digest('hex');
}
