
var	numCPUs = require('os').cpus().length;
var cluster = require('cluster');

var workers = [];
var isrunning = false;

module.exports.startCluster = function (count)
{
	if(count!=undefined) {
		numCPUs = count;
	}

	cluster.on('online', function (worker) {
		if(worker.id>=workers.length) {
			workers.length = worker.id + 1;
		}
		var item = {};
		item.worker = worker;
		item.workload = 0;
		item.enable = true;
		workers[worker.id] = item;
	});

	cluster.on('disconnect', function (worker) {
		workers[worker.id].enable = false;
	});

	cluster.on('exit', function (worker) {
		workers[worker.id] = undefined;
		if(isrunning) {
			cluster.fork();
		} else {
		}
	});

	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	isrunning = true;
}

module.exports.stopCluster = function ()
{
	if(!isrunning) return;

	isrunning = false;
	for(i=0; i<workers.length; i++) {
		var worker = workers[i];
		if(worker!=undefined) {
			if(worker.enable) {
				worker.exit();
			}
		}
	}
}

module.exports.allocWorker = function ()
{
	var ret = undefined;
	var item = undefined;
	for(i=0; i<workers.length; i++) {
		item = workers[i];
		if(item!=undefined && item.enable = true) {
			if(ret==undefined || ret.workload>item.workload) {
				ret = item;
				break;
			}
		}
	}
	return ret;
}

module.exports.incWorkload = function (worker)
{
	workers[worker.id].workload += 1;
}

module.exports.decWorkload = function (worker)
{
	workers[worker.id].workload -= 1;
}
