package database

import (
	"database/sql"
	"fmt"
	"strings"

	"ahui2016.github.com/blogs-navi/model"
	"ahui2016.github.com/blogs-navi/stmt"
	"ahui2016.github.com/blogs-navi/util"
	_ "github.com/mattn/go-sqlite3"
)

type (
	Blog = model.Blog
)

type DB struct {
	Path string
	DB   *sql.DB
}

func (db *DB) mustBegin() *sql.Tx {
	tx, err := db.DB.Begin()
	util.Panic(err)
	return tx
}

func (db *DB) Exec(query string, args ...interface{}) (err error) {
	_, err = db.DB.Exec(query, args...)
	return
}

func (db *DB) Open(dbPath string) (err error) {
	if db.DB, err = sql.Open("sqlite3", dbPath+"?_fk=1"); err != nil {
		return
	}
	db.Path = dbPath
	if err = db.Exec(stmt.CreateTables); err != nil {
		return
	}
	return initFirstID(blog_id_key, blog_id_prefix, db.DB)
}

func (db *DB) InsertBlog(blog *Blog) (err error) {
	tx := db.mustBegin()
	defer tx.Rollback()

	if blog.ID, err = getNextID(tx, blog_id_key); err != nil {
		return
	}
	if err = insertBlog(tx, blog); err != nil {
		return
	}
	return tx.Commit()
}

func (db *DB) UpdateBlog(blog *Blog) error {
	return updateBlog(db.DB, blog)
}

func (db *DB) GetBlogByID(id string) (blog Blog, err error) {
	row := db.DB.QueryRow(stmt.GetBlogByID, id)
	blog, err = scanBlog(row)
	if err == sql.ErrNoRows {
		err = fmt.Errorf("not found blog(id:%s)", id)
	}
	return
}

func (db *DB) GetBlogs(category string) (blogs []*Blog, err error) {
	var query string
	if category == "with-feed" {
		query = stmt.BlogsWithFeed
	}
	rows, err := db.DB.Query(query)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		blog, err := scanBlog(rows)
		if err != nil {
			return nil, err
		}
		blogs = append(blogs, &blog)
	}
	return blogs, rows.Err()
}

func (db *DB) UpdateFeedResult(feedsize int64, errMsg, id string) error {
	blog, err := db.GetBlogByID(id)
	if err != nil {
		return err
	}

	// 不管是否出错，都已经执行了一次检查。
	blog.FeedDate = util.TimeNow()
	blog.ErrMsg = strings.TrimSpace(errMsg)

	// 如果数据量太少，很可能是错误
	if feedsize < 128 {
		blog.ErrMsg = "FeedSize is too small"
	}

	// 出错时
	if blog.ErrMsg != "" {
		blog.Status = model.Fail
		return updateFeedResult(db.DB, blog)
	}

	// 成功时
	blog.Status = model.Success
	if util.Abs(feedsize-blog.FeedSize) > blog.Threshold {
		blog.FeedSize = feedsize
		blog.LastUpdate = blog.FeedDate
	}
	return updateFeedResult(db.DB, blog)
}
