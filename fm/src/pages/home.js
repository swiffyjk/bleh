export function bleh_home() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    let content_top = document.body.querySelector('.content-top');

    checkup_page_structure(false, content_top);
    log('status is', 'page', 'info', page);
    update_page();


    let banner = document.createElement('div');
    banner.classList.add('top-banner', 'home-banner');

    banner.innerHTML = (`
        <a class="home-avatar" href="${root}user/${auth.name}">
            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}">
        </a>
        <h1>${trans[lang].home.welcome.replace('{m}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)}</h1>
    `);

    page.structure.container.insertBefore(banner, page.structure.nav);
}