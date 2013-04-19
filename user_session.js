
var config = require('./config.js');
var log = require('./log.js');
var boardcast = require('./boardcast.js');
var cluster = require('./cluster.js');

var boardcast_manager = boardcast.createManager({});
var enableCluster = config.get('global.enable_cluster');

exports.UserSession = boardcast.Subscriber.extend({
	init : function ()
	{
		this.worker = null;
		this._super(boardcast_manager);
	},
	login : function (uid)
	{
		if(enableCluster) {
			this.worker = cluster.allocWorker();
			cluster.incWorkload(this.worker);
		}
		return this._super(uid);
	},
	logout : function ()
	{
		if(this.worker!=null) {
			cluster.decWorkload(this.worker);
			this.worker = null;
		}
		this._super();
	},
});

exports.getSession = function (uid)
{
	return boardcast_manager.getSubscriberByUID(uid);
}
