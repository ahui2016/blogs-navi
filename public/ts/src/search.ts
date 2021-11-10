// 采用受 Mithril 启发的基于 jQuery 实现的极简框架 https://github.com/ahui2016/mj.js
import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Loading = util.CreateLoading();
const Alerts = util.CreateAlerts();

const titleArea = m('div').addClass('text-center').append(
  m('h1').text('站内搜索'),
);

const naviBar = m('div').addClass('text-right').append(
  m('a').text('Index').attr({href:'/'}),
);

const SearchInput = create_input();
const SearchAlerts = util.CreateAlerts(2);
const SearchBtn = cc('button', {text:'Search',classes:'btn btn-fat text-right'})
const SearchForm = cc('form', {attr:{autocomplete:'off'}, children: [
  create_item(SearchInput, '搜索博客名、作者名和博客简介', ''),
  m(SearchAlerts),
  m('div').addClass('text-center').append(
    m(SearchBtn).on('click', event => {
      event.preventDefault();
      const pattern = util.val(SearchInput);
      SearchAlerts.insert('primary', 'searching: '+pattern);
      const body = {pattern: pattern};
      util.ajax({method:'POST',url:'/api/count-search',alerts:SearchAlerts,buttonID:SearchBtn.id,body:body},
        (resp) => {
          const result = resp as util.Text;
          const n = parseInt(result.message);
          if (n > 0) {
            SearchAlerts.insert('success', `found ${n} items`);
            SearchAlerts.insert('primary', '即将自动跳转至搜索结果页面......');
            setTimeout(() => {
              location.href = '/?search='+encodeURIComponent(pattern);
            }, 3000);
          } else {
            SearchAlerts.insert('danger', 'not found');
          }
        }, undefined, () => {
          SearchInput.elem().trigger('focus');
        });
    })
  ),
]});

const CatListAlerts = util.CreateAlerts();
const CatList = cc('ul');
const CatListArea = cc('div', {children:[
  m('h2').text('按类别筛选博客'),
  m(Loading),
  m(CatListAlerts),
  m(CatList),
]});

const RandomArea = cc('div', {children:[
  m('h2').text('随机筛选博客'),
  m('ul').append(
    m('li').append(util.LinkElem('/?random=1', {text:'随机 (1)'})),
    m('li').append(util.LinkElem('/?random=3', {text:'随机 (3)'})),
    m('li').append(util.LinkElem('/?random=5', {text:'随机 (5)'})),
    m('li').append(util.LinkElem('/?random=10', {text:'随机 (10)'})),
    m('li').append(util.LinkElem('/?random=50', {text:'随机 (50)'})),
  ),
]});

const MoreBlogLists = cc('div', {children:[
  m('h2').text('更多博客名单'),
  m('ul').append(
    m('li').append(util.LinkElem('https://blorg.cn/', {text:'博客联盟',blank:true})),
    m('li').append(util.LinkElem('https://storeweb.cn/', {text:'个站商店',blank:true})),
    m('li').append(util.LinkElem('http://www.jetli.com.cn/', {text:'优秀个人独立博客导航',blank:true})),
    m('li').append(util.LinkElem('https://www.foreverblog.cn/blogs.html', {text:'十年之约',blank:true})),
    m('li').append(util.LinkElem('https://github.com/timqian/chinese-independent-blogs', {text:'中文独立博客列表',blank:true})),
  ),
]});

const Footer = cc('div', {classes:'text-center my-5',children:[
  span('源码: '),
  util.LinkElem('https://github.com/ahui2016/blogs-navi',{blank:true}),
  m('br'),
  span('version: 2021-11-10').addClass('text-grey'),
]});

$('#root').append(
  titleArea,
  naviBar,
  m(Alerts),
  m(SearchForm),
  m(CatListArea).addClass('my-5'),
  m(RandomArea).addClass('my-5'),
  m(MoreBlogLists).addClass('my-5'),
  m(Footer),
);

init();

function init() {
  initCategories();
}

function create_input(type:string='text'): mjComponent {
  return cc('input', {attr:{type:type}});
}
function create_item(comp: mjComponent, name: string, description: string): mjElement {
  return m('div').addClass('mb-3').append(
    m('label').attr({for:comp.raw_id}).text(name),
    m(comp).addClass('form-textinput form-textinput-fat'),
    m('div').addClass('form-text').text(description),
  );
}

function CatItem(cat: string): mjComponent {
  return cc('li', {children:[
    m('a').text(cat).attr('href', '/?cat='+encodeURIComponent(cat)),
  ]});
}

function initCategories(): void {
  util.ajax({method:'GET',url:'/api/get-cats',alerts:CatListAlerts},
    (resp) => {
      const cats = (resp as string[]).filter(cat => !!cat);
      if (!resp || cats.length == 0) {
        CatListAlerts.insert('primary', '找不到任何类别, 可在添加博客时设置类别');
        return;
      }
      appendToList(CatList, cats.map(CatItem));
    }, undefined, () => {
      Loading.hide();
      SearchInput.elem().trigger('focus');
    });
}