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
- 另外，如果不想建站，也可不使用 VPS, 通过访问 http://localhost 的方式在本地电脑中使用。
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
- 使用参数 "-local" (比如 `$ ./blogs-navi -local`) 启动程序可免密码执行一切操作。
- 建议刚开始时可使用 "-local" 参数，添加一些博客之后再重启程序恢复需要密码的状态。
- 如果一直在本地使用（不搭建网站），可一直使用 "-local" 参数。


## 关于批量检测更新

- 本软件暂时采用前端检测，即通过直接在前端用 js 访问其他网站来检测其是否有更新，因此会遇到 CORS 问题，**必须使用浏览器插件**，比如:
  - [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino/) (推荐)
  - [Allow CORS](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)
- 我也考虑过用后端检测，但前端检测可减轻服务器负担，还有一个大好处：翻墙更方便，只要浏览器能访问的网站就肯定能检测。
- 另外推荐使用（不是必须）[RSSHub Radar](https://chrome.google.com/webstore/detail/rsshub-radar/kefjpfngnndepjbopdmoebkipbgkggaa) 来获取博客的 RSS feed.
- 批量检测功能，只会检测当前页面中列出的博客，因此可使用搜索功能筛选出特定的博客进行有针对性的检测。
- 由于博客一般不会频繁更新，为了减少对别人博客造成不必要的流量负担，默认需要间隔 24 小时才能再次检测。可按 F12 打开控制台输入命令 `disable_time_limit()` 解除该时间限制。

### 检测更新的原理

- 在添加博客到本软件中时，如果添加了 feed, 则可进行检测, feed 可以是 xml 文件，也可以是 html 文件，或任何文件。
- 在检测过程中，并不对 xml 文件进行解析，因此任何文件类型均不影响检测。
- 本程序会先尝试获取 feed 的 header, 从中获取更新时间、Etag 和文件体积。
- 如果在 header 中无法获取有用信息，则直接记录文件体积，如果体积与上次相比大于一定阈值即视为有更新。
- 通过 feed 的文件体积判断是否有更新时，用于判断的阈值可针对每个博客单独设置，默认为零，即只要体积有一点点变化即视为有更新。
- 已知问题：如果可以从 header 中获取更新时间，则更新时间是正确的，否则如果需要通过 Etag 或文件体积来判断，则更新时间可能不正确。（但至少可以判断有无更新，因此这个问题影响不大，知道就行。）


## 删除博客

- 由于删除后不可恢复，属于危险操作，因此删除功能采用了更复杂的操作方式。
- 在编辑博客信息的页面 (Edit Blog), 在 Password 文本框中输入正确的密码，按键盘的 F12 键打开浏览器的控制台，输入命令 `delete_blog_and_its_post()` 按回车即可删除博客。
- 在首页 (index.html) 点击 Check 按钮，输入密码, 按键盘的 F12 键打开浏览器的控制台，输入命令 `delete_blog_and_its_post('blog-id')` 按回车即可删除博客（其中 blog-id 要改为想要删除的博客的 ID）。


## 备份数据库

- 在首页 (index.html) 点击 Check 按钮，输入密码, 按键盘的 F12 键打开浏览器的控制台，输入命令 `download_db()` 按回车，会在密码框下显示 'blogs-navi.db', 右键点击另存为，即可下载数据库 (sqlite 单文件，体积很小)。
- 今后会提供导出为 JSON 的功能。


## 关于网站图标/头像、截图

- 一般收录博客的网站可能都会有博客的截图或图标/头像，但本站没有。
- 因为考虑到图像对人的注意力影响很大，可以快速吸引人的注意力，也会加速消耗人的注意力。
- 因此希望以纯文字为主，避免被图像带着眼睛跑，让头脑更清醒、更平静，也有助于减少焦虑。

## 本站前端使用 mj.js

- mj.js 是一个受 Mithril.js 启发的基于 jQuery 实现的极简框架，对于曾经用过 jQuery 的人来说，学习成本接近零。详见 https://github.com/ahui2016/mj.js

- 如果需要修改本软件的前端代码，请直接修改 public/ts/src 文件夹内的 ts 文件，修改后在 public/ts/ 文件夹内执行 tsc 命令即可自动重新生成必要的 js 文件。如果只是简单修改，也可以直接修改 public/ts/dist 里的 js 文件。
