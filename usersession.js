var utils = require('./utils.js')

var user_map = {};
var session_map = {};

module.exports.login = function (user_id)
{
	var session_key = user_map[user_id];
	if(session_key!=undefined) {
		_this.session_map[session_key] = undefined;
	}
	session_key = utils.genSessionKey(user_id);
	user_map[user_id] = session_key;
	session_map[token] = { 'user_id' : user_id };
}

module.exports.logout = function (user_id)
{
	var session_key = user_map[user_id];
	user_map[user_id] = undefined;
	if(session_key!=undefined) {
		session_map[session_key] = undefined;
	}
}

module.exports.get = function (session_key)
{
	if(typeof(session_key)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}

	return _this.session_map[session_key];
}
