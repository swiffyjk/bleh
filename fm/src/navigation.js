//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "./build/config";
import {auth, page, root} from "./build/page";
import {stored_season} from "./build/seasonal";
import {lang, lang_info, tl, trans, trans_legacy} from "./build/trans";
import {create_badge, load_badges} from "./components/badge";
import {version} from "./main";
import {ff} from "./sku";
import {html, render} from "lighterhtml";
import {news} from "./news.js";
import {toggle_theme} from "./config.js";
import {save_setting, setting} from "./components/settings.js";
import {prompt_for_update} from "./style.js";
import {log} from "./build/log.js";
import {correct_artist, correct_item_by_artist} from "./components/lotus.js";
import {bleh_notification_list} from "./components/notifications.js";
import tippy from "tippy.js";
import { chart_reflow } from './chart.js';
import { load_profile_cache_externally, open_starred_friend_window } from './pages/profile.js';
import { sponsor } from './sponsor.js';
import moment from 'moment';
import { register_menu } from './components/menu.js';

export function patch_masthead() {
    let masthead_logo = document.body.querySelector('.masthead-logo');
    if (!masthead_logo) return;

    if (!masthead_logo.hasAttribute('data-kate-processed')) {
        masthead_logo.setAttribute('data-kate-processed','true');

        update_masthead(masthead_logo);
    }
}

export function update_masthead(masthead_logo = document.body.querySelector('.masthead-logo')) {
    const update_required = localStorage.getItem('bleh_update_required') || 'false';

    let home_link;

    render(masthead_logo, html``);
    render(masthead_logo, html`
        <a href="/">Last.fm</a>
        <a class="home-link" href="${root}music" ref=${el => home_link = el}>
            <div class="bleh-logo">${version.brand}</div>
            <div class="lastfm-logo">Last.fm</div>
        </a>
    `);

    const head_menu = tippy(home_link, {
        theme: 'window',
        content: html.node`
            <div class="setting-group blend">
                ${setting({id: 'branding_type'})}
            </div>
        `,
        placement: 'right-start',
        trigger: 'manual',
        interactive: true,
        interactiveBorder: 10,
        offset: [0, 0],

        onShow(instance) {
            instance.popper.addEventListener('click', event => {
                instance.hide();
            });
        }
    });

    register_menu(home_link, head_menu);

    let link;
    if (update_required === 'false') {
        link = html.node`
            <a class="bleh--version" href="${root}bleh">
                ${version.build}
                <div class="new-badge sku spacing">
                    ${version.sku}
                    ${settings.dev ? html.node`
                    <span class="bleh-icon-container">
                        <span class="bleh-icon" data-type="dev" style="--icon: var(--mask)"/>
                    </span>
                    ` : ''}
                </div>
            </a>
        `;
    } else {
        link = html.node`
            <a class="bleh--version" onclick=${() => prompt_for_update()}>
                <div class="update-container">
                    <div class="bleh-icon" style="--icon: var(--icon-16-update)" />
                </div>
                ${version.build}
                <div class="new-badge sku spacing">
                    ${version.sku}
                    ${settings.dev ? html.node`
                    <span class="bleh-icon-container">
                        <span class="bleh-icon" data-type="dev" style="--icon: var(--mask)"/>
                    </span>
                    ` : ''}
                </div>
            </a>
        `;

        tippy(link, {
            content: tl(trans.update_available_to_install)
        });
    }

    const last_checked = localStorage.getItem('bleh_update_checked') || null;

    const link_menu = tippy(link, {
        theme: 'context-menu',
        content: html.node`
            <a class="dropdown-menu-clickable-item" data-type="update" href="${root}bleh/general">
                ${last_checked
                ? tl(trans.last_checked_date).replace('{d}', moment(last_checked).fromNow())
                : tl(trans.never_checked)
                }
            </a>
        `,
        placement: 'right-start',
        trigger: 'manual',
        interactive: true,
        interactiveBorder: 10,
        offset: [0, 0],

        onShow(instance) {
            instance.popper.addEventListener('click', event => {
                instance.hide();
            });
        }
    });

    register_menu(link, link_menu);

    masthead_logo.appendChild(link);
}

