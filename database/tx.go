package database

import (
	"database/sql"

	"ahui2016.github.com/blogs-navi/stmt"
	"ahui2016.github.com/blogs-navi/util"
)

type TX interface {
	Exec(string, ...interface{}) (sql.Result, error)
	Query(string, ...interface{}) (*sql.Rows, error)
	QueryRow(string, ...interface{}) *sql.Row
}

// getText1 gets one text value from the database.
func getText1(tx TX, query string, args ...interface{}) (text string, err error) {
	row := tx.QueryRow(query, args...)
	err = row.Scan(&text)
	return
}

// getInt1 gets one number value from the database.
func getInt1(tx TX, query string, arg ...interface{}) (n int64, err error) {
	row := tx.QueryRow(query, arg...)
	err = row.Scan(&n)
	return
}

type Row interface {
	Scan(...interface{}) error
}

func insertBlog(tx TX, blog *Blog) error {
	_, err := tx.Exec(
		stmt.InsertBlog,
		blog.ID,
		blog.Name,
		blog.Author,
		blog.Website,
		blog.Links,
		blog.Description,
		blog.Feed,
		blog.FeedEtag,
		blog.FeedDate,
		blog.FeedSize,
		blog.LastUpdate,
		blog.Threshold,
		blog.Status,
		blog.ErrMsg,
		blog.Category,
	)
	return err
}

func insertPost(tx TX, post *Post) error {
	_, err := tx.Exec(
		stmt.InsertPost,
		post.ID,
		post.BlogID,
		post.Url,
		post.Title,
		post.Contents,
		post.CreatedAt,
		post.Hide,
	)
	return err
}

func updateBlog(tx TX, blog *Blog) error {
	_, err := tx.Exec(
		stmt.UpdateBlog,
		blog.Name,
		blog.Author,
		blog.Website,
		blog.Links,
		blog.Description,
		blog.Feed,
		blog.Threshold,
		blog.Category,
		blog.ID,
	)
	return err
}

func updatePost(tx TX, post *Post) error {
	_, err := tx.Exec(
		stmt.UpdatePost,
		post.Url,
		post.Title,
		post.Contents,
		post.CreatedAt,
		post.Hide,
		post.ID,
	)
	return err
}

func scanBlog(row Row) (blog Blog, err error) {
	err = row.Scan(
		&blog.ID,
		&blog.Name,
		&blog.Author,
		&blog.Website,
		&blog.Links,
		&blog.Description,
		&blog.Feed,
		&blog.FeedEtag,
		&blog.FeedDate,
		&blog.FeedSize,
		&blog.LastUpdate,
		&blog.Threshold,
		&blog.Status,
		&blog.ErrMsg,
		&blog.Category,
	)
	return
}

func scanPost(row Row) (post Post, err error) {
	err = row.Scan(
		&post.ID,
		&post.BlogID,
		&post.Url,
		&post.Title,
		&post.Contents,
		&post.CreatedAt,
		&post.Hide,
	)
	return
}

func updateFeedResult(tx TX, blog Blog) error {
	_, err := tx.Exec(
		stmt.UpdateFeedResult,
		blog.FeedEtag,
		blog.FeedDate,
		blog.FeedSize,
		blog.LastUpdate,
		blog.Status,
		blog.ErrMsg,
		blog.ID,
	)
	return err
}

func getStrArr(tx TX, query string) (arr []string, err error) {
	rows, err := tx.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		arr = append(arr, s)
	}
	return arr, rows.Err()
}

func getRandomBlogIDs(tx TX, limit int) ([]string, error) {
	ids, err := getStrArr(tx, stmt.GetAllBlogIDs)
	if err != nil {
		return nil, err
	}
	return util.ShuffleStrArr(ids, limit), nil
}
