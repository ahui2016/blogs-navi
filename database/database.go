package database

import (
	"database/sql"

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
	if err = insertBlog(db.DB, blog); err != nil {
		return
	}
	return tx.Commit()
}
