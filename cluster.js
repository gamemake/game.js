
var	numCPUs = require('os').cpus().length;
var cluster = require('cluster');

var workers = [];
var isrunning = false;

exports.startCluster = function (count, on_message)
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
		item.worker.on('message', on_message);
		item.worker.send({method:'start', args:{worker_id:worker.id}});
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

exports.stopCluster = function ()
{
	if(!isrunning) return;

	isrunning = false;
	for(i=0; i<workers.length; i++) {
		var worker = workers[i];
		if(worker!=undefined) {
			if(worker.enable) {
				worker.worker.kill();
			}
		}
	}
}

exports.allocWorker = function ()
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

exports.incWorkload = function (worker)
{
	workers[worker.id].workload += 1;
}

exports.decWorkload = function (worker)
{
	workers[worker.id].workload -= 1;
}
