
CREATE TABLE avatar_table (
  avatar_id int(11) NOT NULL,
  avatar_name varchar(100) NOT NULL,
  avatar_data blob,
  PRIMARY KEY (avatar_id),
  UNIQUE KEY avatar_name_index (avatar_name)
) ENGINE=MyISAM DEFAULT CHARSET=latin1$$

CREATE TABLE user_table (
  user_id int(11) NOT NULL,
  user_name varchar(200) NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY user_name_index (user_name)
) ENGINE=MyISAM DEFAULT CHARSET=latin1$$
