
var mysql = require('mysql');
var config = require('./config.js');
var pool   = mysql.createPool(config.get('dal_avatar.mysql'));

exports.create = function (uid, name, summary, data, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('INSERT INTO avatar_table(user_id, name, summary, data) VALUES(?, ?, ?, ?)', [uid, name, summary, data], function(err, result) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				callback(false, result.insertId);
			}
		});
	});
}

exports.delete = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('DELETE FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(err) {
				callback('UNKNOWN');
			} else {
				callback(false);
			}
		});
	});
}

exports.getAvatarList = function (uid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('SELECT avatar_id FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				var aids = [];
				for(i=0; i<rows.length; i++) {
					aids.push(rows[i].avatar_id);
				}
				callback(false, aids);
			}
		});
	});
}

exports.read = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('SELECT summary, data FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				if(rows.length==0) {
					callback(false, null, null);
				} else {
					callback(false, JSON.parse(rows[0].summary), JSON.parse(rows[0].data));
				}
			}
		});
	});
}

exports.readData = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('SELECT data FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				if(rows.length==0) {
					callback(false, null);
				} else {
					callback(false, JSON.parse(data));
				}
			}
		});
	});
}

exports.readSummary = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('SELECT summary FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				if(rows.length==0) {
					callback(false, null);
				} else {
					callback(false, JSON.parse(rows[0].summary));
				}
			}
		});
	});
}

exports.write = function (aid, summary, data, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('UPDATE avatar_table SET summary=?, data=? WHERE avatar_id=?', [JSON.stringify(summary), JSON.stringify(data), aid], function(err) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				callback(false);
			}
		});
	});
}

exports.writeData = function (aid, data, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('UPDATE avatar_table SET data=? WHERE avatar_id=?', [JSON.stringify(data), aid], function(err) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				callback(false);
			}
		});
	});
}

exports.writeSummary = function (aid, summary, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('UNKNOWN');
			return;
		}
		connection.query('UPDATE avatar_table SET summary=? WHERE avatar_id=?', [JSON.stringify(summary), aid], function(err) {
			connection.end();
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('UNKNOWN');
			} else {
				callback(false);
			}
		});
	});
}
