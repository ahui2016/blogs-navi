import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();

const titleArea = m('div').addClass('text-center mb-5').append([
  m('h1').text('博客更新导航'),
  m('div').text('批量检测博客更新，提供源代码可自建服务'),
]);

const BlogList = cc('div', {classes:'my-5'});

$('#root').append([
  titleArea,
  m(Loading),
  m(Alerts),
  m(BlogList),
]);

init();

function init() {
  util.ajax({method:'GET',url:'/api/get-all-blogs',alerts:Alerts},
    resp => {
      const blogs = resp as util.Blog[];
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
      span(blog.Status),
      span(' updated at: '+updatedAt), span(' checked at: '+checkedAt),
    ]),
    m('a').text(blog.Name).attr({href:blog.Website,target:'_blank'}),
    m('div').text(blog.Description),
  ]});
  return self;
}
