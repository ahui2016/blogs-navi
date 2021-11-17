// 采用受 Mithril 启发的基于 jQuery 实现的极简框架 https://github.com/ahui2016/mj.js
import { m, cc } from './mj.js';
import * as util from './util.js';
let blogID = util.getUrlParam('blogid');
let postID = util.getUrlParam('postid');
const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const Title = cc('h1', { text: 'Add a new post' });
const ViewBtn = cc('a', { text: 'View', classes: 'ml-2' });
const naviBar = m('div').addClass('text-right').append(util.LinkElem('/home', { text: 'Index' }), m(ViewBtn).hide());
const Author = cc('a', { attr: { href: '/public/blog-info.html?id=' + blogID, target: '_blank' } });
const AuthorArea = cc('div', { classes: 'mb-3', children: [
        m('strong').text('Author: '), m(Author),
    ] });
const TitleInput = util.create_input();
const UrlInput = util.create_input();
const DateInput = util.create_input('date');
const ContentInput = util.create_textarea(10);
const PwdInput = util.create_input('password');
const SubmitAlerts = util.CreateAlerts();
const SubmitBtn = cc('button', { id: 'submit', text: 'submit' }); // 该按钮只是用来防止回车提交表单
const AddBtn = cc('button', { text: 'Add', classes: 'btn btn-fat' });
const UpdateBtn = cc('button', { text: 'Update', classes: 'btn btn-fat' });
const Form = cc('form', { attr: { 'autocomplete': 'off' }, children: [
        m(AuthorArea),
        util.create_item(TitleInput, 'Title', '文章标题'),
        util.create_item(UrlInput, 'URL', '原文网址'),
        util.create_item(DateInput, 'Date', '原文发布时间'),
        util.create_item(ContentInput, 'Content', '正文内容 (采用 Markdown 格式)'),
        util.create_item(PwdInput, 'Password', '必须输入正确的管理员密码才能提交表单'),
        m(SubmitAlerts),
        m('div').addClass('text-center my-5').append(m(SubmitBtn).hide(), m(AddBtn), m(UpdateBtn).hide()),
    ] });
$('#root').append(m(Title), naviBar, m(Loading), m(Alerts), m(Form).hide());
init();
function init() {
    initAuthor();
}
function initAuthor() {
    if (postID) {
        ViewBtn.elem().show().attr({ href: '/public/view-post.html?id=' + postID });
    }
    util.ajax({ method: 'POST', url: '/api/get-blog', alerts: Alerts, body: { id: blogID } }, (resp) => {
        const blog = resp;
        const author = blog.Author ? blog.Author : blog.Name;
        Author.elem().text(author);
        Form.elem().show();
        UrlInput.elem().attr({ value: 'https://' });
        DateInput.elem().attr({ value: '2021-01-01' });
        Title.elem().trigger('focus');
    }, undefined, () => {
        Loading.hide();
    });
}
