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
	Post = model.Post
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
	e1 := initFirstID(blog_id_key, blog_id_prefix, db.DB)
	e2 := initFirstID(post_id_key, post_id_prefix, db.DB)
	return util.WrapErrors(e1, e2)
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

func (db *DB) InsertPost(post *Post) (err error) {
	tx := db.mustBegin()
	defer tx.Rollback()

	if post.ID, err = getNextID(tx, post_id_key); err != nil {
		return
	}
	if err = insertPost(tx, post); err != nil {
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

func (db *DB) UpdatePost(post *Post) error {
	return updatePost(db.DB, post)
}

func (db *DB) GetBlogByID(id string) (blog Blog, err error) {
	row := db.DB.QueryRow(stmt.GetBlogByID, id)
	blog, err = scanBlog(row)
	if err == sql.ErrNoRows {
		err = fmt.Errorf("not found blog(id:%s)", id)
	}
	return
}

func (db *DB) GetPostByID(id string) (post Post, err error) {
	row := db.DB.QueryRow(stmt.GetPostByID, id)
	post, err = scanPost(row)
	if err == sql.ErrNoRows {
		err = fmt.Errorf("not found post(id:%s)", id)
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
	if category+pattern == "" {
		return nil, fmt.Errorf("nothing to search")
	}

	var rows *sql.Rows

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
	err = rows.Err()
	return
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

// UpdateFeedResult ????????????????????????????????? Blog.LastUpdate,
// ?????? lastupdate, etag, feedsize ???????????????????????????????????? LastUpdate.
func (db *DB) UpdateFeedResult(lastupdate, feedsize int64, etag, errMsg, id string) error {
	blog, err := db.GetBlogByID(id)
	if err != nil {
		return err
	}

	// ??????????????????????????????????????????????????????
	blog.FeedDate = util.TimeNow()
	blog.ErrMsg = strings.TrimSpace(errMsg)

	// ?????????
	if blog.ErrMsg != "" {
		blog.Status = model.Fail
		return updateFeedResult(db.DB, blog)
	}

	// ?????????
	blog.Status = model.Success

	// ?????? LastUpdate ??????????????? lastupdate (??? last-modified) ?????????
	isLastUpdateSet := false
	if lastupdate > blog.LastUpdate {
		blog.LastUpdate = lastupdate
		isLastUpdateSet = true
	}

	// ?????? etag ????????????????????? isLastUpdateSet ????????????????????? LastUpdate
	if etag != "" && etag != blog.FeedEtag {
		blog.FeedEtag = etag
		if !isLastUpdateSet {
			blog.LastUpdate = blog.FeedDate
			isLastUpdateSet = true
		}
	}

	// ???????????? FeedSize ????????? isLastUpdateSet ??? diff ????????????????????? LastUpdate
	diff := util.Abs(feedsize - blog.FeedSize)
	if feedsize > 0 {
		blog.FeedSize = feedsize
		if !isLastUpdateSet && diff > blog.Threshold {
			blog.LastUpdate = blog.FeedDate
		}
	}
	return updateFeedResult(db.DB, blog)
}
