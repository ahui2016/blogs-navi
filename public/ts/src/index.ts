import { ajax, event } from 'jquery';
import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Hour = 60 * 60;
let blogs: util.Blog[];

let CAT = util.getUrlParam('cat');

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const Logs = util.CreateAlerts(0);

const titleArea = m('div').addClass('text-center').append([
  m('h1').text('博客更新导航'),
  m('div').text('批量检测博客更新，提供源代码可自建服务'),
]);

const HintBtn = cc('a', {text:'Hint',attr:{href:'#',title:'显示说明'}});
const Hint = cc('div', {classes:'Hint',children:[
  m('button').text('hide').on('click', () => {
    Hint.elem().hide();
    HintBtn.elem().css('visibility', 'visible');
  }),
  m('ul').append([
    m('li').text('本页默认展示有 feed (比如 RSS feed) 的博客列表'),
    m('li').append([
      span('可手动在网页地址后加参数展示没有 feed 的博客，比如 '),
      m('a').text('/?cat=self').attr({href:'/?cat=self'}),
      span(', 该参数表示 "展示类别(category)前缀为self的博客"'),
    ]),
    m('li').text('按 F12 进入控制台输入命令 get_categories() 可查看现有哪些类别'),
    m('li').text('在 Add(添加博客) 页面可随意添加类别'),
  ]),
]});

const PwdInput = cc('input', {attr:{type:'password',placeholder:'password'}});
const CheckBtn = cc('button', {text:'check'});
const CheckForm = cc('form', {classes:'text-right',children:[
  m(PwdInput),
  m(CheckBtn).on('click', event => {
    event.preventDefault();
    checkBlogs();
  }),
]});

const BtnShowCheckForm = cc('a', {text:'Check',attr:{href:'#',title:'批量检测'}});
const naviBar = m('div').addClass('text-right').append([
  m(BtnShowCheckForm).on('click', event => {
    event.preventDefault();
    BtnShowCheckForm.elem().fadeOut(500, () => {
      CheckForm.elem().show(() => {
        PwdInput.elem().trigger('focus');  
      });
    });
  }),
  m('a').text('Add').attr({href:'/public/edit-blog.html',title:'添加博客'}).addClass('ml-2'),
  m(HintBtn).addClass('ml-2').on('click', e => {
    e.preventDefault();
    HintBtn.elem().css('visibility', 'hidden');
    Hint.elem().show();
  }),
]);

const BlogList = cc('div');

const Footer = cc('div', {classes:'text-center my-5',children:[
  span('源码: '),
  m('a').text('https://github.com/ahui2016/blogs-navi')
      .attr({href:'https://github.com/ahui2016/blogs-navi',target:'_blank'}),
]});

$('#root').append([
  titleArea,
  naviBar,
  m(CheckForm).hide(),
  m(Hint).addClass('my-3').hide(),
  m(Loading).addClass('my-5'),
  m(Logs),
  m(Alerts).addClass('my-3'),
  m(BlogList).addClass('my-5'),
  m(Footer).hide(),
]);

init();

function init() {
  if (!CAT) CAT = 'with-feed';
  const body = {category: CAT};
  util.ajax({method:'POST',url:'/api/get-blogs',alerts:Alerts,body:body},
    resp => {
      blogs = resp as util.Blog[];
      if (!resp || blogs.length == 0) {
        if (CAT == 'with-feed') {
          Alerts.insert('primary', '请点击 Add 添加有 feed 的博客');
        } else {
          Alerts.insert('danger', `not found [category: ${CAT}]`);
        }
        return;
      }
      appendToList(BlogList, blogs.map(BlogItem));
      if (blogs.length > 3) {
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
  const self = cc('div', {id:blog.ID, classes:'BlogItem', children:[
    m('div').append([
      span('[id:'),
      m('a').text(blog.ID).attr({'href':'/public/edit-blog.html?id='+blog.ID,title:'详细资料'}),
      span(']').addClass('BlogCat'),
      span(blog.Status).addClass('badge-grey ml-2').attr('title', '上次检测结果'),
    ]),
    m('div').addClass('BlogName').append([
      m('a').text(blog.Name).attr({href:blog.Website,target:'_blank'}),
    ]),
    m('div').text(blog.Description).addClass('text-grey'),
    m('div').addClass('ErrMsg').hide(),
  ]});

  self.init = () => {
    if (blog.Author) {
      self.elem().find('.BlogName').append(span(' by '+blog.Author));
    }
    if (blog.Category) {
      self.elem().find('.BlogCat').text(`, cat:${blog.Category}]`);
    }
    if (blog.Status != 'not yet') {
      self.elem().append([
        span(' checked at: '+checkedAt), span(' updated at: '+updatedAt),
      ]);
    }
    if (blog.ErrMsg) {
      self.elem().find('.ErrMsg').show().text(`error: ${blog.ErrMsg}`);
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