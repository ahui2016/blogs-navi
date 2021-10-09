import { m, cc, span, appendToList } from './mj.js';
import * as util from './util.js';
const Hour = 60 * 60;
let blogs;
let CAT = util.getUrlParam('cat');
const Loading = util.CreateLoading('center');
const Alerts = util.CreateAlerts();
const Logs = util.CreateAlerts(0);
const titleArea = m('div').addClass('text-center').append([
    m('h1').text('博客更新导航'),
    m('div').text('批量检测博客更新，提供源代码可自建服务'),
]);
const PwdInput = cc('input', { attr: { type: 'password', placeholder: 'password' } });
const CheckBtn = cc('button', { text: 'check' });
const CheckForm = cc('form', { classes: 'text-right', children: [
        m(PwdInput),
        m(CheckBtn).on('click', event => {
            event.preventDefault();
            checkBlogs();
        }),
    ] });
const BtnShowCheckForm = cc('a', { text: 'Check', attr: { href: '#', title: '批量检测' } });
const naviBar = m('div').addClass('text-right').append([
    m('a').text('Add').attr({ href: '/public/edit-blog.html', title: '添加博客' }),
    m(BtnShowCheckForm).addClass('ml-2').on('click', event => {
        event.preventDefault();
        BtnShowCheckForm.elem().fadeOut(1000, () => {
            CheckForm.elem().show(() => {
                PwdInput.elem().trigger('focus');
            });
        });
    }),
]);
const BlogList = cc('div');
$('#root').append([
    titleArea,
    naviBar,
    m(CheckForm).hide(),
    m(Loading).addClass('my-5'),
    m(Logs),
    m(Alerts),
    m(BlogList).addClass('my-5'),
]);
init();
function init() {
    if (!CAT)
        CAT = 'with-feed';
    const body = { category: CAT };
    util.ajax({ method: 'POST', url: '/api/get-blogs', alerts: Alerts, body: body }, resp => {
        blogs = resp;
        appendToList(BlogList, blogs.map(BlogItem));
    }, undefined, () => {
        Loading.hide();
    });
}
function BlogItem(blog) {
    if (!blog.Status)
        blog.Status = 'not yet';
    const updatedAt = dayjs.unix(blog.LastUpdate).format('YYYY-MM-DD');
    const checkedAt = dayjs.unix(blog.FeedDate).format('YYYY-MM-DD');
    const self = cc('div', { id: blog.ID, classes: 'BlogItem', children: [
            m('div').append([
                span('[id:'),
                m('a').text(blog.ID).attr({ 'href': '/public/edit-blog.html?id=' + blog.ID, title: '详细资料' }),
                span(']').addClass('BlogCat'),
                span(blog.Status).addClass('badge-grey ml-2').attr('title', '上次检测结果'),
            ]),
            m('div').addClass('BlogName').append([
                m('a').text(blog.Name).attr({ href: blog.Website, target: '_blank' }),
            ]),
            m('div').text(blog.Description).addClass('text-grey'),
            m('div').addClass('ErrMsg').hide(),
        ] });
    self.init = () => {
        if (blog.Author) {
            self.elem().find('.BlogName').append(span(' by ' + blog.Author));
        }
        if (blog.Category) {
            self.elem().find('.BlogCat').text(`, cat:${blog.Category}]`);
        }
        if (blog.Status != 'not yet') {
            self.elem().append([
                span(' checked at: ' + checkedAt), span(' updated at: ' + updatedAt),
            ]);
        }
        if (blog.ErrMsg) {
            self.elem().find('.ErrMsg').show().text(`error: ${blog.ErrMsg}`);
        }
    };
    return self;
}
async function checkBlogs() {
    try {
        await checkPwd();
        CheckForm.elem().hide();
    }
    catch (err) {
        Alerts.insert('danger', `${err}`);
        return;
    }
    Alerts.clear();
    BlogList.elem().hide();
    for (const blog of blogs) {
        Logs.insert('info', '正在处理: ' + blog.Name);
        if (!blog.Feed) {
            Logs.insert('info', '没有 feed, 不检查。');
            continue;
        }
        if (dayjs().unix() - blog.FeedDate < 24 * Hour) {
            Logs.insert('info', '距离上次检查时间未超过 24 小时，忽略本次检查。');
            continue;
        }
        let feedsize = 0;
        let errmsg = '';
        try {
            feedsize = await getFeedSize(blog.Feed);
            Logs.insert('success', `Get ${feedsize} bytes from ${blog.Feed}`);
        }
        catch (err) {
            errmsg = `${err}`;
            Logs.insert('danger', errmsg);
        }
        try {
            await updateFeed(feedsize, errmsg, blog.ID);
        }
        catch (err) {
            Logs.insert('danger', `${err}`);
        }
    }
    Logs.insert('success', '全部任务结束，结果如下所示：');
}
function checkPwd() {
    return new Promise((resolve, reject) => {
        util.ajax({ method: 'POST', url: '/admin/check-only', body: { pwd: util.val(PwdInput) } }, () => { resolve(); }, (_, errMsg) => { reject(errMsg); });
    });
}
function getFeedSize(feed) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject('timeout'); }, 10 * 1000);
        util.ajax({ method: 'GET', url: feed, responseType: 'blob' }, (resp) => { resolve(resp.size); }, (_, errMsg) => { reject(errMsg); }, () => { clearTimeout(timeout); });
    });
}
function updateFeed(feedsize, errmsg, id) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject('timeout'); }, 10 * 1000);
        const body = {
            id: id,
            errmsg: errmsg,
            feedsize: feedsize,
            pwd: util.val(PwdInput),
        };
        util.ajax({ method: 'POST', url: '/admin/update-feed', body: body }, () => { resolve(); }, (_, errMsg) => { reject(errMsg); }, () => { clearTimeout(timeout); });
    });
}
window.get_categories = () => {
    util.ajax({ method: 'GET', url: '/api/get-cats' }, (resp) => {
        const cats = resp.filter(cat => !!cat);
        if (cats.length == 0) {
            console.log('warning: 找不到任何类别');
            return;
        }
        console.log(cats.join('\n'));
    });
};
