// 采用受 Mithril 启发的基于 jQuery 实现的极简框架 https://github.com/ahui2016/mj.js
import { mjElement, mjComponent, m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();

const titleArea = m('div').addClass('text-center').append([
  m('h1').text('站内搜索'),
]);

const naviBar = m('div').addClass('text-right').append([
  m('a').text('Index').attr({href:'/'}),
]);

const SearchInput = create_input();
const SearchAlerts = util.CreateAlerts(2);
const SearchBtn = cc('button', {text:'Search',classes:'btn btn-fat text-right'})
const SearchForm = cc('form', {attr:{autocomplete:'off'}, children: [
  create_item(SearchInput, '搜索博客名、作者名和博客简介', ''),
  m(SearchAlerts),
  m('div').addClass('text-center').append(
    m(SearchBtn).on('click', () => {
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

$('#root').append([
  titleArea,
  naviBar,
  m(Loading).hide(),
  m(Alerts),
  m(SearchForm),
]);

function create_input(type:string='text'): mjComponent {
  return cc('input', {attr:{type:type}});
}
function create_item(comp: mjComponent, name: string, description: string): mjElement {
  return m('div').addClass('mb-3').append([
    m('label').attr({for:comp.raw_id}).text(name),
    m(comp).addClass('form-textinput form-textinput-fat'),
    m('div').addClass('form-text').text(description),
  ]);
}
