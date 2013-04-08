
var group_map = {};

module.exports.call = function (session, method, args)
{
	var names = method.split('.');
	var group = group_map[names[0]];
	if(group==undefined) {
		return false;
	} else {
		if(names.length==1) {
			return group(session, '', args);
		}
		if(names.length==2) {
			return group(session, names[1], args)
		}
		return false;
	}
}

module.exports.register = function (name, proc)
{
	group_map[name] = proc;
}
