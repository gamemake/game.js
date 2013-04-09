
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var user_session = require('./user_session.js');
var dal_user = require('./dal_user.js');
var utils = require('./utils.js');
var config = require('./config.js');
var http_message_queue = config.get('http_message_queue');
var session_map = {};

var BoardcastMessageQueue = Class.extend({
	init : function (size)
	{
		this.msg_array = [];
		this.msg_array.length = size;
		this.msg_start = 0;
		this.msg_count = 0;
	},
	pushMessage : function (message, level)
	{
		if(level==undefined) level = 0;
		var index = (this.msg_start + this.msg_count) % this.msg_array.length;
		this.msg_array[index] = message;
		if(this.msg_count<this.msg_array.length) {
			this.msg_count += 1;
		}
	},
	pullMessage : function ()
	{
/*
		if(this.msg_count>0) {
			for(i=0; i<this.msg_count; i++) {
				var index = (this.msg_start+i) % this.msg_array.length;
				ret.push(this.msg_array[index]);
				this.msg_array[index] = null;
			}
		}
		this.msg_start = 0;
		this.msg_count = 0;
*/
	}
});

var HttpSession = user_session.UserSession.extend({
	init : function ()
	{
		this._super();
		this.session_key = '';
		this.msg_count = 0;
		this.msgq_array = [];
		this.res = null;
		this.pull_res = null;
		this.pull_timer = -1;
		for(i=0; i<http_message_queue.length; i++) {
			this.msgq_array.push(new BoardcastMessageQueue(http_message_queue[i]));
		}
	},
	login : function (uid)
	{
		this.session_key = utils.genSessionKey(uid);
		session_map[this.session_key] = this;
		return this._super(uid);
	},
	logout : function ()
	{
		if(this.session_key!='') {
			session_map[this.session_key] = undefined;
			this.session_key = '';
		}

		if(this.pull_res!=null) {
			this.pull_res.writeHead(200);
			this.pull_res.end('ERROR=0');
			timer.clearTimerout(this.pull_timer);
			this.pull_res = null;
			this.pull_timer = -1;
		}

		this._super();
	},
	pushMessage : function (message)
	{
		if(message.level<0 && message.level>=this.msgq_array.length) {
			return;
		}

		this.msg_count++;
		this.msgq_array[message.level].pushMessage(message);

		if(this.pull_res!=null) {
			var res = this.pull_res;
			timer.clearTimerout(this.pull_timer);
			this.pull_res = null;
			this.pull_timer = -1;
			this.pullMessage(res);
		}
	},
	pullMessage : function (res)
	{
		if(this.pull_res!=null) {
			this.pull_res.writeHead(200);
			this.pull_res.end('ERROR=0');
			timer.clearTimerout(this.pull_timer);
			this.pull_res = null;
			this.pull_timer = -1;
		}

		if(this.msg_count==0) {
			var session = this;
			this.pull_res = res;
			this.pull_timer = timer.setTimeout(function () {
				timer.clearTimerout(sessionsession.pull_timer);
				session.pull_res = null;
				session.pull_timer = -1;
				res.writeHead(200);
				res.end('ERROR=0');
			}, 20000);
			return;
		}
/*
		res.writeHead(200);
		this.res.write('{"response":[');
		var count = 0;
		for(q=0; q<this.msgq_array.length; q++) {
			for(i=0; i<(this.msgq_array[q]).length; i++) {
				if(count>0) this.res.write(',');
				this.res.write((this.msgq_array[q])[i].body);
				count++;
			}
			this.msgq_array[q] = [];
		}
		this.res.write(']}');
		this.res.end();
*/
		this.msg_count = 0;
	},
	begin : function (res)
	{
		if(!this._super()) {
			return false;
		}
		this.res = res;
		this.pending = false;
		this.sendqueue = [];
		return true;
	},
	end : function (err)
	{
		if(this.res==null) return;

		if(err) {
			this.res.writeHead(200);
			this.res.end('ERROR='+err);
		} else {
			this.res.writeHead(200);
			this.res.write('{"response":[');
			for(i=0; i<this.sendqueue.length; i++) {
				if(i>0) this.res.write(',');
				this.res.write(this.sendqueue[i]);
			}
			this.res.write(']}');
			this.res.end();
		}

		this.res = null;
		this.sendqueue = [];
	},
	send : function (msg)
	{
		if(this.res==null) return;
		this.sendqueue.push(msg);
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
			var session = user_session.getSession(user_id);
			if(session) {
				if(!session.isPending()) {
					session.logoutSession();
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

	if(session.isPending()) {
		res.writeHead(200);
		res.end('ERROR=TRY_AGAIN');
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

	if(!user_session.call(session, method, message)) {
		session.end('UNDEFINE_METHOD');
		return;
	}

	if(!session.isPending()) {
		session.end();
	}
}

function method_pull(args, res)
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

	session.pullMessage(res);
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

	for(var i in session_map) {
		session_map[i].logout();
	}
}
