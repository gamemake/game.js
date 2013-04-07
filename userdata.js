
var mysql = require('mysql');
var config = require('./config.js');
var pool   = mysql.createPool(config.get('userdata.mysql'));

module.exports.create = function (aid, data, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			callback(undefined);
			return;
		}
		connection.query('INSERT INTO avatar_table(aid, body) VALUES(?, ?)', [aid, data], function(err, rows) {
			connection.end();
			callback(err);
		});
	});
}

module.exports.delete = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			callback(err);
			return;
		}
		connection.query('DELETE FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			callback(err);
		});
	});
}

module.exports.read = function (aid, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			callback(err);
			return;
		}
		connection.query('SELECT avatar_data FROM avatar_table WHERE avatar_id=?', aid, function(err, rows) {
			connection.end();
			if(rows.length>0) {
				callback(true, rows[0].avatar_data);
			} else {
				callback(undefined); // not found
			}
		});
	});
}

module.exports.write = function (aid, data, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			callback(err);
			return;
		}
		connection.query('UPDATE avatar_table SET avatar_data=? WHERE avatar_id=?', [data, aid], function(err) {
			connection.end();
			callback(err);
		});
	});
}
