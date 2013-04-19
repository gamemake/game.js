
var seq = 1980;
var room_list = {};

function Room (room_index)
{
	this.room_index = room_index;
	this.room_seq = seq++;
	this.members = [];
	this.members.length = 100;
}

Room.prototype.join = function (session)
{
	var index;
	for(index=this.members.length-1; index>=0; index--) {
		if(this.members[index]==undefined) {
			this.members[index] = session;
			session.room_index = this.room_index;
			break;
		}
	}
	if(index>=0) {
		session.send('{"method":"KNIGHT_S2C.JoinCallback","message":{"result":1}}');
	} else {
		this.check();
	}
}

Room.prototype.leave = function (session)
{
	var index;
	for(index=this.members.length-1; index>=0; index--) {
		if(this.members[index]!=undefined) {
			this.members[index] = session;
			session.room_index = this.room_index;
			break;
		}
	}
	if(index>=0) {
		session.send('{"method":"KNIGHT_S2C.JoinCallback","message":{"result":1}}');
	} else {
		this.check();
	}
}

Room.prototype.chat = function (session, msg)
{
	var index;
	for(index=this.members.length-1; index>=0; index--) {
		if(this.members[index]!=undefined) {
			this.members[index].send(msg);
		}
	}
}

Room.prototype.check = function ()
{
	var index;
	for(index=this.members.length-1; index>=0; index--) {
		if(this.members[index]!=undefined) {
			break;
		}
	}
	delete room_list[this.room_index];
}

exports.join = function (session, room_index)
{
	if(session.room_index!=undefined) {
		session.send('{"method":"KNIGHT_S2C.JoinCallback","message":{"result":0}}');
		return;
	}

	var room = room_list[room_index];
	if(room==undefined) {
		room = new Room(room_index);
		room_list[room_index] = room;
	}

	room.join(session);
}

exports.leave = function (session)
{
	if(session.room_index==undefined) {
		session.send('{"method":"KNIGHT_S2C.RoomLeaveCallback","message":{}}');
		return;
	}

	var room = room_list[session.room_index];
	room.leave(session);
}

exports.chat = function (session, msg)
{
	if(session.room_index==undefined) {
		session.send('{"method":"KNIGHT_S2C.RoomLeaveCallback","message":{}}');
		return;
	}

	var room = room_list[session.room_index];
	room.chat(session, msg);
}
