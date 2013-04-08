
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var dispatcher = require('./dispatcher.js');
var UserSession = require('./user_session.js');
var dal_user = require('./dal_user.js');
var utils = require('./utils.js');

var session_map = {};

var HttpSession = UserSession.extend({
	init : function ()
	{
		this.session_key = '';
		this._super();
	},
	login : function (uid)
	{
		this.session_key = utils.genSessionKey(uid);
		session_map[this.session_key] = this;
		return this._super(uid);
	},
	logout : function ()
	{
		this._super();
		if(this.session_key!='') {
			session_map[this.session_key] = undefined;
		}
	}
});

function method_login(args, res)
{
	if(typeof(args.token)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}
	dal_user.authToken(args.token, function(err, user_id) {
		if(err) {
			res.writeHead(200);
			res.end('ERROR='+err);
		} else {
			var session = new HttpSession();
			if(!session.login(user_id)) {
				res.writeHead(200);
				res.end('ERROR=UNKNOWN');
			} else {
				res.writeHead(200);
				res.end('ERROR=0;{"session_key":"'+session.session_key+'"}');
			}
		}
	});
}

function method_logout(args, res)
{
	if(typeof(args.session_key)!='string')
	{
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	var session = session[args.session_key];
	if(session==undefined) {
		res.writeHead(200);
		res.end('ERROR=INVALID_SESSION');
		return;
	}
	session.logout(session.user_id);
	res.writeHead(200);
	res.end('ERROR=0');
}

function method_request(args, res)
{
	if(typeof(args.session_key)!='string')
	{
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	var session = session_map[args.session_key];
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
