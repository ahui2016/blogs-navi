import { mjElement, mjComponent, m, cc, span } from './mj.js';
import * as util from './util.js';

let blogID = util.getUrlParam('id');

const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();

const Title = cc('h1', {text: 'Add a new blog'});

const naviBar = m('div').addClass('text-right').append([
  m('a').text('Index').attr({href:'/'}),
]);

const NameInput = create_input();
const AuthorInput = create_input();
const WebsiteInput = create_input();
const FeedInput = create_input();
const THoldInput = cc('input', {attr:{type:'number'}});
const DescInput = create_textarea();
const LinksInput = create_textarea();
const CatInput = create_input();
const PwdInput = create_input('password');

const SubmitAlerts = util.CreateAlerts();
const SubmitBtn = cc('button', {id:'submit',text:'submit'});
const AddBtn = cc('button', {text:'Add',classes:'btn btn-fat'});
const UpdateBtn = cc('button', {text:'Update',classes:'btn btn-fat'});
const AddPostBtn = cc('a', {text:'AddPost',classes:'ml-2'});

const Form = cc('form', {attr:{'autocomplete':'off'}, children: [
  create_item(NameInput, 'Name', '博客或网站名称'),
  create_item(AuthorInput, 'Author', '该博客或网站的作者/站长，也可填写 email'),
  create_item(WebsiteInput, 'Website', '该博客或网站的网址'),
  create_item(FeedInput, 'Feed', '比如 RSS feed 或文章列表的网址, 必须有 feed 能加入批量检测列表（没有 feed 的博客/网站不会出现在 index 列表中）'),
  create_item(THoldInput, 'Threshold', '用于判断有无更新的阈值 (单位:byte), 留空或填写 0 将采用默认值'),
  create_item(DescInput, 'Description', '博客/网站的简介、备注'),
  create_item(LinksInput, 'Links', '相关网址 (比如作者的 twitter), 请以 http 开头，每行一个网址'),
  create_item(CatInput, 'Category', '类别，自由填写任意字符串 (筛选类别时按前缀筛选)'),
  create_item(PwdInput, 'Password', '必须输入正确的管理员密码才能提交表单'),

  m(SubmitAlerts),
  m('div').addClass('text-center my-5').append([
    m(SubmitBtn).hide().on('click', e => {
      e.preventDefault();
      return false; // 这个按钮是隐藏不用的，为了防止按回车键提交表单。
    }),
    m(AddBtn).on('click', (event) => {
      event.preventDefault();
      const body = newBlogForm();
      util.ajax({method:'POST',url:'/admin/add-blog',alerts:SubmitAlerts,buttonID:AddBtn.id,body:body},
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
    m(AddPostBtn).hide(),
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
  naviBar,
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
      AddBtn.elem().hide();
      UpdateBtn.elem().show();
      // AddPostBtn.elem().show().attr({
      //   href:'/public/add-post.html?id='+blog.ID,
      //   title:'添加文章'
      // });

      NameInput.elem().val(blog.Name);
      AuthorInput.elem().val(blog.Author);
      WebsiteInput.elem().val(blog.Website);
      FeedInput.elem().val(blog.Feed);
      THoldInput.elem().val(blog.Threshold);
      DescInput.elem().val(blog.Description);
      LinksInput.elem().val(blog.Links);
      CatInput.elem().val(blog.Category);
    }, undefined, () => {
      Loading.hide();
    });
}

function newBlogForm() {
  const links = util.val(LinksInput)
    .split('\n').map(line => line.trim()).filter(line => line.length > 0)
    .join('\n');

  return {
    pwd: util.val(PwdInput),
    id: blogID,
    name: util.val(NameInput).trim(),
    author: util.val(AuthorInput).trim(),
    website: util.val(WebsiteInput).trim(),
    feed: util.val(FeedInput).trim(),
    thold: util.val(THoldInput),
    desc: util.val(DescInput).trim(),
    links: links,
    category: util.val(CatInput).trim(),
  };
}

function create_textarea(rows: number=3): mjComponent {
  return cc('textarea', {classes:'form-textarea', attr:{'rows': rows}});
}
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

(window as any).delete_blog_and_its_post = () => {
  const body = {
    id: blogID,
    pwd: util.val(PwdInput)
  };
  util.ajax({method:'POST',url:'/admin/delete-blog',alerts:SubmitAlerts,buttonID:UpdateBtn.id,body:body},
    () => {
      Alerts.clear().insert('success', '已删除该博客及与之关联的文章，不可恢复。');
      Form.elem().hide();
      EditBtnArea.elem().hide();
    });
};
