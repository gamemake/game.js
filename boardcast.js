
var Class = require('./class.js');

var message_seq = 0;
const message_max = 800000000;

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
			this.manager.user_array[this.index] = this;
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
			delete this.manager.uid_map[this.uid];
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
			delete manager.aid_map[this.aid];
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
			delete manager.name_map[this.name];
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
			delete domains[domain_id];
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
		delete this.users[uid];
		if(this.users.length==0) {
			delete manager.domains[this.domain_id];
		}
	},
	pushMessage : function(message, level)
	{
		for(var key in this.users) {
			manager.user_array[this.users[key]].pushMessage(message, level);
		}
	}
});

var BoardcastManager = Class.extend({
	init : function ()
	{
		this.uid_map = {};
		this.aid_map = {}
		this.name_map = {};
		this.user_array = [];
		this.user_free = [];
		this.domains = {};
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
	sendToAllUser : function (message)
	{
		for(i=0; i<this.user_array.length; i++) {
			var session = this.user_array[i];
			if(session!=undefined && session.uid!=-1) {
				session.pushMessage(message);
			}
		}
	},
	sendToAllAvatar : function (message)
	{
		for(i=0; i<this.user_array.length; i++) {
			var session = this.user_array[i];
			if(session!=undefined && session.aid!=-1) {
				session.pushMessage(message);
			}
		}
	},
	sendToUID : function (uid, message)
	{
		function _push(manager, uid)
		{
			var index = manager.uid_map[uid];
			if(index==undefined) return;
			manager.user_array[index].pushMessage(message);
		}

		if(typeof(uid)=='array') {
			for(i=0; i<uid.length; i++) {
				_push(this, uid[i]);
			}
		} else {
			_push(this, uid);
		}
	},
	sendToAID : function (aid, message)
	{
		function _push(manager, _aid)
		{
			var index = manager.aid_map[_aid];
			if(index==undefined) return;
			manager.user_array[index].pushMessage(message);
		}

		if(typeof(aid)=='array') {
			for(i=0; i<aid.length; i++) {
				_push(this, aid[i]);
			}
		} else {
			_push(this, aid);
		}
	},
	sendToName : function (name, message)
	{
		function _push(manager, _name)
		{
			var index = manager.name_map[_name];
			if(index==undefined) return;
			manager.user_array[index].pushMessage(message);
		}

		if(typeof(name)=='array') {
			for(i=0; i<name.length; i++) {
				_push(this, name[i]);
			}
		} else {
			_push(this, name);
		}
	},
	sendToDomain : function (domain_id, message)
	{
		var domain = this.getDomain(domain_id);
		if(domain==undefined) return;
		domain.pushMessage(message, level);
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

exports.createManager = function ()
{
	return new BoardcastManager();
};

exports.Subscriber = BoardcastSubscriber;
