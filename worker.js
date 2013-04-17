
var user_session = require('./user_session.js');
var log = require('./log.js');

var user_map = {};

function UserSessionProxy(_uid)
{
	this.uid = _uid;
}

UserSessionProxy.prototype.logout = function ()
{
	delete user_map[this.uid];
	process.send({method:0, uid:this.uid})
}

UserSessionProxy.prototype.send = function (_msg)
{
	var s_msg = {method:1, uid:this.uid, msg:_msg};
	process.send(s_msg);
}

UserSessionProxy.prototype.bindAvatarId = function (_aid)
{
	process.send({method:2, uid:this.uid, aid:_aid})
}

UserSessionProxy.prototype.unbindAvatarId = function ()
{
	process.send({method:3, uid:this.uid})
}

UserSessionProxy.prototype.bindName = function (_name)
{
	process.send({method:4, uid:this.uid, name:_name})
}

UserSessionProxy.prototype.unbindName = function ()
{
	process.send({method:5, uid:this.uid})
}

UserSessionProxy.prototype.joinDomain = function (_domain_id)
{
	process.send({method:6, uid:this.uid, domain_id:_domain_id})
}

UserSessionProxy.prototype.leaveDomain = function (domain_id)
{
	process.send({method:7, uid:this.uid, domain_id:_domain_id})
}

UserSessionProxy.prototype.sendToAllUser = function (_msg)
{
	process.send({method:8, uid:this.uid, msg:_msg})
}

UserSessionProxy.prototype.sendToAllAvatar = function (_msg)
{
	process.send({method:9, uid:this.uid, msg:_msg})
}

UserSessionProxy.prototype.sendToUID = function (_uid, _msg)
{
	process.send({method:10, uid:this.uid, d_uid:_uid, msg:_msg})
}

UserSessionProxy.prototype.sendToAID = function (_aid, _msg)
{
	process.send({method:11, uid:this.uid, d_aid:_aid, msg:_msg})
}

UserSessionProxy.prototype.sendToName = function (_name, _msg)
{
	process.send({method:12, uid:this.uid, d_name:_name, msg:_msg})
}

UserSessionProxy.prototype.sendToDomain = function (_domain_id, _msg)
{
	process.send({method:13, uid:this.uid, d_domain_id:_domain_id, msg:_msg})
}

exports.run = function ()
{
	process.on('message', function (msg) {
		var uid = msg.uid;
		var session = user_map[uid];
		if(session==undefined) {
			if(msg.method==0) {
				session = new UserSessionProxy(uid);
				user_map[uid] = session;
			} else {
				log.error('user session not found!');
				return;
			}
		}

		user_session.callMethod(session, msg.method, msg.args);
	});
}

exports.callMethod = function (session, method_id, _args)
{
	var msg = {
		uid : session.uid,
		method : method_id,
		args : _args
	};

	session.worker.send(msg);
}
