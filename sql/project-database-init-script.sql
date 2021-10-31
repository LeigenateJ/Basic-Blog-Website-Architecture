/*
 * Upon submission, this file should contain the SQL script to initialize your database.
 * It should contain all DROP TABLE and CREATE TABLE statments, and any INSERT statements
 * required.
 */
drop table if exists hate_list;
drop table if exists like_list;
drop table if exists comments;
drop table if exists articles;
drop table if exists user;

DROP TRIGGER if EXISTS trigger_user_update;


create table user (
    user_id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_name varchar(32) NOT NULL,
    fname varchar(32) NOT NULL,
    lname varchar(32) NOT NULL,
    dob date NOT NULL,
    password_salting varchar(60) ,
    avatar_path char NOT NULL,
	admin integer,
    description varchar(100) NOT NULL
);

create table articles (
    article_id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    heading char NOT NULL,
    article_text text,
    post_time datetime NOT NULL,
    user_id integer NOT NULL,
    user_name varchar(32) NOT NULL,
    avatar_path char NOT NULL,
    img_path char,
    foreign KEY (user_id) references user(user_id)  ON DELETE CASCADE ON UPDATE CASCADE
);


create table comments (
    comment_id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    comment_text char NOT NULL,
    post_time datetime NOT NULL,
    up_num integer,
    down_num integer,
    upper_comment_id integer,
    article_id integer NOT NULL,
    user_id integer NOT NULL,
    user_name varchar(32) NOT NULL,
    avatar_path char NOT NULL,
    foreign KEY (article_id) references articles(article_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    foreign KEY (user_id) references user(user_id)  ON DELETE CASCADE ON UPDATE CASCADE,
	foreign KEY (upper_comment_id) references comments(comment_id)  ON DELETE CASCADE ON UPDATE CASCADE
);

create table like_list (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    PRIMARY KEY (user_id, comment_id),
    foreign KEY (user_id) references user(user_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    foreign KEY (comment_id) references comments(comment_id) ON DELETE CASCADE ON UPDATE CASCADE
);

create table hate_list (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    PRIMARY KEY (user_id, comment_id),
    foreign KEY (user_id) references user(user_id)  ON DELETE CASCADE ON UPDATE CASCADE,
    foreign KEY (comment_id) references comments(comment_id) ON DELETE CASCADE ON UPDATE CASCADE
);


create TRIGGER trigger_user_update AFTER UPDATE ON user 
for each row
BEGIN
update articles
SET 
user_name = new.user_name, avatar_path = new.avatar_path
WHERE user_id = old.user_id;
update comments
SET 
user_name = new.user_name, avatar_path = new.avatar_path
WHERE user_id = old.user_id;
end;


INSERT INTO user (user_id, user_name, fname, lname, dob, password_salting, avatar_path, description, admin) VALUES
    (1, 'user_01', 'Jenkin', 'Dong', '1996-07-24', 'c9796958ba658ba4de4fee4fd5c1e4263f18b206c4782fe061ef4599e3d7db4b', '../images/avatar1.jpg', 'I am Jenkin',1),
    (2, 'lin', 'Peter', 'Parker', '1993-02-14', '7b849369c487b6b034fd628ead8b9cc530aa093bd8afae9a20eb1452db7a1b4b', '../images/avatar2.jpg', 'I am Peter', null),
    (3, 'bill', 'Iris', 'Daria', '1994-10-08', '3a674ef21a81bfa6cd443155f3396fda24325ad968469ddb385393fcbf968145', '../images/avatar3.jpg', 'I am Iris', null);

INSERT INTO articles (article_id, heading, article_text, post_time, user_id, user_name, avatar_path,img_path) VALUES
    (1, 'Albert Park', '<p>Albert Park is one of Auckland’s most important parks. Its central location in the heart of the CBD, together with its long history and distinctive character, have earned it a special place in the hearts of Aucklanders and made it an important destination for visitors.

The papakainga (village) that occupied the site prior to european settlement was named Rangipuke. In 1845 the Albert Barracks were built there.

Access from Bowen Avenue, Kitchener Street, Princes Street and Wellesley Street East. You will need to park on the road.

Seating, toilets, drinking fountains, seating, statues and artworks are inside the park.</p>', '2021-10-11 13:54:28', 1, 'user_01', '../images/avatar1.jpg','../images/albert-park.jpg'),
    (2, 'Sky City', '<p>The iconic Sky Tower has stood tall at 328 metres, owning Auckland’s skyline for over 20 years. It’s an exciting hub of adrenaline activities, sky-high events, superb dining and breath-taking views.</p>', '2021-10-10 11:47:03', 2, 'lin', '../images/avatar2.jpg','../images/skycity.jpg'),
    (3, 'Mt Eden', '<p>Walk to the top of Mount Eden, also known as Maungawhau, one of our 48 volcanic cones and the highest natural point in Auckland. Discover the volcano’s history as a traditional fortified Māori village – join a guided tour and see the occupation terraces, storage pits and housing sites that give a glimpse into former Māori settlement.</p>', '2021-10-11 05:15:47', 3, 'bill', '../images/avatar3.jpg','../images/mteden.jpg');

INSERT INTO comments (comment_id, comment_text, post_time, up_num, down_num, article_id, upper_comment_id, user_id, user_name, avatar_path) VALUES
    (1, 'This is comment_01', '2020-01-11 22:54:11', 1, 0, 2, null, 1, 'user_01', '../images/avatar1.jpg'),
    (2, 'This is comment_02', '2019-01-11 22:54:11', 1, 0, 2, 1, 2, 'lin', '../images/avatar2.jpg'),
    (3, 'This is comment_03', '2015-01-11 22:54:11', 1, 0, 1, null, 3, 'bill', '../images/avatar3.jpg'),
	(4, 'This is comment_04', '2015-09-11 22:54:11', 0, 1, 2, 2, 3, 'bill', '../images/avatar3.jpg'),
	(5, 'This is comment_05', '2016-05-05 02:14:31', 2, 0, 1, 3, 1, 'user_01', '../images/avatar1.jpg'),
	(6, 'This is comment_06', '2015-09-11 22:54:11', 0, 3, 2, 2, 1, 'user_01', '../images/avatar1.jpg'),
	(7, 'This is comment_07', '2015-09-11 22:54:11', 0, 0, 2, 1, 3, 'bill', '../images/avatar3.jpg');

INSERT INTO like_list (user_id, comment_id) VALUES
    ( 1, 1),
    ( 2, 2),
    ( 3, 3),
    ( 1, 5),
    ( 2, 5);

INSERT INTO hate_list (user_id, comment_id) VALUES
    ( 2, 4),
    ( 1, 6),
    ( 2, 6),
    ( 3, 6);