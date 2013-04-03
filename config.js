
var global_config = {};

module.exports.load = function (file)
{
	var config = {};

	try {
		config = require(file);
	} catch(e) {
		console.log()
		return false;
	}

	global_config = config;
	return true;
}

module.exports.get = function (name)
{
	var arr = name.split('.');
	if(arr.length==0) return undefined;
	var obj = global_config;
	for(i=0; i<arr.length; i++) {
		if(typeof(obj)!='object') return undefined;
		obj = obj[arr[i]];
		if(obj==undefined) return undefined;
	}
	return obj;
}
