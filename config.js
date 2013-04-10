
var fs = require('fs');
var global_config = {};

exports.load = function (filename)
{
	try {

		var body = fs.readFileSync(filename);
		var root = JSON.parse(body);
		global_config = root;
	} catch(e) {
		console.log('load config failed');
		process.exit(1);
	}
}

exports.get = function (name)
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
