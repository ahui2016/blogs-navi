# blogs-navi

在甜欣屋的一篇文章[《都2021了，我为什么还要写博客？》](https://tcxx.info/notion/761.html) 中说到

> 第一波博客热可以追溯到2005年左右。新浪博客是当时最为流行的博客平台之一，借势明星的运营策略，催生出一批像韩寒和徐静蕾这样的名人名博。

但其实在新浪博客之前，国内已经有很多个人博客、个人网站，通过 "友情链接" 的方式形成社交网。当时甚至还没有搜索引擎（现在年轻人很难想像吧！），书店里甚至会卖网站黄页（就是一本厚厚的书，里面全是网站名称和网址，类似于电话黄页，现在见过电话黄页的人也不多了，我小时候见过，电话黄页里包含了小镇里几乎全部座机号码，像查字典一样查户主的真实姓名就可以找到他家的电话号码）。

当时其中一种 "网上冲浪"(真是一个充满年代感的词) 的方法就是在一个个人博客/个人网站里点击 "友情链接" 跳到另一个网站，再从那个网站的友情链接跳到别的网站。

在新浪博客等平台出现之前，建网站一般需要使用虚拟主机，要自己买域名 —— 在这个已经习惯了 “注册即可使用” 的年代可能会觉很难吧，但当时很多初中生、高中生都做到了，跟着教程使用做只需要一点点耐心，也不是不可能的任务。

最近，当我把目光重新看向个人网站时，欣喜地发现有不少老个人网站坚持了下来，也有不少新个人网站不断冒出，依然是一个有生机的小世界，在这个小世界里有更真诚的表达、更少争吵抬杠、更个性化的网页设计、更自由的发声，也更容易备份数据（一般平台不提供导出功能，而个人网站可以全面掌控自己的数据，但要注意定期做好备份）。

以上是我制作 blogs-navi 的背景，那么, blogs-navi 具体是什么呢？

## blogs-navi 是一个可批量检测更新的博客导航程序

- 最直观的了解请看在线演示: [navi.ai42.xyz](navi.ai42.xyz) (密码 abc)
- 在演示版中，已经包含了少量博客，但建议你自己搭建 blogs-navi, 自己收集博客 (因为演示版人人皆可修改，数据会被随时删除)。
- 使用 blogs-navi 可收集博客网址、对已收集的博客进行分类和搜索、随机筛选博客、批量检测博客更新。

## 安装使用

- 在设计上是一个网站，需要架设在 VPS 里，需要有建站的基础知识。
- 另外，也可不使用 VPS, 通过访问 http://localhost 的方式使用。
- 先正确安装 [git](https://git-scm.com/downloads) 和 [Go 语言环境](https://golang.google.cn/doc/install).
- 然后在终端执行以下命令:

```
$ cd ~
$ git clone https://github.com/ahui2016/blogs-navi.git
$ cd blogs-navi
$ go build
$ ./blogs-navi
```
- 如果一切顺利，用浏览器访问 http://127.0.0.1 即可进行本地访问。如有端口冲突，可使用参数 `-addr` 更改端口，比如:

```
$ ./blogs-navi -addr 127.0.0.1:955
```

## 关于密码

- 由于我偷懒不想管理用户登录状态，因此每次添加或修改网站信息、执行检测都要输入密码。
- 初始密码是 abc, 可在 pwd.txt 文件里修改密码。
- 使用参数 "-local" 启动程序可免密码执行一切操作，比如 `$ ./blogs-navi -local`
- 建议刚开始时可使用 "-local" 参数，添加一些博客之后再重启程序恢复需要密码的状态。
- 如果一直在本地使用（不搭建网站），可一直使用 "-local" 参数。

## 关于批量检测更新

- 本软件暂时采用前端检测，即通过直接在前端用 js 访问 其他网站来检测其是否有更新，因此会遇到 CORS 问题，因此 **必须使用浏览器插件**，比如:
  - [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino/) (推荐)
  - [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
- 我也考虑过用后端检测，但前端检测可减轻服务器负担，还有一个大好处：翻墙更方便，只要浏览器能访问的网站就肯定能检测。
- 另外推荐使用（不是必须）[RSSHub Radar](https://chrome.google.com/webstore/detail/rsshub-radar/kefjpfngnndepjbopdmoebkipbgkggaa) 来获取博客的 RSS feed.


## 高级功能

本软件大部分功能都非常直观，但也有一些特殊的地方：

- 
- 建议先在本地用简单密码添加一些博客之后，再把数据库文件上传到服务器

为了方便备份，截图与文章都保存在数据库里。

如果不填写类别，则自动归入 "with-feed" 类别。
