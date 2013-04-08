
var message_seq = 0;
const message_max = 800000000;

function BoardcastMessage(level, body)
{
	this.level = level;
	this.body = body;
	this.seq = message_seq++;
	if(message_seq==message_max) {
		message_seq = 0;
	}
}

function BoardcastMessageQueue(size)
{
	this.msg_array = [];
	this.msg_array.length = size;
	this.msg_start = 0;
	this.msg_count = 0;
}

BoardcastMessageQueue.prototype.pushMessage = function (message)
{
	var index = (this.msg_start + this.msg_count) % this.msg_array.length;
	this.msg_array[index] = message;
	if(this.msg_count<this.msg_array.length) {
		this.msg_count += 1;
	}
}

BoardcastMessageQueue.prototype.getMessage = function (ret)
{
	if(this.msg_count>0) {
		for(i=0; i<this.msg_count; i++) {
			var index = (this.msg_start+i) % this.msg_array.length;
			ret.push(this.msg_array[index]);
			this.msg_array[index] = null;
		}
	}
	this.msg_start = 0;
	this.msg_count = 0;
}

function BoardcastSubscriber(manager, index, uid)
{
	this.manager = manager;
	this.index = index;
	this.uid = uid;
	this.aid = -1;
	this.name = '';
	this.domains = {};
	this.msgq_array = [];
	this.msgq_array.length = manager.msgq_level_count;
	for(i=0; i<this.msgq_array.length; i++) {
		this.msgq_array[i] = new BoardcastMessageQueue(manager.msgq_size);
	}
}

BoardcastSubscriber.prototype.bindAvatarId = function(aid)
{
	if(this.aid==-1) {
		if(manager.aid_map[aid]==undefined) {
			manager.aid_map[aid] = this.uid;
			this.aid = aid;
			return true;
		}
	}
	return false;
}

BoardcastSubscriber.prototype.unbindAvatarId = function()
{
	if(this.aid!=-1) {
		manager.aid_map[this.aid] = undefined;
		this.aid = -1;
		return true;
	}
	return false;
}

BoardcastSubscriber.prototype.bindName = function(name)
{
	if(this.name=='') {
		if(manager.name_map[name]==undefined) {
			manager.name_map[name] = this.uid;
			this.name = name;
			return true;
		}
	}
	return false;
}

BoardcastSubscriber.prototype.unbindName = function()
{
	if(this.name!='') {
		manager.name_map[this.name] = undefined;
		this.name = '';
		return true;
	}
	return false;
}

BoardcastSubscriber.prototype.joinDomain = function (domain)
{
	domains[domain.domain_id] = domain;
}

BoardcastSubscriber.prototype.leaveDomain = function (domain_id)
{
	var domain = domains[domain_id];
	if(domain!=undefined) {
		domains[domain_id] = undefined;
		domain.leave(this.uid);
	}
}

BoardcastSubscriber.prototype.leaveAllDomains = function ()
{
	for(var i in this.domains) {
		domain.leave(this.uid);
	}
	this.domains = {};
}

BoardcastSubscriber.prototype.pushMessage = function (message)
{
	if(message.level<0 && message.level>=this.msgq_array.length) {
		return;
	}
	this.msgq_array[message.level].pushMessage(message);
}

BoardcastSubscriber.getMessage = function ()
{
	var ret = [];
	for(i=0; i<this.msgq_array.length; i++) {
		this.msgq_array[i].get(ret);
	}
	return ret;
}

function BoardcastDomain(manager, domain_id)
{
	this.manager = manager;
	this.domain_id = domain_id;
	this.users = {};
}

BoardcastDomain.join = function (uid, index)
{
	this.users[uid] = index;
}

BoardcastDomain.leave = function (uid)
{
	this.users[uid] = undefined;
	if(this.users.length==0) {
		manager.domains[this.domain_id] = undefined;
	}
}

BoardcastDomain.pushMessage = function(message)
{
	for(var key in this.users) {
		manager.user_array[this.users[key]].pushMessage(message);
	}
}

function BoardcastManager(config)
{
	this.uid_map = {};
	this.aid_map = {}
	this.name_map = {};
	this.user_array = [];
	this.user_free = [];
	this.domains = {};
	this.msgq_level_count = 1;
	this.msgq_size = 100;

	for(var i in config) {
		var type = typeof(config[i]);
		if(type==typeof(this[i]) && type=='number') {
			this[i] = config[i];
		}
	}
}

BoardcastManager.prototype.login = function (uid)
{
	if(this.name_map[name]!=undefined) {
		return undefined;
	}
	if(this.uid_map[uid]!=undefined) {
		return undefined;
	}

	var index = this.user_free.pop();
	if(index==undefined) {
		index = this.user_array.length;
		this.user_array.push(null);
	}

	var userobj = new BoardcastSubscriber(this, index, uid);
	this.uid_map[uid] = index;
	this.user_array[index] = userobj;
	return userobj;
}

BoardcastManager.prototype.logout = function (uid)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return;
	}

	var userobj = this.user_array[index];
	userobj.leaveAllDomains();
	userobj.unbindName();
	userobj.unbindAvatarId();
	this.uid_map[userobj.uid] = undefined;
	this.user_array[index] = null;
	this.user_free.push(index);
}

BoardcastManager.prototype.joinDomain = function(uid, domain_id)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return;
	}

	var userobj = this.user_array[index];
	var domain = this.domains[domain_id];
	if(domain==undefined) {
		domain = new BoardcastDomain(domain_id);
		this.domains[domain_id] = domain;
	}
	userobj.joinDomain(domain);
}

BoardcastManager.prototype.leaveDomain = function(uid, domain_id)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return;
	}

	var userobj = this.user_array[index];
	userobj.leaveDomain(domain_id);
}

BoardcastManager.prototype.sendByUID = function (uid, message)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return;
	}
	this.user_array[index].pushMessage(message);
}

BoardcastManager.prototype.sendByAID = function (uid, message)
{
	var index = this.aid_map[aid];
	if(index==undefined) {
		return;
	}
	this.user_array[index].pushMessage(message);
}

BoardcastManager.prototype.sendByName = function (name, message)
{
	var index = this.name_map[name];
	if(index==undefined) {
		return;
	}

	var message = new BoardcastMessage(level, body);
	this.user_array[index].pushMessage(message);
}

BoardcastManager.prototype.sendToDomain = function (domain_id, message)
{
	var domain = this.getDomain(domain_id);
	if(domain!=undefined) {
		domain.pushMessage(message);
	}
}

BoardcastManager.prototype.getMessage = function (uid)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return undefined;
	}

	var userobj = this.user_array[index];
	return userobj.getMessage();
}

BoardcastManager.prototype.getSubscriber = function (uid)
{
	var index = this.uid_map[uid];
	if(index==undefined) {
		return undefined;
	}
	return this.user_array[index];
}

BoardcastManager.prototype.getDomain = function (domain_id)
{
	return this.domains[domain_id];
}

module.exports.createManager = function (msgq_level_count, msgq_size)
{
	return new BoardcastManager(msgq_level_count, msgq_size);
}

module.exports.createMessage = function (level, body)
{
	return new BoardcastMessage(level, body);
}
