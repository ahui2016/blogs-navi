package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

const pwdMaxTry = 2

var ipTryCount = make(map[string]int)

func checkIPTryCount(ip string) error {
	if *demo {
		return nil // 演示版允许无限重试密码
	}
	if ipTryCount[ip] >= pwdMaxTry {
		return fmt.Errorf("no more try, input wrong password too many times")
	}
	return nil
}

func checkPassword(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		ip := c.RealIP()
		if err := checkIPTryCount(ip); err != nil {
			return err
		}
		pwd := c.FormValue("pwd")
		if pwd != password {
			ipTryCount[ip]++
			return c.JSON(http.StatusUnauthorized, Text{"wrong password"})
		}
		ipTryCount[ip] = 0
		return next(c)
	}
}
