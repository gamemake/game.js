
var Class = require('./class.js');

var message_seq = 0;
const message_max = 800000000;

var BoardcastMessage = Class.extend({
	init : function(level, body)
	{
		this.level = level;
		this.body = body;
		this.seq = message_seq++;
		if(message_seq==message_max) {
			message_seq = 0;
		}
	}
});

var BoardcastSubscriber = Class.extend({
	init : function (manager)
	{
		this.manager = manager;
		this.index = -1;
		this.uid = -1;
		this.aid = -1;
		this.name = '';
		this.domains = {};
	},
	login : function (user_id)
	{
		if(this.manager.uid_map[user_id]!=undefined) {
			return false;
		}
		this.index = this.manager.user_free.pop();
		if(this.index==undefined) {
			this.index = this.manager.user_array.length;
			this.manager.user_array.push(this);
		} else {
			this.manager.user_array[index] = this;
		}
		this.uid = user_id;
		this.manager.uid_map[user_id] = this.index;
		return true;
	},
	logout : function ()
	{
		for(var i in this.domains) {
			domain.leave(this.uid);
		}
		this.domains = {};
		if(this.name.length!='') {
			this.unbindName();
		}
		if(this.aid!=-1) {
			this.unbindAvatarId();
		}
		if(this.uid!=-1) {
			this.manager.uid_map[this.uid] = undefined;
		}
		if(this.index!=-1) {
			this.manager.user_array[this.index] = null;
			this.manager.user_free.push(this.index);
		}
	},
	bindAvatarId : function(aid)
	{
		if(this.aid==-1) {
			if(manager.aid_map[aid]==undefined) {
				manager.aid_map[aid] = this.uid;
				this.aid = aid;
				return true;
			}
		}
		return false;
	},
	unbindAvatarId : function()
	{
		if(this.aid!=-1) {
			manager.aid_map[this.aid] = undefined;
			this.aid = -1;
			return true;
		}
		return false;
	},
	bindName : function(name)
	{
		if(this.name=='') {
			if(manager.name_map[name]==undefined) {
				manager.name_map[name] = this.uid;
				this.name = name;
				return true;
			}
		}
		return false;
	},
	unbindName : function()
	{
		if(this.name!='') {
			manager.name_map[this.name] = undefined;
			this.name = '';
			return true;
		}
		return false;
	},
	joinDomain : function (domain)
	{
		domains[domain.domain_id] = domain;
	},
	leaveDomain : function (domain_id)
	{
		var domain = domains[domain_id];
		if(domain!=undefined) {
			domains[domain_id] = undefined;
			domain.leave(this.uid);
		}
	}
});

var BoardcastDomain = Class.extend({
	init : function (manager, domain_id)
	{
		this.manager = manager;
		this.domain_id = domain_id;
		this.users = {};
	},
	join : function (uid, index)
	{
		this.users[uid] = index;
	},
	leave : function (uid)
	{
		this.users[uid] = undefined;
		if(this.users.length==0) {
			manager.domains[this.domain_id] = undefined;
		}
	},
	pushMessage : function(message)
	{
		for(var key in this.users) {
			manager.user_array[this.users[key]].pushMessage(message);
		}
	}
});

var BoardcastManager = Class.extend({
	init : function (config)
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
	},
	joinDomain : function(uid, domain_id)
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
	},
	leaveDomain : function(uid, domain_id)
	{
		var index = this.uid_map[uid];
		if(index==undefined) {
			return;
		}

		var userobj = this.user_array[index];
		userobj.leaveDomain(domain_id);
	},
	sendToUID : function (uid, message)
	{
		var index = this.uid_map[uid];
		if(index==undefined) {
			return;
		}
		this.user_array[index].pushMessage(message);
	},
	sendToAID : function (uid, message)
	{
		var index = this.aid_map[aid];
		if(index==undefined) {
			return;
		}
		this.user_array[index].pushMessage(message);
	},
	sendToName : function (name, message)
	{
		var index = this.name_map[name];
		if(index==undefined) {
			return;
		}

		var message = new BoardcastMessage(level, body);
		this.user_array[index].pushMessage(message);
	},
	sendToDomain : function (domain_id, message)
	{
		var domain = this.getDomain(domain_id);
		if(domain!=undefined) {
			domain.pushMessage(message);
		}
	},
	getSubscriberByUID : function (uid)
	{
		var index = this.uid_map[uid];
		if(index==undefined) {
			return undefined;
		}
		return this.user_array[index];
	},
	getSubscriberByAID : function (aid)
	{
		var index = this.aid_map[aid];
		if(index==undefined) {
			return undefined;
		}
		return this.user_array[index];
	},
	getSubscriberByName : function (name)
	{
		var index = this.name_map[name];
		if(index==undefined) {
			return undefined;
		}
		return this.user_array[index];
	},
	getDomain : function (domain_id)
	{
		return this.domains[domain_id];
	}
});

module.exports.createManager = function (msgq_level_count, msgq_size)
{
	return new BoardcastManager(msgq_level_count, msgq_size);
};

module.exports.Subscriber = BoardcastSubscriber;

module.exports.createMessage = function (level, body)
{
	return new BoardcastMessage(level, body);
};
