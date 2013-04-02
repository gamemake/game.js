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
	for(i=0; i<this.msg_count; i++) {
		var index = (this.msg_start+i) % this.msg_array.length;
		ret.push(this.msg_array[index]);
		this.msg_array[index] = null;
	}
	this.msg_start = 0;
	this.msg_count = 0;
}

function BoardcastSubscriber(manager, index, user_id, user_name)
{
	this.manager = manager;
	this.index = index;
	this.user_id = user_id;
	this.user_name = user_name;
	this.domains = {};
	this.msgq_array = [];
	this.msgq_array.length = manager.msgq_level_count;
	for(i=0; i<this.msgq_array.length; i++) {
		this.msgq_array[i] = new BoardcastMessageQueue(manager.msgq_size);
	}
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
		domain.leave(this.user_id);
	}
}

BoardcastSubscriber.prototype.leaveAllDomains = function ()
{
	for(var i in this.domains) {
		domain.leave(this.user_id);
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

BoardcastDomain.join = function (user_id, index)
{
	this.users[user_id] = index;
}

BoardcastDomain.leave = function (user_id)
{
	this.users[user_id] = undefined;
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
	this.user_id_map = {};
	this.user_name_map = {};
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

BoardcastManager.prototype.login = function (user_id, user_name)
{
	if(this.user_name_map[user_name]!=undefined) {
		return undefined;
	}
	if(this.user_id_map[user_id]!=undefined) {
		return undefined;
	}

	var index = this.user_free.pop();
	if(index==undefined) {
		index = this.user_array.length;
		this.user_array.push(null);
	}

	var userobj = new BoardcastSubscriber(this, index, user_id, user_name);
	this.user_name_map[user_name] = index;
	this.user_id_map[user_id] = index;
	this.user_array[index] = userobj;
}

BoardcastManager.prototype.logout = function (user_id)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return;
	}

	var userobj = this.user_array[index];
	userobj.leaveAllDomains();
	this.user_name_map[userobj.user_name] = undefined;
	this.user_id_map[userobj.user_id] = undefined;
	this.user_array[index] = null;
	this.user_free.push(index);
}

BoardcastManager.prototype.joinDomain = function(user_id, domain_id)
{
	var index = this.user_id_map[user_id];
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

BoardcastManager.prototype.leaveDomain = function(user_id, domain_id)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return;
	}

	var userobj = this.user_array[index];
	userobj.leaveDomain(domain_id);
}

BoardcastManager.prototype.sendToUserId = function (user_id, message)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return;
	}
	this.user_array[index].pushMessage(message);
}

BoardcastManager.prototype.sendToUserName = function (user_name, message)
{
	var index = this.user_name_map[user_name];
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

BoardcastManager.prototype.getMessage = function (user_id)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return undefined;
	}

	var userobj = this.user_array[index];
	return userobj.getMessage();
}

BoardcastManager.prototype.getSubscriber = function (user_id)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return undefined;
	}
	return this.user_array[index];
}

BoardcastManager.prototype.getDomain = function (domain_id)
{
	return this.domains[domain_id];
}

module.exports.createManager = function (msgq_level_count, msgq_size) {
	return new BoardcastManager(msgq_level_count, msgq_size);
}

module.exports.createMessage = function (level, body) {
	return new BoardcastMessage(level, body);
}