export function append_nav() {
    if (ff('developer') && !page.structure.indicator) {
        let page_indicator = document.createElement('div');
        page_indicator.classList.add('page-indicator');
        document.documentElement.appendChild(page_indicator);

        page.structure.indicator = page_indicator;
    }

    if (!page.structure.loader) {
        const loader = html.node`
            <div class="loader">
                <div class="loader-bar">
                    <div class="loader-bar-fill" />
                </div>
                <div class="bleh-icon" />
            </div>
        `;
        document.body.appendChild(loader);
        page.structure.loader = loader;
    }

    if (!page.structure.style_warning) {
        const style_warning = html.node`
            <div class="style-warning" style="position: fixed; top: 0; left: 0; right: 0; padding: 20px; background: #fff; z-index: 1000000000; display: flex; align-items: center; gap: 30px">
                <strong>${tl(trans.style_warning)}</strong>
                <button class="btn-primary" onclick=${() => {
                    save_setting('dev', false);
                    window.location.reload();
                }}>${tl(trans.re_enable_style_loading)}</button>
            </div>
        `;
        document.body.appendChild(style_warning);
        page.structure.style_warning = style_warning;
    }

    page.state.quick_access_items = {
        home: {
            name: tl(trans.home),
            icon: 'home',
            url: `${root}music`
        },
        reports: {
            name: tl(trans.reports),
            icon: 'reports',
            url: `${root}user/${auth.name}/listening-report`
        },
        library: {
            name: tl(trans.library),
            icon: 'library',
            url: `${root}user/${auth.name}/library`
        },
        shouts: {
            name: tl(trans.shouts),
            icon: 'shouts',
            url: `${root}user/${auth.name}/shoutbox`
        },
        obsessions: {
            name: tl(trans.obsessions),
            icon: 'obsessions',
            url: `${root}user/${auth.name}/obsessionss`
        },
        bookmarks: {
            name: tl(trans.bookmarks),
            icon: 'bookmark',
            url: `${root}music/+bookmarks`
        },
        friends: {
            name: tl(trans.friends),
            icon: 'user',
            url: `${root}user/${auth.name}/friends`
        },
        notifications: {
            name: tl(trans.notifications),
            icon: 'notifications',
            url: `${root}inbox/notifications`
        },
        messages: {
            name: tl(trans.messages),
            icon: 'messages',
            url: `${root}inbox`
        },
        collage: {
            name: tl(trans.collage),
            icon: 'collage',
            url: `${root}bleh/minis/collage`
        },
        compare: {
            name: tl(trans.compare),
            icon: 'compare',
            url: `${root}bleh/minis/compare`
        }
    }


    const masthead = document.body.querySelector('.masthead');
    const inner = masthead.querySelector('.masthead-inner-wrap');

    const navs = inner.querySelector('.masthead-nav-wrap');

    const search = inner.querySelector('.masthead-search-form');
    const form = search.querySelector('.masthead-search-field');
    form.placeholder = tl(trans.search);
    inner.insertBefore(html.node`
        <div class="masthead-search-wrap">
            ${search}
        </div>
    `, navs);


    // 2025-04-14
    let new_auth = masthead.querySelector('.auth-dropdown-menu');

    let links = masthead.querySelector('.masthead-nav .navlist-items');
    render(links, html``);

    let auth_link = masthead.querySelector('.masthead-nav-wrap > .site-auth .auth-link');
    if (!auth_link) {
        render(links, html`
            ${() => {
                const elem = html.node`
                    <li class="masthead-nav-item">
                        <a class="masthead-nav-control chibi" href="${root}bleh" data-label="bleh_no_auth">
                            ${tl(trans.bleh_settings)}
                        </a>
                    </li>
                `;

                tippy(elem, {
                    content: tl(trans.bleh_settings)
                });

                return elem;
            }}
        `);
        return;
    }

    if (auth_link.hasAttribute('data-bleh')) return;
    auth_link.setAttribute('data-bleh', 'true');

    auth_link.appendChild(html.node`
        <p>${auth.name}</p>
    `);

    let badges = load_badges(auth.name, true);

    if (badges) {
        auth_link.appendChild(create_badge(badges[0], false, false, true));
    } else if (auth.pro) {
        auth_link.appendChild(html.node`
            <span class="label user-status-subscriber auth-badge">${tl(trans.badges['user-status-subscriber'].name)}</span>
        `);
    }


    /*let quick_switcher = html.node`
        <li class="masthead-nav-item">
            <button class="masthead-nav-control" data-type="cmd" onclick=${() => page.state.rabbit()}>
                ${tl(trans.quick_switcher)}
            </button>
        </li>
    `;

    tippy(quick_switcher, {
        content: tl(trans.quick_switcher)
    });

    links.appendChild(quick_switcher);*/


    // configure bleh
    let bleh_container = html.node`
        <li class="masthead-nav-item">
            <a class="masthead-nav-control" href="${root}bleh${(stored_season.id != 'none') ? '/seasonal' : ''}" data-label="bleh" data-season="${stored_season.id}" data-season-active="${(stored_season.id != 'none') ? 'true' : 'false'}">
                ${(stored_season.id == 'none') ? tl(trans.bleh_settings) : moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}
            </a>
        </li>
    `;
    if (stored_season.id == 'none') {
        tippy(bleh_container, {
            content: tl(trans.bleh_settings)
        });
    } else {
        page.header.season_tooltip = tippy(bleh_container, {
            theme: 'seasonal-swatch',
            content: html.node`
                <span class="season-colour-name">${tl(trans.seasonal.listing[stored_season.id])}</span>
                <span class="season-exclusive">${trans_legacy.en.auth_menu.seasonal_notice}</span>
            `,
        });
    }
    links.appendChild(bleh_container);

    page.header.season = bleh_container.querySelector('a');


    const more_button = html.node`
        <button class="masthead-nav-control chibi icon" data-type="more">
            ${tl(trans.more)}
        </button>
    `;

    tippy(more_button, {
        content: more_button.textContent
    });

    const more_menu = tippy(more_button, {
        content: html.node`
            <button class="dropdown-menu-clickable-item sponsor" onclick=${() => sponsor()}>
                ${tl(trans.sponsor)}
            </button>
            <a class="dropdown-menu-clickable-item lotus" href="https://github.com/katelyynn/lotus/issues/new/choose" target="_blank">
                ${tl(trans.suggest_correction)}
            </a>
            <div class="sep" />
            <a class="dropdown-menu-clickable-item" data-type="update" href="${root}bleh/general">
                ${tl(trans.updates)}
            </a>
            <a class="dropdown-menu-clickable-item issues" href="https://github.com/katelyynn/bleh/issues" target="_blank">
                ${tl(trans.report_issue)}
            </a>
        `,
        theme: 'menu',
        placement: 'top',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow(instance) {
            instance.popper.addEventListener('click', event => {
                instance.hide();
            });
        }
    });

    links.appendChild(more_button);


    let notif_count = new_auth.querySelector('[data-analytics-label="notifications"] + .auth-avatar-notification-count-badge');
    if (!notif_count) notif_count = '0'; else notif_count = notif_count.textContent;
    let inbox_count = new_auth.querySelector('[data-analytics-label="inbox"] + .auth-avatar-notification-count-badge');
    if (!inbox_count) inbox_count = '0'; else inbox_count = inbox_count.textContent;

    const inbox = html.node`
        <a class="inbox-item" href="${root}inbox/notifications">
            ${parseInt(notif_count) + parseInt(inbox_count)}
        </a>
    `;

    tippy(inbox, {
        theme: 'stack',
        content: html.node`
            <strong>${tl(trans.inbox)}</strong>
            <div class="inbox-info">
                <div class="inbox-info-item">
                    <div class="bleh-icon" data-type="notifications" />
                    ${notif_count}
                </div>
                <div class="inbox-sep" />
                <div class="inbox-info-item">
                    <div class="bleh-icon" data-type="messages" />
                    ${inbox_count}
                </div>
            </div>
        `
    });

    inbox.addEventListener('click', (e) => {
        const cmd = (e.getModifierState('Control') || e.getModifierState('Meta'));
        const new_tab = e.button === 1 || cmd;

        // only allow clicking link if new tab action
        if (!new_tab) e.preventDefault();
    });

    let content;

    tippy(inbox, {
        content: html.node`
            <div class="window-header">
                <div class="bleh-icon" data-type="inbox" style="--icon: var(--mask)" />
                <div class="window-title">${tl(trans.inbox)}</div>
            </div>
            ${setting({id: 'inbox_view', func: render_inbox})}
            <div class="window-content" ref=${el => content = el} />
        `,
        theme: 'nav-window',
        placement: 'top',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow(instance) {
            content = instance.popper.querySelector('.window-content');

            render_inbox();
        }
    });

    function render_notifications(notifications) {
        if (settings.inbox_view != 'notifications') return;

        bleh_notification_list(notifications, true);

        render(content, html`
            <div class="mini-notifications">
                ${notifications}
                <p class="more-link">
                    <a href="${root}inbox/notifications">${tl(trans.read_more)}</a>
                </p>
            </div>
        `);
    }

    function render_messages(messages) {
        if (settings.inbox_view != 'messages') return;

        render(content, html`
            <div class="mini-notifications">
                <div class="alert alert-danger">This is a work in progress, sorry! >_<</div>
                <p class="more-link">
                    <a href="${root}inbox">${tl(trans.read_more)}</a>
                </p>
            </div>
        `);

        return;

        render(content, html`
            <div class="mini-notifications">
                ${messages}
                <p class="more-link">
                    <a href="${root}inbox">${tl(trans.read_more)}</a>
                </p>
            </div>
        `);
    }

    function render_inbox() {
        const view = settings.inbox_view;

        log(`rendering view ${view}`, 'navigation');

        if (!content) return;

        if (content) {
            render(content, html`
                <div class="mini-notifications content-loading">
                    <div class="loading-data-container">
                        <div class="loading-data-text">${tl(trans.loading)}</div>
                    </div>
                </div>
            `);
        }

        if (view == 'notifications') {
            if (page.notifications.list) render_notifications(page.notifications.list);

            fetch_notifications().then(notifications => render_notifications(notifications));
        } else {
            if (page.messages.list) render_messages(page.messages.list);

            fetch_messages().then(messages => render_messages(messages));
        }
    }

    links.appendChild(inbox);


    // language
    let selected_language = document.querySelector('.footer-language--active strong')?.textContent;
    let language_options = document.querySelectorAll('.footer-language-form');

    const language_menu = html.node`
        <div class="language-menu">
            <button class="dropdown-menu-clickable-item lang-item active" data-lang="${lang}" style="--flag-url: url('https://katelyynn.github.io/bleh/fm/flags/${lang}.svg')">
                <div class="auth-dropdown-item-row">
                    <span class="auth-dropdown-item-left">
                        ${selected_language}
                    </span>
                    <span class="auth-dropdown-item-right">
                        <div class="bleh-icon checkmark" />
                    </span>
                </div>
            </button>
            <div class="sep"></div>
        </div>
    `;

    language_options.forEach((language_option) => {
        const button = language_option.querySelector('button');
        const key = button.getAttribute('name');

        button.classList.remove('mimic-link');
        button.classList.add('dropdown-menu-clickable-item', 'lang-item', 'flex-button');

        button.setAttribute('data-lang', key);
        button.style.setProperty('--flag-url', `url('https://katelyynn.github.io/bleh/fm/flags/${key}.svg')`);

        if (lang_info.hasOwnProperty(key)) {
            render(button, html`
                <div class="auth-dropdown-item-row">
                    <span class="auth-dropdown-item-left">
                        ${button.textContent}
                    </span>
                    <span class="auth-dropdown-item-right">
                        <div class="bleh-icon checkmark" />
                    </span>
                </div>
            `);
        }

        language_menu.appendChild(language_option);
    });


    let themes = [
        {
            id: 'auto',
            name: tl(trans.auto),
            hide: !ff('auto_theme'),
            new_release: true
        },
        {
            id: 'glass',
            type: 'light',
            name: tl(trans.glass),
            hide: !ff('glass'),
            new_release: true
        },
        {
            id: 'light',
            type: 'light',
            name: tl(trans.themes.light)
        },
        {
            id: 'ink',
            type: 'light',
            name: tl(trans.themes.ink)
        },
        {
            id: 'dark',
            formal: 'ash',
            type: 'dark',
            name: tl(trans.themes.dark)
        },
        {
            id: 'darker',
            formal: 'dark',
            type: 'darker',
            name: tl(trans.themes.darker)
        },
        {
            id: 'oled',
            formal: 'void',
            type: 'oled',
            name: tl(trans.themes.oled)
        }
    ];


    // auth menu
    const token = new_auth.querySelector('[name="csrfmiddlewaretoken"]').getAttribute('value');
    page.token = token;

    let auth_menu = tippy(auth_link, {
        theme: 'auth-menu-v2',
        placement: 'top',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow: async (instance) => {
            page.structure.notifications.setAttribute('data-auth-open', 'true');
            badges = load_badges(auth.name);

            let page_2;
            let side;

            const cache = await load_profile_cache_externally(auth.name);
            console.info('awaited', cache);

            let status_container;

            const current = settings.navigation_items;

            let length = current.length;
            if (length < 2) length = 2;

            const show_language = (settings.navigation_language == true) ? 1 : 0;

            // user defined + themes + language + minis + settings
            const height = (length + 3 + show_language) * 30;

            // you cant change your theme when viewing
            // a listening report
            const themes_disabled = page.subpage.startsWith('listening-report');

            instance.setContent(html.node`
                <div class="auth-menu-v2" style="--page-height: ${height}px">
                    <div class="side primary">
                        <div class="auth-menu-header">
                            <div class="avatar">
                                <img src="${auth.avatar.replace('avatar42s', 'avatar170s')}" alt="${auth.name}" />
                            </div>
                            ${cache.banner ? html.node`
                            <div class="bg" style="background-image: url(${cache.banner})" />
                            ` : (!auth.avatar.endsWith('818148bf682d429dc215c1705eb27b98.png')) ? html.node`
                            <div class="bg" style="background-image: url(${auth.avatar.replace('avatar42s', 'avatar170s')})" />
                            ` : ''}
                            <div class="name">${auth.name}</div>
                            ${(badges || auth.pro) ? html.node`
                                <div class="badges">
                                    ${badges ? badges.map(badge => create_badge(badge)) : ''}
                                    ${auth.pro ? () => {
                                        let el = html.node`
                                            <span class="label user-status-subscriber no-hover">
                                                ${tl(trans.badges['user-status-subscriber'].name)}
                                            </span>
                                        `;

                                        tippy(el, {
                                            theme: 'badge',
                                            placement: 'bottom',
                                            content: html.node`
                                                <div class="badge-name">${tl(trans.badges['user-status-subscriber'].name)}</div>
                                                <div class="badge-reason">${tl(trans.badges['user-status-subscriber'].reason)}</div>
                                            `
                                        });

                                        return el;
                                    } : ''}
                                </div>
                            ` : ''}
                            <a class="link-block-cover-link" href="${root}user/${auth.name}" />
                        </div>
                        <div class="floating button-group">
                            ${() => {
                                let button;
                                let form = html.node`
                                    <form>
                                        <input type="hidden" name="csrfmiddlewaretoken" value="${token}">
                                        <a class="dropdown-menu-clickable-item chibi" ref=${el => button = el} data-menu-item="logout" href="${root}logout">
                                            ${tl(trans.logout)}
                                        </a>
                                    </form>
                                `;

                                tippy(button, {
                                    content: tl(trans.logout)
                                });

                                return form;
                            }}
                            ${(settings.starred_friend != '') ? () => {
                                let button = html.node`
                                    <a class="dropdown-menu-clickable-item chibi" data-type="starred_friend" data-is-shortcut="true" href="${root}user/${settings.starred_friend}">${settings.starred_friend}</a>
                                `;

                                tippy(button, {
                                    content: settings.starred_friend
                                });

                                return button;
                            } : () => {
                                let button = html.node`
                                    <button class="dropdown-menu-clickable-item chibi" data-type="starred_friend" data-is-shortcut="false" onclick=${() => open_starred_friend_window()}>${tl(trans.starred_friend.name)}</button>
                                `;

                                tippy(button, {
                                    content: tl(trans.starred_friend.name)
                                });

                                return button;
                            }}
                        </div>
                    </div>
                    <div class="vertical-sep" />
                    <div class="side" ref=${el => side = el} data-page="1">
                        <div class="side-page" data-page="1">
                            ${current.map(val => {
                                let elem;

                                const formal = page.state.quick_access_items[val];

                                if (formal.url) elem = html.node`<a href=${formal.url} />`;
                                else elem = html.node`<button />`;

                                elem.classList = 'dropdown-menu-clickable-item';
                                elem.setAttribute('data-type', formal.icon);
                                elem.textContent = formal.name;

                                let count = 0;

                                if (val == 'notifications')
                                    count = notif_count;
                                else if (val == 'messages')
                                    count = inbox_count;

                                if (count) {
                                    render(elem, html`
                                        <div class="auth-dropdown-item-row">
                                            <span class="auth-dropdown-item-left">
                                                ${formal.name}
                                            </span>
                                            <span class="auth-dropdown-item-right">
                                                ${count}
                                            </span>
                                        </div>
                                    `);
                                }

                                return elem;
                            })}
                            <div class="button-combo">
                                <button class="dropdown-menu-clickable-item" data-menu-item="themes" disabled=${themes_disabled} onclick=${() => toggle_theme()}>
                                    ${tl(trans.themes.name)}
                                </button>
                                <div class="button-combo-sep" />
                                <button class="dropdown-menu-clickable-item chibi" data-type="continue" disabled=${themes_disabled} onclick=${() => {
                                    let buttons = [];

                                    render(page_2, html``); // fix crash
                                    render(page_2, html`
                                        <button class="dropdown-menu-clickable-item" data-type="back" onclick=${() => {
                                            side.setAttribute('data-page', '1');
                                        }}>
                                            ${tl(trans.back)}
                                        </button>
                                        ${themes.map(theme => {
                                            if (theme.hide) return html.node``;

                                            if (!theme.formal) theme.formal = theme.id;

                                            const btn = html.node`
                                                <button class="dropdown-menu-clickable-item theme-item-in-menu" aria-selected=${theme.id == settings.theme} data-bleh-theme=${theme.id} data-type="theme_${theme.formal}" onclick="${() => {
                                                    buttons.forEach(button => {
                                                        const id = button.getAttribute('data-bleh-theme');

                                                        button.setAttribute('aria-selected', id == theme.id);
                                                    });

                                                    save_setting('theme', theme.id);
                                                    chart_reflow();
                                                }}">
                                                    ${theme.name}
                                                </button>
                                            `;

                                            buttons.push(btn);
                                            return btn;
                                        })}
                                    `);
                                    side.setAttribute('data-page', '2');
                                }}>
                                    ${tl(trans.more)}
                                </button>
                            </div>
                            ${show_language ? html.node`
                            <div class="button-combo">
                                <button class="dropdown-menu-clickable-item" data-menu-item="language" onclick=${() => {
                                    render(page_2, html`
                                        <button class="dropdown-menu-clickable-item" data-type="back" onclick=${() => {
                                            side.setAttribute('data-page', '1');
                                        }}>
                                            ${tl(trans.back)}
                                        </button>
                                        ${language_menu}
                                    `);
                                    side.setAttribute('data-page', '2');
                                }}>
                                    ${tl(trans.language)}
                                </button>
                                <div class="button-combo-sep" />
                                <button class="dropdown-menu-clickable-item chibi" data-type="continue" onclick=${() => {
                                    render(page_2, html`
                                        <button class="dropdown-menu-clickable-item" data-type="back" onclick=${() => {
                                            side.setAttribute('data-page', '1');
                                        }}>
                                            ${tl(trans.back)}
                                        </button>
                                        ${language_menu}
                                    `);
                                    side.setAttribute('data-page', '2');
                                }}>
                                    ${tl(trans.more)}
                                </button>
                            </div>
                            ` : ''}
                            <div class="button-combo">
                                <a class="dropdown-menu-clickable-item" data-type="mini" href="${root}bleh/minis">
                                    ${tl(trans.minis)}
                                </a>
                                <div class="button-combo-sep" />
                                <button class="dropdown-menu-clickable-item chibi" data-menu-item="news" onclick=${() => {
                                    news();
                                    instance.hide();
                                }}>
                                    ${tl(trans.news)}
                                </button>
                            </div>

                            <div class="button-combo">
                                <a class="dropdown-menu-clickable-item" data-menu-item="bleh" href="${root}bleh">
                                    ${tl(trans.settings)}
                                </a>
                                <div class="button-combo-sep" />
                                <a class="dropdown-menu-clickable-item chibi" data-type="settings" href="${root}settings">
                                    ${tl(trans.settings)}
                                </a>
                            </div>
                        </div>
                        <div class="side-page" data-page="2" ref=${el => page_2 = el} />
                    </div>
                </div>
                ${ff('status_in_menu') && auth.pro ? html.node`
                <div class="auth-menu-status" ref=${el => status_container = el}>
                    <div class="status">
                        <div class="loading-data-container">
                            <div class="loading-data-text">${tl(trans.loading)}</div>
                        </div>
                    </div>
                </div>
                ` : ''}
            `);

            function render_status_container(status) {
                if (!status) return;

                render(status_container, html`
                    <div class="status">
                        <div class="bleh-icon" />
                        <div class="status-bg" style="background-image: url(${status.avatar})" />
                        <div class="status-text">
                            ${status.name}
                            ${tl(trans.by)}
                            ${status.artist}
                        </div>
                    </div>
                `);
            }

            if (ff('status_in_menu') && auth.pro) {
                if (page.now.name) render_status_container(page.now);

                live_status().then(status => render_status_container(status));
            }
        },

        onHide(instance) {
            page.structure.notifications.setAttribute('data-auth-open', 'false');
        }
    });

    let container = new_auth.parentElement;
    container.parentElement.removeChild(container);
    auth_link.removeAttribute('aria-controls');
    auth_link.removeAttribute('data-disclose-hover');
    auth_link.removeAttribute('data-disclose-hover--allow-enter-open');

    auth_link.addEventListener('click', (e) => {
        const cmd = (e.getModifierState('Control') || e.getModifierState('Meta'));
        const new_tab = e.button === 1 || cmd;

        // only allow clicking link if new tab action
        if (!new_tab) e.preventDefault();
    });

    // mobile
    masthead.appendChild(html.node`
        <div class="mobile-controls">
            <a class="btn mobile-control" aria-checked="${page.type == 'overview' || page.type == 'recommended' || page.type == 'releases' || page.type == 'bookmarks' || page.type == 'charts'}" data-menu-item="home" href="${root}music">
                ${tl(trans.home)}
            </a>
            <a class="btn mobile-control" aria-checked="${page.type == 'search'}" data-menu-item="search" href="${root}search">
                ${tl(trans.search)}
            </a>
            <a class="btn mobile-control" aria-checked="${page.type == 'user' && page.name == auth.name}" data-menu-item="profile_mobile" href="${root}user/${auth.name}">
                ${auth.name}
            </a>
            <a class="btn mobile-control" aria-checked="${page.type == 'inbox'}" data-type="inbox" href="${root}inbox/notifications">
                ${tl(trans.inbox)}
                ${(inbox_count > 0 || notif_count > 0) ? html.node`<div class="notification-count-badge"></div>` : ''}
            </a>
            <a class="btn mobile-control" aria-checked="${page.type == 'settings' || page.type == 'bleh_settings'}" data-menu-item="settings" href="${root}bleh">
                ${tl(trans.settings)}
            </a>
        </div>
    `);
}

