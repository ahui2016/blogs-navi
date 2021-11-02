// 采用受 Mithril 启发的基于 jQuery 实现的极简框架 https://github.com/ahui2016/mj.js
import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Hour = 60 * 60;
let blogs: util.Blog[];

let CAT = util.getUrlParam('cat');
let Pattern = util.getUrlParam('search');
let Random = util.getUrlParam('random');

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const Logs = util.CreateAlerts(0);

const titleArea = m('div').addClass('text-center').append(
  m('h1').append(
    util.LinkElem('/', {text:'博客更新导航'}),
  ),
  m('div').text('批量检测博客更新，提供源代码可自建服务'),
);

const HintBtn = cc('a', {text:'Hint',attr:{href:'#',title:'显示说明'}});
const Hint = cc('div', {classes:'Hint',children:[
  m('button').text('hide').addClass('btn').on('click', () => {
    Hint.elem().hide();
    HintBtn.elem().css('visibility', 'visible');
  }),
  m('ul').append(
    m('li').text('首页默认展示有 feed (比如 RSS feed) 的博客'),
    m('li').text('在 Search 页面可搜索博客或按类别筛选博客。'),
    m('li').text('特别推荐阅读每个博客的 "about" 或 "关于" 页面, 都非常有趣.'),
    // m('li').text('如果你的博客更换了域名, 可发邮件至 102419@gmail.com 通知我, 或到 V2EX 发一篇标题包含 "博客" 的贴子(我会定期搜索).'),
  ),
]});

const PwdInput = cc('input', {classes:'form-textinput',attr:{type:'password',placeholder:'password'}});
const CheckBtn = cc('button', {text:'check'});
const CheckForm = cc('form', {classes:'text-right',children:[
  m(PwdInput),
  m(CheckBtn).addClass('btn ml-1').on('click', event => {
    event.preventDefault();
    checkBlogs();
  }),
]});

const DownloadDB = cc('a', {text:'blogs-navi.db',attr:{download:'blogs-navi.db'}});
const RevokeBtn = cc('button', {text:'revoke'});

const BtnShowCheckForm = cc('a', {text:'Check',attr:{href:'#',title:'批量检测'}});
const naviBar = m('div').addClass('text-right').append(
  m(BtnShowCheckForm).on('click', event => {
    event.preventDefault();
    BtnShowCheckForm.elem().fadeOut(500, () => {
      CheckForm.elem().show(() => {
        PwdInput.elem().trigger('focus');  
      });
    });
  }),
  util.LinkElem('/public/edit-blog.html',{text:'Add',title:'添加博客',blank:true}).addClass('ml-2'),
  util.LinkElem('/public/search.html',{text:'Search',blank:true}).addClass('ml-2'),
  m(HintBtn).addClass('ml-2').on('click', e => {
    e.preventDefault();
    HintBtn.elem().css('visibility', 'hidden');
    Hint.elem().show();
  }),
);

const BlogList = cc('div');

const Footer = cc('div', {classes:'text-center my-5',children:[
  m('p').append(
    span('源码: '),
    util.LinkElem('https://github.com/ahui2016/blogs-navi',{blank:true})
  ),
  m('p').text('version: 2021-10-15').addClass('text-grey'),
]});

$('#root').append(
  titleArea,
  naviBar,
  m(CheckForm).hide(),
  m(DownloadDB).hide(), m(RevokeBtn).hide(),
  m(Loading).addClass('my-5'),
  m(Logs),
  m(Alerts).addClass('my-3'),
  m(Hint).addClass('my-3').hide(),
  m(BlogList).addClass('my-5'),
  m(Footer).hide(),
);

init();

function init() {
  let body: any;
  let url = '/api/get-blogs';
  let notFoundMsg = `not found [category: ${CAT}]`;
  let successMsg = '博客类别包含字符串: '+CAT;

  if (!CAT) {
    CAT = 'with-feed';
    notFoundMsg = '请点击 Add 添加有 feed 的博客';
    successMsg = '';
  }
  if (Pattern) {
    CAT = '';
    notFoundMsg = `search [${Pattern}]: not found`;
    successMsg = '博客名、作者名或博客简介包含: '+Pattern;
  }
  body = {category:CAT, pattern:Pattern};

  if (Random) {
    CAT = '';
    Pattern = '';
    body = {random:Random};
    url = '/api/get-random-blogs';
    notFoundMsg = '在数据库中未找到任何博客/网站';
    successMsg = `随机列出 ${Random} 个博客/网站`;
  }

  util.ajax({method:'POST',url:url,alerts:Alerts,body:body},
    resp => {
      blogs = resp as util.Blog[];
      if (!resp || blogs.length == 0) {
        Alerts.insert('danger', notFoundMsg);
        return;
      }
      if (successMsg) {
        Alerts.insert('success', successMsg);
      }
      appendToList(BlogList, blogs.map(BlogItem));
      if (blogs.length >= 5) {
        Footer.elem().show();
      }
    }, undefined, () => {
      Loading.hide();
    });
}

