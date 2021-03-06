package util

import (
	"encoding/base64"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
)

// WrapErrors 把多个错误合并为一个错误.
func WrapErrors(allErrors ...error) (wrapped error) {
	for _, err := range allErrors {
		if err != nil {
			if wrapped == nil {
				wrapped = err
			} else {
				wrapped = fmt.Errorf("%v | %v", err, wrapped)
			}
		}
	}
	return
}

// ErrorContains returns NoCaseContains(err.Error(), substr)
// Returns false if err is nil.
func ErrorContains(err error, substr string) bool {
	if err == nil {
		return false
	}
	return noCaseContains(err.Error(), substr)
}

// noCaseContains reports whether substr is within s case-insensitive.
func noCaseContains(s, substr string) bool {
	s = strings.ToLower(s)
	substr = strings.ToLower(substr)
	return strings.Contains(s, substr)
}

// Panic panics if err != nil
func Panic(err error) {
	if err != nil {
		panic(err)
	}
}

func PathIsNotExist(name string) (ok bool) {
	_, err := os.Lstat(name)
	if os.IsNotExist(err) {
		ok = true
		err = nil
	}
	Panic(err)
	return
}

// PathIsExist .
func PathIsExist(name string) bool {
	return !PathIsNotExist(name)
}

func TimeNow() int64 {
	return time.Now().Unix()
}

// Base64Encode .
func Base64Encode(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}

// Base64Decode .
func Base64Decode(s string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(s)
}

// Abs 返回两个整数之差的绝对值。因为标准库中的 math.Abs 只处理浮点数，如果处理整数会很不方便。
func Abs(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
}

func ReadFileFirstLine(name string) ([]byte, error) {
	l, err := os.ReadFile(name)
	if err != nil {
		return nil, err
	}
	i := firstLineBreak(string(l))
	if i < 0 {
		return l, nil
	}
	return l[:i], nil
}

// firstLineBreak 获取第一个 \r\n 或第一个 \n 的位置
func firstLineBreak(s string) int {
	i := strings.Index(s, "\n")
	i2 := strings.Index(s, "\r\n")
	if i2 < 0 {
		return i
	}
	if i > i2 {
		i = i2
	}
	return i
}

func ShuffleStrArr(arr []string, limit int) []string {
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(arr), func(i, j int) {
		arr[i], arr[j] = arr[j], arr[i]
	})
	if len(arr) > limit {
		return arr[:limit]
	}
	return arr
}
