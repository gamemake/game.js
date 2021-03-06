
CREATE TABLE user_table (
	user_id int(11) NOT NULL AUTO_INCREMENT,
	user_name varchar(200) NOT NULL,
	PRIMARY KEY (user_id),
	UNIQUE KEY user_name_index (user_name)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE avatar_table (
	avatar_id int(11) NOT NULL AUTO_INCREMENT,
	user_id int(11) NOT NULL,
	name varchar(100) NOT NULL,
	summary text,
	data MEDIUMTEXT,
	PRIMARY KEY (avatar_id),
	UNIQUE KEY avatar_name_index (name),
	KEY avatar_userid_index (user_id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
