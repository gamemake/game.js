
var config = require('./config.js');
var modules = {};
var main_module = undefined;
var log = require('./log.js');

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

module.exports.login = main_module.login;
module.exports.logout = main_module.logout;

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
