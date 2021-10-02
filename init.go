package main

import (
	"flag"
	"net/http"

	"ahui2016.github.com/blogs-navi/database"
	"ahui2016.github.com/blogs-navi/model"
	"ahui2016.github.com/blogs-navi/util"
)

type (
	Blog = model.Blog
)

const (
	OK           = http.StatusOK
	dbFileName   = "db-blogs-navi.sqlite"
	defaultTHold = 0
)

var (
	db   = new(database.DB)
	addr = flag.String("addr", "127.0.0.1:80", "local IP address")
)

func init() {
	flag.Parse()
	util.Panic(db.Open(dbFileName))
}
