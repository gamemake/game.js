
var boardcast = require('./boardcast.js');
var dal_avatar = require('./dal_avatar.js');

var boardcast_manager = boardcast.createManager({});

var UserSession = boardcast.Subscriber.extend({
	init : function (token, callback)
	{
		this._super(boardcast_manager);
	},
	login : function (uid)
	{
		var old_session = boardcast_manager.getSubscriberByUID(uid);
		if(old_session) {
			old_session.logout();
		}
		return this._super(uid);
	},
	logout : function ()
	{
		this._super();
	}
});

module.exports = UserSession;
