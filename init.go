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
	pwdFileName  = "pwd.txt"
	defaultTHold = 0
)

var (
	password string
	db       = new(database.DB)
	addr     = flag.String("addr", "127.0.0.1:80", "local IP address")
	demo     = flag.Bool("demo", false, "set this flag for demo")
)

func init() {
	flag.Parse()
	util.Panic(db.Open(dbFileName))
	util.Panic(initPassword())
}

func initPassword() error {
	pwd, err := util.ReadFileFirstLine(pwdFileName)
	if err != nil {
		return err
	}
	password = string(pwd)
	return nil
}
