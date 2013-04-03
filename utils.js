
var crypto = require('crypto');

module.exports.genSessionKey = function(key)
{
	var md5sum = crypto.createHash('md5');
	md5sum.update(JSON.stringify(new Date()));
	if(key!=undefined) {
		md5sum.update(key);
	}
	return md5sum.digest('hex');
}
