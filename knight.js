
var dal_avatar = require('./dal_avatar.js');

exports.isMainModule = function ()
{
	return true;
}

exports.loginSession = function (callback)
{
	callback();
}

exports.logoutSession = function (callback)
{
	callback();
}

exports.Ping = function(session, args)
{
	session.send('{"method":"KNIGHT_S2C.Pong","message":{}}');
}

exports.Create = function(session, args)
{
	if(session.avatar_list.length>0) return;

	session.setPending(true);
	dal_avatar.create(session.uid, String(session.uid), {}, JSON.parse(args.value), function (err, avatar_id) {
		if(err) {
			session.end(err);
		} else {
			session.avatar_list.push(avatar_id);
			session.end();
		}
	});
}

exports.Delete = function(session, args)
{
	if(session.avatar_list.length==0) return;

	session.setPending(true);
	dal_avatar.delete(session.avatar_list[0], JSON.parse(args.value), function (err) {
		if(err) {
			session.end(err);
		} else {
			session.end();
		}
	});
}

exports.Set = function(session, args)
{
	if(session.avatar_list.length==0) return;

	session.setPending(true);
	dal_avatar.writeData(session.avatar_list[0], JSON.parse(args.value), function (err) {
		if(err) {
			session.end(err);
		} else {
			session.end();
		}
	});
}

exports.Get = function(session, args)
{
	if(session.avatar_list.length==0) return;

	session.setPending(true);
	dal_avatar.readData(session.avatar_list[0], String(session.uid), '', args.value, function (err, data) {
		if(err) {
			session.end(err);
		} else {
			session.send('{"method":"KNIGHT_S2C.GetCallback","message":{"aid":'+session.avatar_list[0]+',"value":'+JSON.stringify(data)+'}}');
			session.end();
		}
	});
}

exports.Boardcast = function(session, args)
{
}
