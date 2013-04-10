
var crypto = require('crypto');

exports.genSessionKey = function(key)
{
	var md5sum = crypto.createHash('md5');
	md5sum.update(JSON.stringify(new Date()));
	if(key!=undefined) {
		md5sum.update(String(key));
	}
	return md5sum.digest('hex');
}
