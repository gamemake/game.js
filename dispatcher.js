
var config = require('./config.js');
var group_map = {};

(function(){
	var modules = config.get('modules');
	for(var i in modules) {
		group_map[i] = require(modules[i]);
	}
})();

module.exports.call = function (session, method, args)
{
	var names = method.split('.');
	if(names.length!=2) {
		return false;
	}

	var group = group_map[names[0]];
	if(group==undefined) {
		return false;
	}

	var func = group[names[1]];
	func(session, args);
	return true;
}
