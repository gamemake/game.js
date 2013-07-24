
var dal_avatar = require('./dal_avatar.js');
var room = require('./room.js');

exports.isMainModule = true;

exports.login = function (session, args)
{
	console.log('login');
}

exports.logout = function (session, args)
{
	console.log('logout');
	session.logout();
}

exports.method_table = {};

exports.method_table.Ping = function(session, args)
{
	console.log('ping');
}
