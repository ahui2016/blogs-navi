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

func (db *DB) DeleteIsland(id string) error {
	return db.Exec(stmt.DeleteBlog, id)
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

func (db *DB) CountSearchResult(pattern string) (int64, error) {
	p := "%" + pattern + "%"
	return getInt1(db.DB, stmt.CountSearchResult, p, p, p)
}

func (db *DB) CountAllBlogs() (int64, error) {
	return getInt1(db.DB, stmt.CountAllBlogs)
}

func (db *DB) GetBlogs(category, pattern string) (blogs []*Blog, err error) {
	var rows *sql.Rows
	if category+pattern == "" {
		return nil, fmt.Errorf("nothing to search")
	}

	if category == "" {
		p := "%" + pattern + "%"
		rows, err = db.DB.Query(stmt.SearchBlogs, p, p, p)
	} else if category == "with-feed" {
		rows, err = db.DB.Query(stmt.BlogsWithFeed)
	} else {
		rows, err = db.DB.Query(stmt.GetBlogsByCat, "%"+category+"%")
	}
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

func (db *DB) GetRandomBlogs(limit int) (blogs []Blog, err error) {
	ids, err := getRandomBlogIDs(db.DB, limit)
	if err != nil {
		return nil, err
	}
	for _, id := range ids {
		blog, err := db.GetBlogByID(id)
		if err != nil {
			return nil, err
		}
		blogs = append(blogs, blog)
	}
	return
}

func (db *DB) GetCategories() ([]string, error) {
	return getStrArr(db.DB, stmt.GetCategories)
}

// UpdateFeedResult 根据参数来决定是否更新 Blog.LastUpdate,
// 按照 lastupdate, etag, feedsize 的顺序来判断是否需要更新 LastUpdate.
func (db *DB) UpdateFeedResult(lastupdate, feedsize int64, etag, errMsg, id string) error {
	blog, err := db.GetBlogByID(id)
	if err != nil {
		return err
	}

	// 不管是否出错，都已经执行了一次检查。
	blog.FeedDate = util.TimeNow()
	blog.ErrMsg = strings.TrimSpace(errMsg)

	// 出错时
	if blog.ErrMsg != "" {
		blog.Status = model.Fail
		return updateFeedResult(db.DB, blog)
	}

	// 成功时
	blog.Status = model.Success

	// 设置 LastUpdate 时，优先以 lastupdate (即 last-modified) 为准。
	isLastUpdateSet := false
	if lastupdate > blog.LastUpdate {
		blog.LastUpdate = lastupdate
		isLastUpdateSet = true
	}

	// 如果 etag 有更新，则根据 isLastUpdateSet 来决定是否更新 LastUpdate
	if etag != "" && etag != blog.FeedEtag {
		blog.FeedEtag = etag
		if !isLastUpdateSet {
			blog.LastUpdate = blog.FeedDate
			isLastUpdateSet = true
		}
	}

	// 最后更新 FeedSize 并根据 isLastUpdateSet 和 diff 来决定是否更新 LastUpdate
	diff := util.Abs(feedsize - blog.FeedSize)
	if feedsize > 0 {
		blog.FeedSize = feedsize
		if !isLastUpdateSet && diff > blog.Threshold {
			blog.LastUpdate = blog.FeedDate
		}
	}
	return updateFeedResult(db.DB, blog)
}
