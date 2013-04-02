
function BoardcastMessage(level, body)
{
	this.level = level;
	this.body = body;
	this.create_time = 0;
}

function BoardcastMessageQueue(size)
{
	this.msg_array = [];
	this.msg_start = 0;
	this.msg_count = 0;
}

BoardcastMessageQueue.push = function (message)
{
	var index = (this.msg_start + this.msg_count) % this.msg_array.length;
	this.msg_array[index] = message;
	if(this.msg_count<this.msg_array.length) {
		this.msg_count += 1;
	}
}

BoardcastMessageQueue.getMessages = function (timestamp, ret)
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
	for(i=0; i<manager.msgq_level_count; i++) {
		this.msgq_array.push(new BoardcastMessageQueue(manager.msgq_size));
	}
}

BoardcastSubscriber.leaveAllDomains = function ()
{
	this.domains.forEach(function(entry) {
		domain = manager.getDomain(entry);
		if(domain!=undefined) {
			domain.leave(this.user_id);
		}
	});
	this.domains = [];
}

BoardcastSubscriber.pushMessage = function (message)
{
	if(message.level<0 && message.level>=this.msgq_array.length) {
		return;
	}
	this.msgq_array[message.level].push(message);
}

BoardcastSubscriber.getMessages = function (timestamp)
{
	var ret = [];
	for(i=0; i<this.msgq_array.length; i++) {
		this.msgq_array[i].getMessages(timestamp, ret);
	}
}

function BoardcastDomain(manager, domain_id)
{
	this.manager = manager;
	this.domain_id = domain_id;
	this.users = {};
}

BoardcaseDomain.join = function (user_id, index)
{
	this.users[user_id] = index;
}

BoardcaseDomain.leave = function (user_id)
{
	this.users[user_id] = undefined;
	if(this.users.length==0) {
		manager.domains[this.domain_id] = undefined;
	}
}

function BoardcastManage(msgq_leveL_count, msgq_size)
{
	this.user_id_map = {};
	this.user_name_map = {};
	this.user_array = [];
	this.user_free = [];
	this.domains = {};
	this.msgq_level_count = msgq_level_count;
	this.msgq_size = msgq_size;
}

BoardcastManage.loginUser = function (user_id, user_name)
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

	var userobj = new BoardcastSubscriber(index, user_id, user_name);
	this.user_name_map[user_name] = index;
	this.user_id_map[user_id] = index;
	this.user_array[index] = userobj;
}

BoardcastManager.logoutUser = function (user_id)
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

BoardcastManager.sendToUserId = function (user_id, message)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return;
	}
	this.user_array[index].pushMessage(message);
}

BoardcastManager.sendToUserName = function (user_name, message)
{
	var index = this.user_name_map[user_name];
	if(index==undefined) {
		return;
	}

	var message = new BoardcastMessage(level, body);
	this.user_array[index].pushMessage(message);
}

BoardcastManager.sendToDomain = function (domain_id, message)
{
	var domain = this.getDomain(domain_id);
	if(domain!=undefined) {
		domain.pushMessage(message);
	}
}

BoardcastManager.getSubscriber = function (uid)
{
	var index = this.user_id_map[user_id];
	if(index==undefined) {
		return undefined;
	}
	return this.user_array[index];
}

BoardcastManager.getDomain = function (domain_id)
{
	return this.domains[domain_id];
}

module.export.createManager = function (msgq_leveL_count, msgq_size) {
	return new BoardcastManage(msgq_leveL_count, msgq_size);
}

module.export.createMessage = function (level, body) {
	return new BoardcastMessage(level, body);
}
