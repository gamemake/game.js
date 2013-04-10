var config = require('./config.js');
var modules = {};
var main_module = undefined;
var log = require('./log.js');
var boardcast = require('./boardcast.js');
var dal_avatar = require('./dal_avatar.js');

(function(){
	var modules_config = config.get('modules');
	for(var i in modules_config) {
		modules[i] = require(modules_config[i]);
		if(modules[i].hasOwnProperty('isMainModule')) {
			if(modules[i].isMainModule()) {
				if(main_module==undefined) {
					main_module = modules[i];
				} else {
					log.warning('duplicate main module');
				}
			}
		}
	}
})();

var boardcast_manager = boardcast.createManager({});

var UserSession = boardcast.Subscriber.extend({
	init : function ()
	{
		this._super(boardcast_manager);
		this.pending = false;
		this.avatar = null;
	},
	/*
	login : function (uid) { return this._super(uid); },
	logout : function () { this._super(); },
	begin : function () { },
	end : function() { },
	send : function () { },
	*/
	loginSession : function (callback)
	{
		var session = this;
		session.login();
		session.setPending(true);

		dal_avatar.getAvatarList(this.uid, function (err, result) {
			this.avatar_list = result;
			main_module.loginSession(function(){
				session.setPending(false);
				if(callback!=undefined) callback();
			});
		});
	},
	logoutSession : function (callback)
	{
		var session = this;
		session.setPending(true);

		main_module.logoutSession(function () {
			function completed()
			{
				session.setPending(false);
				session.logout();
				if(callback!=undefined) callback();
			}
			if(session.avatar!=null) {
				session.avatar.save(function () {
					session.avatar = null;
					completed();
				});
			} else {
				completed();
			}
		});

	},
	setPending : function (flag)
	{
		if(flag) {
			this.pending = true;
		} else {
			this.pending = false;
		}
	},
	isPending : function ()
	{
		return this.pending;
	}
});

module.exports.UserSession = UserSession;

module.exports.getSession = function (uid)
{
	return boardcast_manager.getSubscriberByUID(uid);
}

module.exports.call = function (session, method, args)
{
	var names = method.split('.');
	if(names.length!=2) {
		return false;
	}

	var module = modules[names[0]];
	if(module==undefined) return false;

	var func = module[names[1]];
	if(func==undefined) return false;

	func(session, args);
	return true;
}
