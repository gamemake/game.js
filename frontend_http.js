
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var user_session = require('./user_session.js');
var dal_user = require('./dal_user.js');
var utils = require('./utils.js');
var config = require('./config.js');
var queue_max_size = config.get('frontend.queue_max_size');

var session_map = {};

function pullMessage(res, queue)
{
	res.writeHead(200);
	res.write('ERROR=0;{"response":[');
	for(i=0; i<queue.length; i++) {
		if(i>0) res.write(',');
		if(typeof(queue[i])=='object') {
			res.write(msg_array[index]);
		} else {
			res.write(msg_array[index]);
		}
	}
	this.res.write(']}');
	this.res.end();
}

var HttpSession = user_session.UserSession.extend({
	init : function ()
	{
		this._super();
		this.session_key = '';
		this.inLogout = false;

		this.req_seq = 0;
		this.req_queue = [];

		this.pull_seq = 0;
		this.pull_queue = [];
		this.pull_res = undefined;
		this.pull_timer = -1;
		this.pull_queue_b = [];
	},
	login : function (uid)
	{
		this.session_key = utils.genSessionKey(uid);
		session_map[this.session_key] = this;
		return this._super(uid);
	},
	logout : function ()
	{
		delete session_map[this.session_key];
		this.session_key = '';

		if(this.pull_res!=undefined) {
			this.pull_res.writeHead(200);
			this.pull_res.end('ERROR=0');
			timer.clearTimerout(this.pull_timer);
			this.pull_res = null;
			this.pull_timer = -1;
		}

		this._super();
	},
	send : function (message)
	{
		if(this.pull_queue.lenght>=queue_max_size) {
			this.call('main', 'logout', {});
			return;
		}

		this.pull_queue.push(message);

		if(this.pull_res!=undefined) {
			timer.clearTimerout(this.pull_timer);
			pullMessage(this.pull_res, this.pull_queue);
			this.pull_queue_b = this.pull_queue;
			this.pull_queue = [];
			this.pull_seq += 1;
			this.pull_res = undefined;
			this.pull_timer = -1;
		}
	},
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
			var session = user_session.getSession(user_id);
			if(session) {
				if(!session.inLogout) {
					session.inLogout = true;
					session.call(1, {});
				}
				res.writeHead(200);
				res.end('ERROR=ALREADY_EXISTED');
				return;
			}

			session = new HttpSession();
			if(!session.login(user_id)) {
				res.writeHead(200);
				res.end('ERROR=UNKNOWN');
			} else {
				res.writeHead(200);
				res.end('ERROR=0;{"session_key":"'+session.session_key+'"}');
				session.call(0, {});
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

	if(!session.inLogout) {
		session.inLogout = true;
		session.call(1, {});
	}

	res.writeHead(200);
	res.end('ERROR=0');
}

function method_request(args, res)
{
	if(typeof(args.session_key)!='string' || typeof(args.seq)!='number')
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

	if(args.seq==session.req_seq) {
		res.writeHead(200);
		res.end('ERROR=0');
	}

	if(args.seq!=session.req_seq+1) {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	var method = request.method;
	if(typeof(method)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}
	var cmd = user_session.getMethodId(method);
	if(cmd<0) {
		res.writeHead(200);
		res.end('ERROR=UNDEFINE_METHOD');
		return;
	}
	var request = args.request;
	if(typeof(request)!='string') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}
	request = JSON.parse(request);
	var message = request.message;
	if(typeof(message)!='object') {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	session.call(cmd, message);
}

function method_pull(args, res)
{
	if(typeof(args.session_key)!='string' || typeof(args.seq)!='number')
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

	if(args.seq==this.pull_seq) {
		pullMessage(res, session.pull_queue_b);
		return;
	}

	if(args.seq!=this.pull_seq+1) {
		res.writeHead(200);
		res.end('ERROR=INVALID_PARAMETER');
		return;
	}

	if(session.pull_res!=undefined) {
		session.pull_res.writeHead(200);
		session.pull_res.end('ERROR=TRY_AGAIN');
		timer.clearTimerout(session.pull_timer);
		session.pull_res = undefined;
		session.pull_timer = -1;
	}

	session.pull_res = res;
	session.pull_timer = timer.setTimeout(function () {
		timer.clearTimerout(session.pull_timer);
		session.pull_res.writeHead(200);
		session.pull_res.end('ERROR=TRY_AGAIN');
		session.pull_res = undefined;
		session.pull_timer = -1;
	}, 20000);
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

exports.start = function (ip, port)
{
	if(httpd==undefined) {
		httpd = http.createServer(dispatcher_http);
		httpd.listen(port, ip);
	}
}

exports.stop = function ()
{
	if(httpd!=undefined) {
		httpd.close();
		httpd = undefined;
	}

	for(var i in session_map) {
		var session = session_map[i];
		if(!session.inLogout) {
			session.inLogout = true;
			session.call(1, {});
		}
	}
}
