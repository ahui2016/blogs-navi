package main

import "github.com/labstack/echo/v4"

func main() {
	defer db.DB.Close()

	e := echo.New()
	e.IPExtractor = echo.ExtractIPFromXFFHeader()
	e.HTTPErrorHandler = errorHandler

	e.Static("/public", "public")
	e.File("/home", "public/index.html")
	e.File("/", "public/index.html")

	api := e.Group("/api")
	api.POST("/get-blog", getBlogByID)
	api.POST("/get-blogs", getBlogs)
	api.POST("/get-random-blogs", getRandomBlogs)
	api.POST("/count-search", countSearchResult)
	api.GET("/get-cats", getCats)
	api.POST("/get-post", getPostByID)

	// admin := e.Group("/admin", checkPassword)
	admin := e.Group("/admin", checkPassword)
	admin.POST("/check-only", func(c echo.Context) error { return c.NoContent(OK) })
	admin.POST("/add-blog", addBlogHandler)
	admin.POST("/update-blog", updateBlogHandler)
	admin.POST("/update-feed", updateFeedHandler)
	admin.POST("/delete-blog", deleteBlogHandler)
	admin.POST("/download-db", downloadDB)
	admin.POST("/add-post", addPostHandler)
	admin.POST("/update-post", updatePostHandler)

	e.Logger.Fatal(e.Start(*addr))
}
