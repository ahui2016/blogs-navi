package main

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"ahui2016.github.com/blogs-navi/util"
	"github.com/labstack/echo/v4"
)

// Text 用于向前端返回一个简单的文本消息。
// 为了保持一致性，总是向前端返回 JSON, 因此即使是简单的文本消息也使用 JSON.
type Text struct {
	Message string `json:"message"`
}

func sleep(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		time.Sleep(time.Second)
		return next(c)
	}
}

func errorHandler(err error, c echo.Context) {
	if e, ok := err.(*echo.HTTPError); ok {
		c.JSON(e.Code, e.Message)
	}
	util.Panic(c.JSON(500, Text{err.Error()}))
}

func addBlogHandler(c echo.Context) error {
	blog, err := getBlogValue(c)
	if err != nil {
		return err
	}
	if err := db.InsertBlog(blog); err != nil {
		return err
	}
	return c.JSON(OK, Text{blog.ID})
}

func updateBlogHandler(c echo.Context) error {
	blog, err := getBlogValue(c)
	if err != nil {
		return err
	}
	blog.ID = strings.TrimSpace(blog.ID)
	if blog.ID == "" {
		return fmt.Errorf("id is empty, need an id")
	}
	if _, err = db.GetBlogByID(blog.ID); err == sql.ErrNoRows {
		return c.JSON(404, Text{fmt.Sprintf("not found blog(id:%s)", blog.ID)})
	} else if err != nil {
		return err
	}
	return db.UpdateBlog(blog)
}

func getBlogByID(c echo.Context) error {
	id := c.FormValue("id")
	blog, err := db.GetBlogByID(id)
	if err == sql.ErrNoRows {
		return c.JSON(404, Text{fmt.Sprintf("not found blog(id:%s)", id)})
	} else if err != nil {
		return err
	}
	return c.JSON(OK, blog)
}

// getFormValue gets the c.FormValue(key), trims its spaces,
// and checks if it is empty or not.
func getFormValue(c echo.Context, key string) (string, error) {
	value := strings.TrimSpace(c.FormValue(key))
	if value == "" {
		return "", fmt.Errorf("form value [%s] is empty", key)
	}
	return value, nil
}

func getBlogValue(c echo.Context) (blog *Blog, err error) {
	name, e1 := getFormValue(c, "name")
	website, e2 := getFormValue(c, "website")
	feed, e3 := getFormValue(c, "feed")
	thold, e4 := getNumber(c, "thold")
	if err := util.WrapErrors(e1, e2, e3, e4); err != nil {
		return nil, err
	}
	return &Blog{
		ID:          c.FormValue("id"),
		Name:        name,
		Author:      c.FormValue("author"),
		Website:     website,
		Links:       c.FormValue("links"),
		Description: c.FormValue("desc"),
		Feed:        feed,
		Threshold:   thold,
	}, nil
}

func getNumber(c echo.Context, key string) (int64, error) {
	s := c.FormValue(key)
	if s == "" {
		return 0, nil
	}
	return strconv.ParseInt(s, 10, 0)
}