function BlogItem(blog: util.Blog): mjComponent {
  if (!blog.Status) blog.Status = 'not yet';
  const updatedAt = dayjs.unix(blog.LastUpdate).format('YYYY-MM-DD');
  const checkedAt = dayjs.unix(blog.FeedDate).format('YYYY-MM-DD');
  const self = cc('div', {id:blog.ID, classes:'BlogItem text-grey', children:[
    m('div').addClass('BlogIDArea').append(
      span('[id:'),
      util.LinkElem('/public/blog-info.html?id='+blog.ID,{text:blog.ID,title:'详细资料',blank:true}),
      span(']'),
      m('a').addClass('BlogCat ml-1'),
    ),
    m('div').addClass('BlogName').append(
      util.LinkElem(blog.Website,{text:blog.Name,blank:true}),
    ),
    m('div').text(blog.Description),
    m('div').addClass('ErrMsg').hide(),
  ]});

  self.init = () => {
    if (blog.Author) {
      self.elem().find('.BlogName').append(span(' by '+blog.Author).addClass('text-default'));
    }
    if (blog.Category) {
      self.elem().find('.BlogCat').text(blog.Category).attr({href:'/?cat='+encodeURIComponent(blog.Category)});
    }
    if (blog.Feed) {
      self.elem().find('.BlogIDArea').append(
        span(blog.Status).addClass('badge-grey ml-2').attr('title', '上次检测结果'),
      );
      if (blog.Status != 'not yet') {
        self.elem().append(m('div').append(
          span(' checked at: '+checkedAt), span(' updated at: '+updatedAt),
        ));
      }
      if (blog.ErrMsg) {
        self.elem().find('.ErrMsg').show().text(`error: ${blog.ErrMsg}`);
      }
    }
  };
  return self;
}

interface Headers {
  last_modified: number;
  etag: string;
  content_length: string;
}

async function checkBlogs() {
  if (!blogs || blogs.length == 0) {
    Alerts.insert('danger', '本页无博客列表，因此不执行批量检测。');
    return;
  }
  try {
    await checkPwd();
    CheckForm.elem().hide();
  } catch (err) {
    Alerts.insert('danger', `${err}`);
    return;
  }
  Alerts.clear();
  BlogList.elem().hide();

  for (const blog of blogs) {
    Logs.insert('info', '正在处理: '+blog.Name);
    if (!blog.Feed) {
      Logs.insert('info', '没有 feed, 不检查。')
      continue;
    }
    if (dayjs().unix() - blog.FeedDate < 24*Hour) {
      Logs.insert('info', '距离上次检查时间未超过 24 小时，忽略本次检查。');
      continue;
    }

    let headers:Headers = {last_modified:0,etag:'',content_length:'0'};
    let errmsg = '';

    try {
      headers = await getHeaders(blog.Feed);
      Logs.insert('success', `Got header: 1:${headers.last_modified}, 2:${headers.etag}, 3:${headers.content_length}`);
    } catch (err) {
      errmsg = `${err}`;
      Logs.insert('danger', errmsg);
    }

    try {
      await updateFeed(headers, errmsg, blog.ID);
    } catch (err) {
      Logs.insert('danger', `${err}`);
    }
  }
  Logs.insert('success', '全部任务结束，结果如下所示：');
}

function checkPwd(): Promise<void> {
  return new Promise((resolve, reject) => {
    util.ajax({method:'POST',url:'/admin/check-only',body:{pwd:util.val(PwdInput)}},
      () => { resolve(); },
      (_, errMsg) => { reject(errMsg); });
  });
}

function getHeaders(feed: string): Promise<Headers> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject('timeout'); }, 10*1000);
    util.ajax({method:'GET',url:feed,responseType:'blob'},
      resp => {
        const feedsize = (resp as Blob).size;
        resolve({
          last_modified: 0,
          etag: '',
          content_length: feedsize.toString()
        });
      },
      (_, errMsg) => { reject(errMsg); },
      () => { clearTimeout(timeout); },
      that => {
        if (that.readyState == that.HEADERS_RECEIVED) {
          const lastModified = that.getResponseHeader('last-modified');
          const lastupdate = !lastModified ? 0 : dayjs(lastModified).unix();
          const etag = that.getResponseHeader('etag') ?? '';
          const contentLength = that.getResponseHeader('content-length') ?? '0';
          if (lastupdate > 0 || etag != '' || contentLength != '0') {
            that.abort();
            resolve({
              last_modified: lastupdate,
              etag: etag,
              content_length: contentLength
            });
          }
        }
      });
  });
}

function updateFeed(header:Headers, errmsg: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject('timeout'); }, 10*1000);
    const body = {
      id: id,
      errmsg: errmsg,
      etag: header.etag,
      feedsize: header.content_length,
      lastupdate: header.last_modified,
      pwd: util.val(PwdInput),
    }
    util.ajax({method:'POST',url:'/admin/update-feed',body:body},
      () => { resolve(); },
      (_, errMsg) => { reject(errMsg); },
      () => { clearTimeout(timeout); });
  });
}

(window as any).get_categories = () => {
  util.ajax({method:'GET',url:'/api/get-cats'}, (resp) => {
    const cats = (resp as string[]).filter(cat => !!cat);
    if (cats.length == 0) {
      console.log('warning: 找不到任何类别');
      return;
    }
    console.log(cats.join('\n'));
  });
};

(window as any).download_db = () => {
  const body = {pwd: util.val(PwdInput)};
  util.ajax({method:'POST',url:'/admin/download-db',responseType:'blob',alerts:Alerts,body:body},
    (resp) => {
      const blob = resp as Blob;
      const blobUrl = URL.createObjectURL(blob);
      DownloadDB.elem().show().attr('href', blobUrl);
      RevokeBtn.elem().show().on('click', () => {
        URL.revokeObjectURL(blobUrl);
        DownloadDB.elem().hide();
        RevokeBtn.elem().hide(); 
      });
    });
}

(window as any).delete_blog_and_its_post = (blogID:string) => {
  const body = { id: blogID, pwd: util.val(PwdInput) };
  util.ajax({method:'POST',url:'/admin/delete-blog',body:body},
    () => {
      console.log('success: 已删除该博客及与之关联的文章，不可恢复');
    });
};
