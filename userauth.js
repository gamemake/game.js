
var mysql = require('mysql');
var config = require('./config.js');
var pool   = mysql.createPool(config.get('userauth.mysql'));

module.exports.authToken = function (token, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			callback(undefined);
			return;
		}
		connection.query('SELECT user_id FROM user_table WHERE user_name=?', token, function(err, rows) {
			if(err) {
				callback(undefined);
				return;
			}
			if(rows.length>0) {
				connection.end();
				callback(rows[0].user_id);
				return;
			}
			connection.query('INSERT INTO user_table(user_name) values(?)', token, function(err, result) {
				connection.end();
				if(err) {
					callback(undefined);
					return;
				}
				callback(result.insertId)
			});
		});
	});
}
