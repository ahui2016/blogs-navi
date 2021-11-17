package database

import (
	"database/sql"

	"ahui2016.github.com/blogs-navi/model"
	"ahui2016.github.com/blogs-navi/stmt"
)

const (
	blog_id_key    = "blog-id-key"
	blog_id_prefix = "B"
	post_id_key    = "post-id-key"
	post_id_prefix = "P"
)

func getTextValue(key string, tx TX) (value string, err error) {
	row := tx.QueryRow(stmt.GetTextValue, key)
	err = row.Scan(&value)
	return
}

func getIntValue(key string, tx TX) (value int64, err error) {
	row := tx.QueryRow(stmt.GetIntValue, key)
	err = row.Scan(&value)
	return
}

func getCurrentID(key string, tx TX) (id model.ShortID, err error) {
	strID, err := getTextValue(key, tx)
	if err != nil {
		return
	}
	return model.ParseID(strID)
}

func initFirstID(key, prefix string, tx TX) (err error) {
	_, err = getCurrentID(key, tx)
	if err == sql.ErrNoRows {
		id, err1 := model.FirstID(prefix)
		if err1 != nil {
			return err1
		}
		_, err = tx.Exec(stmt.InsertTextValue, key, id.String())
	}
	return
}

func getNextID(tx TX, key string) (nextID string, err error) {
	currentID, err := getCurrentID(key, tx)
	if err != nil {
		return
	}
	nextID = currentID.Next().String()
	_, err = tx.Exec(stmt.UpdateTextValue, nextID, key)
	return
}
