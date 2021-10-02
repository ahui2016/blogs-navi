import { m, cc } from './mj.js';
import * as util from './util.js';
let blogID = util.getUrlParam('id');
const Alerts = util.CreateAlerts();
const Title = cc('h1', { text: 'Add a new blog' });
const NameInput = create_textinput();
const AuthorInput = create_textinput();
const WebsiteInput = create_textinput();
const FeedInput = create_textinput();
const THoldInput = cc('input', { attr: { type: 'number' } });
const DescInput = create_textarea();
const LinksInput = create_textarea(3);
const SubmitAlerts = util.CreateAlerts();
const SubmitBtn = cc('button', { text: 'Submit', classes: 'btn' });
const Form = cc('form', { attr: { 'autocomplete': 'off' }, children: [
        create_item(NameInput, 'Name', '博客或网站名称'),
        create_item(AuthorInput, 'Author', '该博客或网站的作者/站长'),
        create_item(WebsiteInput, 'Website', '该博客或网站的网址'),
        create_item(FeedInput, 'Feed', '用来判断有无更新的网址 (比如 RSS 或文章列表的网址)'),
        create_item(THoldInput, 'Threshold', '用于判断有无更新的阈值 (单位:byte), 留空或填写 0 将采用默认值'),
        create_item(DescInput, 'Description', '博客/网站的简介、备注'),
        create_item(LinksInput, 'Links', '相关网址 (比如作者的 twitter), 请以 http 开头，每行一个网址'),
        m(SubmitAlerts),
        m('div').addClass('text-center my-5').append(m(SubmitBtn).on('click', (event) => {
            event.preventDefault();
            const body = newBlogForm();
            util.ajax({ method: 'POST', url: '/admin/add-blog', alerts: SubmitAlerts, buttonID: SubmitBtn.id, body: body }, (resp) => {
                blogID = resp.message;
                Alerts.insert('success', '成功添加博客');
                Form.elem().hide();
            });
        })),
    ] });
function create_textarea(rows = 2) {
    return cc('textarea', { classes: 'form-textarea', attr: { 'rows': rows } });
}
function create_textinput() {
    return cc('input', { attr: { type: 'text' } });
}
function create_item(comp, name, description) {
    return m('div').addClass('mb-3').append([
        m('label').attr({ for: comp.raw_id }).text(name),
        m(comp).addClass('form-textinput'),
        m('div').addClass('form-text').text(description),
    ]);
}
$('#root').append([
    m(Title),
    m(Alerts),
    m(Form),
]);
function newBlogForm() {
    const links = util.val(LinksInput)
        .split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return {
        id: blogID,
        name: util.val(NameInput).trim(),
        author: util.val(AuthorInput).trim(),
        website: util.val(WebsiteInput).trim(),
        feed: util.val(FeedInput).trim(),
        thold: util.val(THoldInput),
        desc: util.val(DescInput).trim(),
        links: links.join('\n'),
    };
}