export async function live_status() {
    if (page.now.next_fetch && Date.now() < page.now.next_fetch) return page.now;

    try {
        const res = await fetch(`${root}user/${auth.name}/partial/now`);
        if (!res.ok) {
            log('failed to fetch', 'live', 'error', {res});
            return;
        }

        const dom = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(dom, 'text/html');

        const intro = doc.querySelector('.user-now-intro');

        let active = true;
        if (intro.textContent.trim() === tl(trans.last_scrobbled_replace).replace('{u}', auth.name))
            active = false;

        const track = doc.querySelector('.user-now-track a');
        const links = doc.querySelectorAll('.user-now-artist-and-album a');

        const artist = links[0];
        const album = links[1];
        const avatar = doc.querySelector('.cover-art img')?.src;

        // keep them in the same tab
        track.removeAttribute('target');
        artist.removeAttribute('target');
        album.removeAttribute('target');

        artist.textContent = correct_artist(artist.textContent);
        track.textContent = correct_item_by_artist(track.textContent, artist.textContent);

        let next = new Date();
        next.setMinutes(next.getMinutes() + 1);

        page.now = {
            next_fetch: next,
            name: track,
            artist,
            album,
            avatar,
            active
        };

        return page.now;
    } catch (error) {
        log('exception during fetch', 'live', 'error', {error: error});
    }
}

