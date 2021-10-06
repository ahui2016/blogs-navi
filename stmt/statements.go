package stmt

// CreateTables 创建一些数据表。由于预估每个表的数据量都很少，因此不需要建索引。
const CreateTables = `

CREATE TABLE IF NOT EXISTS blog
(
	id            text    PRIMARY KEY COLLATE NOCASE,
	name          text    NOT NULL,
	author        text    NOT NULL,
	website       text    NOT NULL,
	links         blob    DEFAULT NULL,
	description   text    NOT NULL,
	feed          text    NOT NULL,
	feeddate      int     NOT NULL,
	feedsize      int     NOT NULL,
	lastupdate    int     NOT NULL,
	threshold     int     NOT NULL,
	status        text    NOT NULL,
	errmsg        text    NOT NULL,
	category      text    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_lastupdate ON blog(lastupdate);

CREATE TABLE IF NOT EXISTS post
(
	id            text    PRIMARY KEY COLLATE NOCASE,
	blog_id       text    REFERENCES blog(id) ON DELETE CASCADE,
	url           text    NOT NULL,
	title         text    NOT NULL,
	created_at    int     NOT NULL,
  hide          int     NOT NULL
);

CREATE TABLE IF NOT EXISTS thumb
(
	id            text    PRIMARY KEY COLLATE NOCASE,
	blog_id       text    REFERENCES blog(id) ON DELETE CASCADE,
	created_at    int     NOT NULL,
	url           text    NOT NULL
);

CREATE TABLE IF NOT EXISTS metadata
(
  name         text    NOT NULL UNIQUE,
  int_value    int     NOT NULL DEFAULT 0,
  text_value   text    NOT NULL DEFAULT "" 
);
`
const InsertIntValue = `INSERT INTO metadata (name, int_value) VALUES (?, ?);`
const GetIntValue = `SELECT int_value FROM metadata WHERE name=?;`
const UpdateIntValue = `UPDATE metadata SET int_value=? WHERE name=?;`

const InsertTextValue = `INSERT INTO metadata (name, text_value) VALUES (?, ?);`
const GetTextValue = `SELECT text_value FROM metadata WHERE name=?;`
const UpdateTextValue = `UPDATE metadata SET text_value=? WHERE name=?;`

const InsertBlog = `INSERT INTO blog (
	id, name, author, website, links, description, feed, feeddate,
	feedsize, lastupdate, threshold, status, errmsg, category
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`

const BlogsWithFeed = `SELECT
	id, name, author, website, links, description, feed, feeddate,
	feedsize, lastupdate, threshold, status, errmsg, category
	FROM blog WHERE feed<>'' ORDER BY lastupdate DESC;`

const GetBlogByID = `SELECT
  id, name, author, website, links, description, feed, feeddate,
	feedsize, lastupdate, threshold, status, errmsg, category
	FROM blog WHERE id=?;`

const UpdateBlog = `UPDATE blog SET name=?, author=?,
	website=?, links=?, description=?, feed=?, threshold=?, category=?
	WHERE id=?;`

const UpdateFeedResult = `UPDATE blog
	SET feeddate=?, feedsize=?, lastupdate=?, status=?, errmsg=?
	WHERE id=?;`
