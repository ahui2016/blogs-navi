package main

import "github.com/labstack/echo/v4"

func main() {
	defer db.DB.Close()

	e := echo.New()
	e.IPExtractor = echo.ExtractIPFromXFFHeader()
	e.HTTPErrorHandler = errorHandler

	e.Static("/public", "public")
	e.File("/", "public/index.html")

	api := e.Group("/api", sleep)
	api.POST("/get-blog", getBlogByID)

	// admin := e.Group("/admin", checkPassword)
	admin := e.Group("/admin", sleep)
	admin.POST("/add-blog", addBlogHandler)
	admin.POST("/update-blog", updateBlogHandler)

	e.Logger.Fatal(e.Start(*addr))
}