export async function fetch_notifications() {
    if (page.notifications.next_fetch && Date.now() < page.notifications.next_fetch) return page.notifications.list;

    try {
        const res = await fetch(`${root}inbox/notifications`);
        if (!res.ok) {
            log('failed to fetch', 'live', 'error', {res});
            return;
        }

        const dom = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(dom, 'text/html');

        const list = doc.querySelector('.inbox-notifications');

        let next = new Date();
        next.setMinutes(next.getMinutes() + 2);

        page.notifications.next_fetch = next;

        if (list) {
            page.notifications.list = list;

            return list;
        }
    } catch (error) {
        log('exception during fetch', 'live', 'error', {error: error});
    }
}

export async function fetch_messages() {
    if (page.messages.next_fetch && Date.now() < page.messages.next_fetch) return page.messages.list;

    try {
        const res = await fetch(`${root}inbox`);
        if (!res.ok) {
            log('failed to fetch', 'live', 'error', {res});
            return;
        }

        const dom = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(dom, 'text/html');

        const list = doc.querySelector('.inbox-table');

        let next = new Date();
        next.setMinutes(next.getMinutes() + 2);

        page.messages.next_fetch = next;

        if (list) {
            page.messages.list = list;

            return list;
        }
    } catch (error) {
        log('exception during fetch', 'live', 'error', {error: error});
    }
}
