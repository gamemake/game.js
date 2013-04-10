var config = require('./config.js');
var modules = {};
var main_module = undefined;
var log = require('./log.js');
var boardcast = require('./boardcast.js');

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
	},
	login : function (uid) { return this._super(uid); },
	logout : function () { this._super(); },

	// from frontend
	loginSession : function ()
	{

	},
	call : function (method, args)
	{
		var names = method.split('.');
		if(names.length!=2) {
			return false;
		}

		var module = modules[names[0]];
		if(module==undefined) return false;

		var func = module[names[1]];
		if(func==undefined) return false;

		func(this, args);
		return true;
	},
	logoutSession : function ()
	{

	}

});

exports.UserSession = UserSession;

exports.getSession = function (uid)
{
	return boardcast_manager.getSubscriberByUID(uid);
}
