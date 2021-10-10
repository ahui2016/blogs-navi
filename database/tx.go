package database

import (
	"database/sql"

	"ahui2016.github.com/blogs-navi/stmt"
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
