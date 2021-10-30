package main

import (
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
	if _, err = db.GetBlogByID(blog.ID); err != nil {
		return err
	}
	return db.UpdateBlog(blog)
}

func deleteBlogHandler(c echo.Context) error {
	id := c.FormValue("id")
	if _, err := db.GetBlogByID(id); err != nil {
		return err
	}
	return db.DeleteIsland(id)
}

func getBlogByID(c echo.Context) error {
	id := c.FormValue("id")
	blog, err := db.GetBlogByID(id)
	if err != nil {
		return err
	}
	return c.JSON(OK, blog)
}

func countSearchResult(c echo.Context) error {
	pattern, err := getFormValue(c, "pattern")
	if err != nil {
		return err
	}
	n, err := db.CountSearchResult(pattern)
	if err != nil {
		return err
	}
	return c.JSON(OK, Text{strconv.FormatInt(n, 10)})
}

func getBlogs(c echo.Context) error {
	cat, _ := getFormValue(c, "category")
	pattern, _ := getFormValue(c, "pattern")
	blogs, err := db.GetBlogs(cat, pattern)
	if err != nil {
		return err
	}
	return c.JSON(OK, blogs)
}

func getRandomBlogs(c echo.Context) error {
	n, err := getNumber(c, "random")
	if err != nil {
		return err
	}
	blogs, err := db.GetRandomBlogs(int(n))
	if err != nil {
		return err
	}
	return c.JSON(OK, blogs)
}

func getCats(c echo.Context) error {
	cats, err := db.GetCategories()
	if err != nil {
		return err
	}
	return c.JSON(OK, cats)
}

func updateFeedHandler(c echo.Context) error {
	feedsize, err := getNumber(c, "feedsize")
	if err != nil {
		return err
	}
	lastupdate, _ := getNumber(c, "lastupdate")
	etag := c.FormValue("etag")
	errMsg := c.FormValue("errmsg")
	id := c.FormValue("id")
	return db.UpdateFeedResult(lastupdate, feedsize, etag, errMsg, id)
}

func downloadDB(c echo.Context) error {
	return c.File(dbFileName)
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
	thold, e4 := getNumber(c, "thold")
	if err := util.WrapErrors(e1, e2, e4); err != nil {
		return nil, err
	}

	feed, _ := getFormValue(c, "feed")
	category, _ := getFormValue(c, "category")
	if feed+category == "" {
		return nil, fmt.Errorf("当不填写 feed 时就必须填写 category")
	}
	if category == "with-feed" {
		return nil, fmt.Errorf("with-feed 是系统保留类别")
	}

	author := c.FormValue("author")
	links := c.FormValue("links")
	desc := c.FormValue("desc")

	if *demo {
		if len(name+author) > nameAndAuthorLimit {
			return nil, fmt.Errorf("name+author is too long (bigger than %d)", nameAndAuthorLimit)
		}
		if len(website) > linkLengthLimit {
			return nil, fmt.Errorf("website is too long (bigger than %d)", linkLengthLimit)
		}
		if len(feed) > linkLengthLimit {
			return nil, fmt.Errorf("the feed is too long (bigger than %d)", linkLengthLimit)
		}
		if len(links) > linksLimit {
			return nil, fmt.Errorf("links is too long (bigger than %d)", linksLimit)
		}
		if len(category) > catLengthLimit {
			return nil, fmt.Errorf("category is too long (bigger than %d)", catLengthLimit)
		}
		if len(desc) > descLengthLimit {
			return nil, fmt.Errorf("description is too long (bigger than %d)", descLengthLimit)
		}
	}

	// 由于用户只有管理员一个人，因此有些输入可以信任前端（不检查空值）。
	return &Blog{
		ID:          c.FormValue("id"),
		Name:        name,
		Author:      author,
		Website:     website,
		Links:       links,
		Description: desc,
		Feed:        feed,
		Threshold:   thold,
		Category:    category,
	}, nil
}

func getNumber(c echo.Context, key string) (int64, error) {
	s := c.FormValue(key)
	if s == "" {
		return 0, nil
	}
	return strconv.ParseInt(s, 10, 0)
}
