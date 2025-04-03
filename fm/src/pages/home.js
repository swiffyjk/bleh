import { log } from "../build/log";
import { auth, page, root } from "../build/page";
import { lang, trans } from "../build/trans";
import { checkup_page_structure } from "../components/structure";
import { register_background, update_page } from "../page";
import { bleh_charts } from "./chart";
import { bleh_native_settings } from './lastfm_settings';

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

    register_background(auth.avatar.replace('/avatar42s/', '/ar0/'));


    let banner = document.createElement('div');
    banner.classList.add('top-banner', 'home-banner');

    banner.innerHTML = (`
        <a class="home-avatar" href="${root}user/${auth.name}">
            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}">
        </a>
        <h1>${trans[lang].home.welcome.replace('{m}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)}</h1>
    `);

    page.structure.container.insertBefore(banner, page.structure.container.firstElementChild);

    let nav = document.createElement('nav');
    nav.classList.add('navlist', 'secondary-nav', 'navlist--more', 'redesigned-navigation');
    nav.innerHTML = (`
        <ul class="navlist-items">
            <li class="navlist-item secondary-nav-item secondary-nav-item--home">
                <a href="${root}music" class="secondary-nav-item-link ${(page.subpage == 'music') ? 'secondary-nav-item-link--active' : ''}">
                    Home
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--recommendations">
                <a href="${root}music/+recommended" class="secondary-nav-item-link ${(page.type == 'recommended') ? 'secondary-nav-item-link--active' : ''}">
                    Recommendations
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--releases">
                <a href="${root}music/+releases/out-now" class="secondary-nav-item-link ${(page.type == 'releases') ? 'secondary-nav-item-link--active' : ''}">
                    Releases
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--bookmarks">
                <a href="${root}music/+bookmarks" class="secondary-nav-item-link ${(page.type == 'bookmarks') ? 'secondary-nav-item-link--active' : ''}">
                    Bookmarks
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--charts">
                <a href="${root}charts" class="secondary-nav-item-link ${(page.type == 'charts') ? 'secondary-nav-item-link--active' : ''}">
                    Charts
                </a>
            </li>
            <li class="fill"></li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--settings">
                <a href="${root}settings" class="secondary-nav-item-link ${(page.type == 'settings') ? 'secondary-nav-item-link--active' : ''}">
                    Settings
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--bleh">
                <a href="${root}bleh" class="secondary-nav-item-link ${(page.type == 'error') ? 'secondary-nav-item-link--active' : ''}">
                    bleh
                </a>
            </li>
        </ul>
    `);

    page.structure.nav = nav;
    banner.after(nav);

    if (page.type == 'charts')
        bleh_charts();

    if (page.type == 'settings')
        bleh_native_settings();
}

export function bleh_home_legacy() {
    window.location.href = `${root}music`;
}