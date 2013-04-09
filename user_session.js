
var boardcast = require('./boardcast.js');
var dal_avatar = require('./dal_avatar.js');

var boardcast_manager = boardcast.createManager({});

var UserSession = boardcast.Subscriber.extend({
	init : function ()
	{
		this._super(boardcast_manager);
		this.pending = false;
	},
	/*
	login : function (uid) { return this._super(uid); },
	logout : function () { this._super(); },
	begin : function () { },
	end : function() { },
	*/
	setPending : function (flag)
	{
		if(flag) {
			this.pending = true;
		} else {
			this.pending = false;
		}
	},
	isPending : function ()
	{
		return this.pending;
	}
});

module.exports.UserSession = UserSession;

module.exports.getSession = function (uid)
{
	return boardcast_manager.getSubscriberByUID(uid);
}
