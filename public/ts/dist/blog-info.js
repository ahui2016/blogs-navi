// 采用受 Mithril 启发的基于 jQuery 实现的极简框架 https://github.com/ahui2016/mj.js
import { m, cc } from './mj.js';
import * as util from './util.js';
let blogID = util.getUrlParam('id');
const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const titleArea = m('div').addClass('text-center').append(m('h1').text('博客信息'));
const naviBar = m('div').addClass('text-right').append(util.LinkElem('/home', { text: 'Index' }), util.LinkElem('/public/edit-blog.html?id=' + blogID, { text: 'Edit' }).addClass('ml-2'), util.LinkElem('/public/edit-post.html?blogid=' + blogID, { text: 'AddPost', title: 'add post' }).addClass('ml-2'));
const BlogInfo = cc('table');
BlogInfo.append = (key, value) => {
    BlogInfo.elem().append(create_table_row(key, value));
    return BlogInfo;
};
$('#root').append(titleArea, naviBar, m(Loading), m(Alerts), m(BlogInfo).hide());
init();
function init() {
    if (!blogID) {
        Loading.hide();
        Alerts.insert('danger', 'the blog id is empty, need a blog id');
        return;
    }
    util.ajax({ method: 'POST', url: '/api/get-blog', alerts: Alerts, body: { id: blogID } }, (resp) => {
        var _a;
        const blog = resp;
        const Links = cc('div', { classes: 'BlogLinks' });
        const cat = blog.Category
            ? util.LinkElem('/?cat=' + encodeURIComponent(blog.Category), { text: blog.Category })
            : '';
        BlogInfo.elem().show();
        BlogInfo
            .append('ID', blog.ID)
            .append('Name', util.LinkElem('/?search=' + encodeURIComponent(blog.Name), { text: blog.Name }))
            .append('Author', blog.Author)
            .append('Category', cat)
            .append('Website', util.LinkElem(blog.Website, { blank: true }))
            .append('Feed', util.LinkElem(blog.Feed, { blank: true }))
            .append('Threshold', blog.Threshold.toFixed())
            .append('Feed Size', blog.FeedSize.toFixed())
            .append('Last Update', dayjs.unix(blog.LastUpdate).format('YYYY-MM-DD HH:mm:ss'))
            .append('Last Check', dayjs.unix(blog.FeedDate).format('YYYY-MM-DD HH:mm:ss'))
            .append('Status', blog.Status ? blog.Status : 'not yet')
            .append('Error', blog.ErrMsg)
            .append('Description', blog.Description)
            .append('Links', m(Links));
        (_a = blog.Links) === null || _a === void 0 ? void 0 : _a.split('\n').forEach(link => {
            Links.elem().append(util.LinkElem(link, { blank: true }));
        });
    }, undefined, () => {
        Loading.hide();
    });
}
function create_table_row(key, value) {
    const tr = m('tr').append(m('td').addClass('nowrap').text(key));
    if (typeof value == 'string') {
        tr.append(m('td').addClass('pl-2').text(value));
    }
    else {
        tr.append(m('td').addClass('pl-2').append(value));
    }
    return tr;
}
window.delete_blog_and_its_post = () => {
    const body = { id: blogID, pwd: '' };
    util.ajax({ method: 'POST', url: '/admin/delete-blog', alerts: Alerts, body: body }, () => {
        Alerts.clear().insert('danger', '已删除该博客及与之关联的文章，不可恢复');
    });
};
