var config = require('./config.js');
var log = require('./log.js');
var boardcast = require('./boardcast.js');
var cluster = require('./cluster.js');

var method_map = {};
                 // login      logout
var method_array = [undefined, undefined];

(function () {
	var modules_config = config.get('modules');
	var main_module = undefined;
	for(var i in modules_config) {
		var isMainModule = false;
		var mod = require(modules_config[i]);
		if(mod.hasOwnProperty('isMainModule')) {
			if(mod.isMainModule) {
				if(main_module==undefined) {
					isMainModule = true;
					main_module = mod;
				} else {
					log.error('duplicate main mod ' + i);
					process.exit(-1);
				}
			}
		}

		if(mod.method_table!=undefined) {
			if(typeof(mod.method_table)!='object') {
				log.error('invalid method table' + i);
				process.exit(-1);
			}
			for(var f in mod.method_table) {
				if(typeof(mod.method_table[f])!='function') {
					log.error('module ' + i + '@' + f + ' not founction');
					process.exit(-1);
				}
				method_map[i+'.'+f] = method_array.length;
				method_array.push(mod.method_table[f]);
			}
		}
	}

	if(main_module==undefined) {
		log.error('main module not found');
		process.exit(-1);
	}
	method_array[0] = main_module.login;
	method_array[1] = main_module.logout;
})();

var boardcast_manager = boardcast.createManager({});

var UserSession = boardcast.Subscriber.extend({
	init : function ()
	{
		this.worker = null;
		this._super(boardcast_manager);
	},
	login : function (uid)
	{
		this.worker = cluster.allocWorker();
		cluster.incWorkload(this.worker);
		return this._super(uid);
	},
	logout : function ()
	{
		if(this.worker!=null) {
			cluster.decWorkload(this.worker);
			this.worker = null;
		}
		this._super();
	},
});

exports.UserSession = UserSession;

exports.getSession = function (uid)
{
	return boardcast_manager.getSubscriberByUID(uid);
}

exports.getMethodId = function (method)
{
	var index = method_map[method];
	if(index==undefined) return -1;
	return index;
}

exports.getSession = function (user_id)
{
	return boardcast_manager.getSubscriberByUID(user_id);
}

exports.callMethod = function(session, method_id, _args)
{
	if(method_id<0 || method_id>=method_array.length)
	{
		return;
	}

	method_array[method_id](session, _args);
}
