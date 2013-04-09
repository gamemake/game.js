
var fs = require('fs');
var config = require('./config.js').get('log');

if(config.option.encoding=='') {
	config.option.encoding = null;
}
config.option.mode = eval(config.option.mode);

var logfile = fs.createWriteStream(config.path, config.option);
var write_queue = [];
var loglevels = ['INFO', 'DEBUG', 'WARNING', 'ERROR', 'TRACE'];
var min_level = config.log_level;

function pad2(num)
{
	return num > 9 ? num : '0' + num;
}
 
function getTime()
{
	var t = new Date();
	return [t.getFullYear(), '-', pad2(t.getMonth() + 1) , '-', pad2(t.getDate()), ' ',
		pad2(t.getHours()), ':', pad2(t.getMinutes()), ':', pad2(t.getSeconds())].join('');
}

function write_log(level, msg)
{
	if(level<min_level) return;

	msg = getTime() + ' [' + loglevels[level] + '] ' + msg;

	console.log(msg);
}

module.exports = {
	info	: function (msg) { write_log(0, msg); },
	debug	: function (msg) { write_log(1, msg); },
	warning	: function (msg) { write_log(2, msg); },
	error	: function (msg) { write_log(3, msg); },
	trace	: function (msg) { write_log(4, msg); }
}
