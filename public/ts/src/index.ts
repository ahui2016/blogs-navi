import { ajax } from 'jquery';
import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Hour = 60 * 60;
let update_count = 0;
let blogs: util.Blog[];

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const Logs = util.CreateAlerts(0);

const titleArea = m('div').addClass('text-center mb-5').append([
  m('h1').text('博客更新导航'),
  m('div').text('批量检测博客更新，提供源代码可自建服务'),
]);

const BlogList = cc('div', {classes:'my-5'});

$('#root').append([
  titleArea,
  m(Loading),
  m(Logs),
  m(Alerts),
  m(BlogList),
]);

init();

function init() {
  const body = {category: "with-feed"};
  util.ajax({method:'POST',url:'/api/get-blogs',alerts:Alerts,body:body},
    resp => {
      blogs = resp as util.Blog[];
      appendToList(BlogList, blogs.map(BlogItem));
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
      m('a').text(blog.ID).attr({'href':'/public/blog-info.html?id='+blog.ID,title:'详细资料'}),
      span(']'),
      span(blog.Status).addClass('badge-grey ml-2').attr('title', '上次检测结果'),
    ]),
    m('div').append([
      m('a').text(blog.Name).attr({href:blog.Website,target:'_blank'}),
      span(' by '+blog.Author),
    ]),
    m('div').text(blog.Description).addClass('text-grey'),
    m('div').append([
      span(' checked at: '+checkedAt), span(' updated at: '+updatedAt),
    ]),
    m('div').addClass('ErrMsg').hide(),
  ]});

  self.init = () => {
    if (blog.ErrMsg) {
      self.elem().find('.ErrMsg').show().text(`error: ${blog.ErrMsg}`);
    }
  };
  return self;
}

(window as any).checkBlogs = async function () {
  update_count = 0;
  for (const blog of blogs) {
    if (!blog.Feed) continue;
    Alerts.clear();
    BlogList.elem().hide();
    Logs.insert('info', '正在检查: '+blog.Name);
    // if (dayjs().unix() - blog.FeedDate < 24*Hour) {
    //   Logs.insert('info', '距离上次检查时间未超过 24 小时，忽略本次检查。');
    //   continue;
    // }

    let feedsize = 0;
    let errmsg = '';
    try {
      feedsize = await getFeedSize(blog.Feed);
      Logs.insert('success', `Get ${feedsize} bytes from ${blog.Feed}`);
    } catch (err) {
      errmsg = `${err}`;
      Logs.insert('danger', errmsg);
    }
    try {
      await updateFeed(feedsize, errmsg, blog.ID);
    } catch (err) {
      Logs.insert('danger', `${err}`);
    }
  }
  Logs.insert('success', '任务执行结束，结果如下所示：');
}

function getFeedSize(feed: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject('timeout'); }, 10*1000);
    util.ajax({method:'GET',url:feed,responseType:'blob'},
      (resp) =>{ resolve((resp as Blob).size); },
      (_, errMsg) => { reject(errMsg); },
      () => { clearTimeout(timeout); });
  });
}

function updateFeed(feedsize: number, errmsg: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { reject('timeout'); }, 10*1000);
    const body = {feedsize:feedsize,errmsg:errmsg,id:id}
    util.ajax({method:'POST',url:'/admin/update-feed',body:body},
      () => { resolve(); },
      (_, errMsg) => { reject(errMsg); },
      () => { clearTimeout(timeout); });
  });
}
