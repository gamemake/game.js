
var mysql = require('mysql');
var config = require('./config.js');
var pool = mysql.createPool(config.get('dal_user.mysql'));
var log = require('./log.js');

module.exports.authToken = function (token, callback)
{
	pool.getConnection(function(err, connection) {
		if(err) {
			log.error('MYSQL ERROR ' + String(err));
			callback('SYSTEM_ERROR');
			return;
		}
		connection.query('SELECT user_id FROM user_table WHERE user_name=?', token, function(err, rows) {
			if(err) {
				log.error('MYSQL ERROR ' + String(err));
				callback('SYSTEM_ERROR');
				return;
			}
			if(rows.length>0) {
				connection.end();
				callback(false, rows[0].user_id);
				return;
			}
			connection.query('INSERT INTO user_table(user_name) values(?)', token, function(err, result) {
				connection.end();
				if(err) {
					log.error('MYSQL ERROR ' + String(err));
					callback('SYSTEM_ERROR');
					return;
				}
				callback(false, result.insertId);
			});
		});
	});
}
