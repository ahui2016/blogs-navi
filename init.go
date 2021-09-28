package main

import (
	"flag"

	"ahui2016.github.com/blogs-navi/database"
	"ahui2016.github.com/blogs-navi/util"
)

const (
	dbFileName = "db-blogs-navi.sqlite"
)

var (
	db   = new(database.DB)
	addr = flag.String("addr", "127.0.0.1:80", "local IP address")
)

func init() {
	flag.Parse()
	util.Panic(db.Open(dbFileName))
}
