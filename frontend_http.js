
var querystring = require('querystring');
var url = require('url');
var userauth = require('./userauth.js');
var usersession = require('./usersession.js');
var dispatcher = require('./dispatcher.js');
var http = require('http');

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
			var session_key = usersession.login(user_id);
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
	var session = usersession.get(args.session_key);
	if(session==undefined) {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}
	usersession.logout(session.user_id);
	res.writeHead(200);
	res.end('ERROR=0');
}

function method_request(args, res)
{
	var session = usersession.get(args.session_key);
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

	if(!dispatcher.call(session, method, message)) {
		res.writeHead(200);
		res.end('ERROR=UNDEFINE_METHOD');
		return;
	}
}

function method_pull(_this, args, res)
{
	var session = usersession.get(args.session_key);
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
					method(this, args, res);
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
