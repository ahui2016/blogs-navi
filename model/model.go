package model

type Status string

const (
	Success Status = "success"
	Fail    Status = "fail"
)

type Blog struct {
	ID          string
	Name        string
	Author      string
	Website     string // 博客或网站的网址
	Links       string // 与博客或作者有关的其他网址，用换行符分隔
	Description string
	Feed        string // 用来判断网站有无更新的网址 (比如 RSS feed)
	FeedEtag    string
	FeedDate    int64 // 上次检查时间 (时间戳)
	FeedSize    int64 // 上次的 Feed 的内容的体积
	LastUpdate  int64 // 上次更新时间 (时间戳)
	Threshold   int64 // 当本次体积与 FeedSize 之差 (绝对值) 大于该阈值时判断为有更新
	Status      Status
	ErrMsg      string // 上次失败原因 (成功时设定为空字符串)
	Category    string // 类别，自由填写任意字符串 (筛选类别时按前缀筛选)
}

type Post struct {
	ID        string
	BlogID    string
	Url       string
	Title     string
	Contents  string
	CreatedAt int64
	Hide      bool
}

type Thumb struct {
	ID        string
	BlogID    string
	CreatedAt int64
	Data      []byte
}
