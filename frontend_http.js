
var querystring = require('querystring');
var url = require('url');
var userauth = require('./userauth.js');
var session_manager = require('./session_manager.js');
var dispatcher = require('./dispatcher.js');
var http = require('http');

function UserSession (uid)
{
	this._uid = uid;
	this._aid = undefined;
	this._res = undefined;
	this._cmds = undefined;
}

UserSession.prototype.getUID = function ()
{
	return this._uid;
}

UserSession.prototype.getAID = function ()
{
	return this._aid;
}

UserSession.prototype.begin = function (res)
{
	this._res = res;
	this._cmds = [];
}

UserSession.prototype.push = function (cmd)
{
	if(this._cmds!=undefined) {
		this._cmds.push(cmd);
	}
}

UserSession.prototype.end = function (err)
{
	if(this._res==undefined) {
		return;
	}

	if(err!=undefined) {
		this._res.writeHead(200);
		this._res.end('ERROR='+err);
	} else {
		var result = 'ERROR=0;{"response":[';
		for(i=0; i<this._cmds.length; i++) {
			if(i==0) result += ',';
			result += _cmds[i];
		}
		result += ']}';
		this._res.writeHead(200);
		this._res.end(result);
	}
	this._res = undefined;
	this._cmds = undefined;
}

function method_login(args, res)
{
	if(typeof(args.token)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	userauth.authToken(args.token, function(user_id) {
		if(user_id==undefined) {
			res.writeHead(200);
			res.end('ERROR=UNKNOWN');
		} else {
			var session_key = session_manager.login(user_id, new UserSession(user_id));
			if(session_key==undefined) {
				res.writeHead(200);
				res.end('ERROR=UNKNOWN');
			} else {
				res.writeHead(200);
				res.end('ERROR=0;{"session_key":"'+session_key+'"}');
			}
		}
	});
}

function method_logout(args, res)
{
	var session = session_manager.get(args.session_key);
	if(session==undefined) {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}
	session_manager.logout(session.user_id);
	res.writeHead(200);
	res.end('ERROR=0');
}

function method_request(args, res)
{
	var session = session_manager.get(args.session_key);
	if(session==undefined) {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}

	var request = args.request;
	if(typeof(request)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}
	request = JSON.parse(request);
	var method = request.method;
	if(typeof(method)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}
	var message = request.message;
	if(typeof(message)!='object') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	session.begin(res);

	if(!dispatcher.call(session, method, message)) {
		session.end('UNDEFINE_METHOD');
		return;
	}

	session.end();
}

function method_pull(_this, args, res)
{
	var session = session_manager.get(args.session_key);
	if(session==undefined) {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}
}

var methods = {
	'login'			: method_login,
	'logout'		: method_logout,
	'request'		: method_request,
	'pull'			: method_pull
};

function dispatcher_http(req, res)
{
	url_parts = url.parse(req.url);
	path = url_parts.pathname;
	if(path.substring(0, 11)=='/atlas-api/') {
		var method = methods[path.substring(11)];
		if(method!=undefined) {
			if(req.method=='POST') {
				var info = "";
				req.addListener('data', function(chunk) {
					info += chunk;
				});
				req.addListener('end', function() {
					args = querystring.parse(info);
					method(args, res);
				});
				return;
			} else if(req.method=='GET') {
				var args = {};
				if(url_parts.query!=undefined) {
					args = querystring.parse(url_parts.query);
				}
				method(args, res);
				return;
			}
		}
	}

	res.writeHead(404);
	res.end();
}

var httpd = undefined;

module.exports.start = function (ip, port)
{
	if(httpd==undefined) {
		httpd = http.createServer(dispatcher_http);
		httpd.listen(port, ip);
	}
}

module.exports.stop = function ()
{
	if(httpd!=undefined) {
		httpd.close();
		httpd = undefined;
	}
}
