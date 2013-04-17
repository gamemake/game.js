
var	numCPUs = require('os').cpus().length;
var cluster = require('cluster');
var user_session = require('./user_session.js');

var workers = [];
var isrunning = false;

function processMessage(msg)
{
	console.log('recvfrom node ' + JSON.stringify(msg));

	var session = user_session.getSession(msg.uid);
	if(session==undefined) return;

	switch(msg.method) {
	// 0: logout(uid)
	case 0:
		session.logout();
		break;
	// 1: send(uid)
	case 1:
		session.send(msg.msg);
		break;
	// 2: bindAvatarId(uid, aid)
	case 2:
		session.bindAvatarId(msg.aid);
		break;
	// 3: unbindAvatarId(uid)
	case 3:
		session.unbindAvatarId();
		break;
	// 4: bindName(uid, name)
	case 4:
		session.bindName(msg.name);
		break;
	// 5: unbindName(uid)
	case 5:
		session.unbindName();
		break;
	// 6: joinDomain(uid, domain_id)
	case 6:
		session.joinDomain(msg.domain_id);
		break;
	// 7: leaveDomain(uid, domain_id)
	case 7:
		session.leaveDomain(msg.domain_id);
		break;
	// 8: sendToAllUser(uid, message)
	case 8:
		session.sendToAllUser(msg.msg);
		break;
	// 9: sendToAllAvatar(uid, message)
	case 9:
		session.sendToAllAvatar(msg.msg);
		break;
	// 10: sendToUID(uid, d_uid message)
	case 10:
		session.sendToUID(msg.d_uid, msg.msg);
		break;
	// 11: sendToAID(uid, d_aid, message)
	case 11:
		session.sendToAID(msg.d_aid, msg.msg);
		break;
	// 12: sendToName(uid, d_name, message)
	case 12:
		session.sendToName(msg.d_name, msg.msg);
		break;
	// 13: sendToDomain(uid, domain_id, message)
	case 13:
		session.sendToDomain(msg.d_domain_id, msg.msg);
		break;
	}
}

exports.startCluster = function (count)
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
		item.worker.on('message', processMessage);
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
		if(item!=undefined && item.enable) {
			if(ret==undefined || ret.workload>item.workload) {
				ret = item;
				break;
			}
		}
	}
	return ret.worker;
}

exports.incWorkload = function (worker)
{
	workers[worker.id].workload += 1;
}

exports.decWorkload = function (worker)
{
	workers[worker.id].workload -= 1;
}

exports.isMaster = function ()
{
	return cluster.isMaster;
}
