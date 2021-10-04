import { mjElement, mjComponent, m, cc, span } from './mj.js';
import * as util from './util.js';

let blogID = util.getUrlParam('id');

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();

const Title = cc('h1', {text: 'Add a new blog'});

const NameInput = create_textinput();
const AuthorInput = create_textinput();
const WebsiteInput = create_textinput();
const FeedInput = create_textinput();
const THoldInput = cc('input', {attr:{type:'number'}});
const DescInput = create_textarea();
const LinksInput = create_textarea(3);

const SubmitAlerts = util.CreateAlerts();
const SubmitBtn = cc('button', {text:'Submit',classes:'btn'});
const UpdateBtn = cc('button', {text:'Update',classes:'btn'});

const Form = cc('form', {attr:{'autocomplete':'off'}, children: [
  create_item(NameInput, 'Name', '博客或网站名称'),
  create_item(AuthorInput, 'Author', '该博客或网站的作者/站长，也可填写 email'),
  create_item(WebsiteInput, 'Website', '该博客或网站的网址'),
  create_item(FeedInput, 'Feed', '用来判断有无更新的网址 (比如 RSS 或文章列表的网址)'),
  create_item(THoldInput, 'Threshold', '用于判断有无更新的阈值 (单位:byte), 留空或填写 0 将采用默认值'),
  create_item(DescInput, 'Description', '博客/网站的简介、备注'),
  create_item(LinksInput, 'Links', '相关网址 (比如作者的 twitter), 请以 http 开头，每行一个网址'),

  m(SubmitAlerts),
  m('div').addClass('text-center my-5').append([
    m(SubmitBtn).on('click', (event) => {
      event.preventDefault();
      const body = newBlogForm();
      util.ajax({method:'POST',url:'/admin/add-blog',alerts:SubmitAlerts,buttonID:SubmitBtn.id,body:body},
        (resp) => {
          blogID = resp.message;
          Alerts.insert('success', '点击下面的 Edit 按钮可编辑博客资料');
          Alerts.insert('success', '成功添加博客');
          Form.elem().hide();
          EditBtnArea.elem().show();
        });
    }),
    m(UpdateBtn).on('click', event => {
      event.preventDefault();
      const body = newBlogForm();
      util.ajax({method:'POST',url:'/admin/update-blog',alerts:SubmitAlerts,buttonID:UpdateBtn.id,body:body},
        () => {
          SubmitAlerts.insert('success', '更新成功');
        });
    }).hide(),
  ]),
]});

const EditBtn = cc('button', {text:'Edit',classes:'btn'});
const EditBtnArea = cc('div', {classes:'text-center my-5',children:[
  m(EditBtn).on('click', () => {
    location.href = '/public/edit-blog.html?id='+blogID;
  })
]});

$('#root').append([
  m(Title),
  m(Loading),
  m(Alerts),
  m(Form).hide(),
  m(EditBtnArea).hide(),
]);

init();

function init() {
  if (!blogID) {
    Loading.hide();
    Form.elem().show();
    return;
  }

  $('title').text('Edit blog');
  Title.elem().text(`Edit Blog (id:${blogID})`);

  util.ajax({method:'POST',url:'/api/get-blog',alerts:Alerts,body:{id: blogID}},
    (resp) => {
      const blog = resp as util.Blog;
      Form.elem().show();
      SubmitBtn.elem().hide();
      UpdateBtn.elem().show();

      NameInput.elem().val(blog.Name);
      AuthorInput.elem().val(blog.Author);
      WebsiteInput.elem().val(blog.Website);
      FeedInput.elem().val(blog.Feed);
      THoldInput.elem().val(blog.Threshold);
      DescInput.elem().val(blog.Description);
      LinksInput.elem().val(blog.Links);
    }, undefined, () => {
      Loading.hide();
    });
}

function newBlogForm() {
  const links = util.val(LinksInput)
    .split('\n').map(line => line.trim()).filter(line => line.length > 0)
    .join('\n');

  return {
    id: blogID,
    name: util.val(NameInput).trim(),
    author: util.val(AuthorInput).trim(),
    website: util.val(WebsiteInput).trim(),
    feed: util.val(FeedInput).trim(),
    thold: util.val(THoldInput),
    desc: util.val(DescInput).trim(),
    links: links,
  };
}

function create_textarea(rows: number=2): mjComponent {
  return cc('textarea', {classes:'form-textarea', attr:{'rows': rows}});
}
function create_textinput(): mjComponent {
  return cc('input', {attr:{type:'text'}});
}
function create_item(comp: mjComponent, name: string, description: string): mjElement {
  return m('div').addClass('mb-3').append([
    m('label').attr({for:comp.raw_id}).text(name),
    m(comp).addClass('form-textinput'),
    m('div').addClass('form-text').text(description),
  ]);
}
