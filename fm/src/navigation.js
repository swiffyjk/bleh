//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "./build/config";
import {auth, page, root} from "./build/page";
import {stored_season} from "./build/seasonal";
import {lang, tl, trans, trans_legacy} from "./build/trans";
import {create_badge, load_badges} from "./components/badge";
import {version} from "./main";
import {show_theme_change_in_menu} from "./pages/bleh_config";
import {ff} from "./sku";
import {html, render} from "lighterhtml";
import {news} from "./news.js";
import {change_theme_from_menu, toggle_theme} from "./config.js";
import {open_profile_shortcut_window} from "./components/profile_shortcut.js";
import {save_setting} from "./components/settings.js";
import {load_banner} from "./components/banner.js";
import {prompt_for_update} from "./style.js";
import {log} from "./build/log.js";
import {correct_artist, correct_item_by_artist} from "./components/lotus.js";

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

    render(masthead_logo, html``);
    render(masthead_logo, html`
        <a href="/">Last.fm</a>
        <a class="home-link" href="${root}music">
            <div class="bleh-logo">${version.brand}</div>
        </a>
    `);

    if (update_required === 'false') {
        masthead_logo.appendChild(html.node`
            <a class="bleh--version" href="${root}bleh">
                ${version.build}.${version.sku}
                ${(settings.dev) ? html.node`<div class="new-badge subtle">✦</div>` : ''}
            </a>
        `);
    } else {
        let link = html.node`
            <a class="bleh--version" onclick=${() => prompt_for_update()}>
                <div class="update-container">
                    <div class="bleh-icon" style="--icon: var(--icon-16-update)" />
                </div>
                ${version.build}.${version.sku}
                ${(settings.dev) ? html.node`<div class="new-badge subtle">✦</div>` : ''}
            </a>
        `;

        tippy(link, {
            content: tl(trans.update_available_to_install)
        });

        masthead_logo.appendChild(link);
    }
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

    // 2025-04-14
    let masthead = document.body.querySelector('.masthead');
    let new_auth = masthead.querySelector('.auth-dropdown-menu');

    let auth_link = masthead.querySelector('.masthead-nav-wrap > .site-auth .auth-link');
    if (!auth_link) return;

    if (auth_link.hasAttribute('data-bleh')) return;
    auth_link.setAttribute('data-bleh', 'true');

    auth_link.appendChild(html.node`
        <p>${auth.name}</p>
    `);

    auth.pro = !!masthead.querySelector('.masthead-pro-wrap');

    let badges = load_badges(auth.name, true);

    if (badges) {
        auth_link.appendChild(html.node`
            <span class="label user-status--bleh-${badges[0].type} user-status--bleh-user-${auth.name} auth-badge">${badges[0].name}</span>
        `);
    } else if (auth.pro) {
        auth_link.appendChild(html.node`
            <span class="label user-status-subscriber auth-badge">${tl(trans.badges['user-status-subscriber'].name)}</span>
        `);
    }


    let links = masthead.querySelector('.masthead-nav .navlist-items');
    render(links, html``);


    /*let quick_switcher = html.node`
        <li class="masthead-nav-item">
            <button class="masthead-nav-control" data-type="cmd">
                ${tl(trans.quick_switcher)}
            </button>
        </li>
    `;

    tippy(quick_switcher, {
        content: tl(trans.quick_switcher)
    });

    links.appendChild(quick_switcher);*/


    let notif_count = new_auth.querySelector('[data-analytics-label="notifications"] + .auth-avatar-notification-count-badge');
    if (!notif_count) notif_count = '0'; else notif_count = notif_count.textContent;
    let inbox_count = new_auth.querySelector('[data-analytics-label="inbox"] + .auth-avatar-notification-count-badge');
    if (!inbox_count) inbox_count = '0'; else inbox_count = inbox_count.textContent;

    let notif_container = html.node`
        <li class="masthead-nav-item">
            <a class="masthead-nav-control" href="${root}inbox/notifications" data-label="notifications" data-count=${notif_count}>
                <span class="sr-only">${tl(trans.notifications.name)}</span>
                <div class="counter">${notif_count}</div>
            </a>
        </li>
    `;

    if (notif_count > 0) {
        tippy(notif_container, {
            content: tl(trans.notifications.count).replace('{count}', notif_count)
        });
    } else {
        tippy(notif_container, {
            content: tl(trans.notifications.none)
        });
    }

    links.appendChild(notif_container);

    let inbox_container = html.node`
        <li class="masthead-nav-item">
            <a class="masthead-nav-control" href="${root}inbox" data-label="inbox" data-count=${inbox_count}>
                <span class="sr-only">${tl(trans.inbox.name)}</span>
                <div class="counter">${inbox_count}</div>
            </a>
        </li>
    `;

    if (inbox_count > 0) {
        tippy(inbox_container, {
            content: tl(trans.inbox.count).replace('{count}', inbox_count)
        });
    } else {
        tippy(inbox_container, {
            content: tl(trans.inbox.none)
        });
    }

    links.appendChild(inbox_container);

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


    // language
    let selected_language = document.querySelector('.footer-language--active strong')?.textContent;
    let language_options = document.querySelectorAll('.footer-language-form');

    let language_menu = html.node`
        <div class="language-menu">
            <button class="dropdown-menu-clickable-item lang-item active" data-lang="${lang}" style="--flag-url: url('https://katelyynn.github.io/bleh/fm/flags/${lang}.svg')">
                ${selected_language}
            </button>
            <div class="sep"></div>
        </div>
    `;

    language_options.forEach((language_option) => {
        let button = language_option.querySelector('button');
        button.classList.remove('mimic-link');
        button.classList.add('dropdown-menu-clickable-item', 'lang-item');
        button.setAttribute('data-lang', button.getAttribute('name'));
        button.style.setProperty('--flag-url', `url('https://katelyynn.github.io/bleh/fm/flags/${button.getAttribute('name')}.svg')`);

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
    let site_auth = document.body.querySelector('.site-auth');
    let token = new_auth.querySelector('[name="csrfmiddlewaretoken"]').getAttribute('value');
    if (ff('refreshed_auth_menu')) {
        let auth_menu = tippy(auth_link, {
            theme: 'auth-menu-v2',
            placement: 'top',
            interactive: true,
            interactiveBorder: 10,
            trigger: 'click',

            onShow(instance) {
                page.structure.notifications.setAttribute('data-auth-open', 'true');
                badges = load_badges(auth.name);

                let page_2;
                let side;

                let banner = load_banner(auth.name);

                let status_container;

                instance.setContent(html.node`
                    <div class="auth-menu-v2">
                        <div class="side primary">
                            <div class="auth-menu-header">
                                <div class="avatar">
                                    <img src="${auth.avatar.replace('avatar42s', 'avatar170s')}" alt="${auth.name}" />
                                </div>
                                ${(banner != '') ? html.node`
                                <div class="bg" style="background-image: url(${banner})" />
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
                                ${(settings.profile_shortcut != '') ? () => {
                                    let button = html.node`
                                        <a class="dropdown-menu-clickable-item chibi" data-type="shortcut" data-is-shortcut="true" href="${root}user/${settings.profile_shortcut}">${settings.profile_shortcut}</a>
                                    `;
                                    
                                    tippy(button, {
                                        content: settings.profile_shortcut
                                    });
                                    
                                    return button;
                                } : () => {
                                    let button = html.node`
                                        <button class="dropdown-menu-clickable-item chibi" data-type="shortcut" data-is-shortcut="false" onclick=${() => open_profile_shortcut_window()}>${tl(trans.profile_shortcut.name)}</button>
                                    `;
                
                                    tippy(button, {
                                        content: tl(trans.profile_shortcut.name)
                                    });
                
                                    return button;
                                }}
                            </div>
                        </div>
                        <div class="vertical-sep" />
                        <div class="side" ref=${el => side = el} data-page="1">
                            <div class="side-page" data-page="1">
                                <a class="dropdown-menu-clickable-item" data-type="home" href="${root}music">
                                    ${tl(trans.home)}
                                </a>
                                <a class="dropdown-menu-clickable-item" data-menu-item="library" href="${root}user/${auth.name}/library">
                                    ${tl(trans.library)}
                                </a>
                                <a class="dropdown-menu-clickable-item" data-menu-item="shouts" href="${root}user/${auth.name}/shoutbox">
                                    ${tl(trans.shouts)}
                                </a>
                                <div class="button-combo">
                                    <button class="dropdown-menu-clickable-item" data-menu-item="themes" onclick=${() => toggle_theme()}>
                                        ${tl(trans.themes.name)}
                                    </button>
                                    <div class="button-combo-sep" />
                                    <button class="dropdown-menu-clickable-item chibi" data-type="continue" onclick=${() => {
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
                                                
                                                return html.node`
                                                    <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme=${theme.id} data-type="theme_${theme.formal}" onclick="${() => change_theme_from_menu(theme.id)}">
                                                        ${theme.name}
                                                    </button> 
                                                `;
                                            })}
                                        `);
                                        show_theme_change_in_menu('', page_2);
                                        side.setAttribute('data-page', '2');
                                    }}>
                                        ${tl(trans.more)}
                                    </button>
                                </div>
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
                    ${ff('status_in_menu') ? html.node`
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

                if (page.now.name) render_status_container(page.now);

                live_status().then(status => render_status_container(status))
            },

            onHide(instance) {
                page.structure.notifications.setAttribute('data-auth-open', 'false');
            }
        });
    } else {
        let auth_menu = tippy(auth_link, {
            theme: 'auth-menu',
            content: html.node`
                <a class="dropdown-menu-clickable-item" data-menu-item="profile" href="${root}user/${auth.name}">
                    ${auth.name}
                </a>
                <a class="dropdown-menu-clickable-item" data-menu-item="profile-shortcut" href="${root}user/${settings.profile_shortcut}" data-profile-shortcut="${settings.profile_shortcut}">
                    ${settings.profile_shortcut}
                </a>
                <div class="sep"></div>
                ${(settings.auth_menu_obsessions) ? html.node`
                <a class="dropdown-menu-clickable-item" data-menu-item="obsessions" href="${root}user/${auth.name}/obsessions">
                    ${trans_legacy.en.auth_menu.obsessions}
                </a>
                ` : ''}
                <button class="dropdown-menu-clickable-item" data-menu-item="themes" onclick=${() => toggle_theme()}>
                    <span class="auth-dropdown-item-row">
                        <span class="auth-dropdown-item-left">${tl(trans.themes.name)}</span>
                        <span class="auth-dropdown-item-right" id="theme-value">${tl(trans.themes[settings.theme])}</span>
                    </span>
                </button>
                <button class="dropdown-menu-clickable-item" data-menu-item="language">
                    <span class="auth-dropdown-item-row">
                        <span class="auth-dropdown-item-left">${tl(trans.language)}</span>
                        <span class="auth-dropdown-item-right">${selected_language}</span>
                    </span>
                </button>
                <button class="dropdown-menu-clickable-item" data-menu-item="news" ref=${el => page.state.navigation_menu_news = el} onclick=${() => news()}>
                    ${tl(trans.news)}
                </button>
                <a class="dropdown-menu-clickable-item" data-menu-item="bleh" href="${root}bleh">
                    ${tl(trans.settings)}
                </a>
                <div class="sep"></div>
                <a class="dropdown-menu-clickable-item" data-menu-item="bookmarks" href="${root}music/+bookmarks">
                    ${tl(trans.bookmarks)}
                </a>
                <a class="dropdown-menu-clickable-item" data-menu-item="settings" href="${root}settings">
                    ${tl(trans.settings)}
                </a>
                <form>
                    <input type="hidden" name="csrfmiddlewaretoken" value="${token}">
                    <a class="dropdown-menu-clickable-item" data-menu-item="logout" href="${root}logout">
                        ${tl(trans.logout)}
                    </a>
                </form>
            `,
            placement: 'top',
            interactive: true,
            interactiveBorder: 10,
            trigger: 'click',

            onShow(instance) {
                instance.popper.style.setProperty('--url', `url(${auth.avatar.replace('avatar42s', 'avatar170s')})`);

                let shortcut_item = instance.popper.querySelector('[data-menu-item="profile-shortcut"]');
                if (shortcut_item.getAttribute('data-profile-shortcut') != settings.profile_shortcut) {
                    shortcut_item.setAttribute('data-profile-shortcut', settings.profile_shortcut);
                    shortcut_item.setAttribute('href', `${root}user/${settings.profile_shortcut}`);
                    shortcut_item.textContent = settings.profile_shortcut;
                }

                instance.popper.querySelector('#theme-value').textContent = tl(trans.themes[settings.theme]);

                tippy(instance.popper.querySelector('[data-menu-item="language"]:not([aria-expanded])'), {
                    theme: 'language-menu',
                    content: language_menu,
                    placement: 'left',
                    hideOnClick: false,
                    interactive: true,
                    interactiveBorder: 10
                });

                let theme_menu_item = tippy(instance.popper.querySelector('[data-menu-item="themes"]:not([aria-expanded])'), {
                    theme: 'menu',
                    content: html.node`
                        <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="light" onclick="change_theme_from_menu('light')">
                            ${tl(trans.themes.light)}
                        </button>
                        <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="ink" onclick="change_theme_from_menu('ink')">
                            ${tl(trans.themes.ink)}
                        </button>
                        <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="dark" onclick="change_theme_from_menu('dark')">
                            ${tl(trans.themes.dark)}
                        </button>
                        <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="darker" onclick="change_theme_from_menu('darker')">
                            ${tl(trans.themes.darker)}
                        </button>
                        <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="oled" onclick="change_theme_from_menu('oled')">
                            ${tl(trans.themes.oled)}
                        </button>
                    `,
                    placement: 'left',
                    hideOnClick: false,
                    interactive: true,
                    interactiveBorder: 10,

                    onShow(instance_2) {
                        show_theme_change_in_menu('', instance_2.popper);
                    }
                });
            }
        });
    }
    let container = new_auth.parentElement;
    container.parentElement.removeChild(container);
    auth_link.removeAttribute('aria-controls');
    auth_link.removeAttribute('data-disclose-hover');
    auth_link.removeAttribute('data-disclose-hover--allow-enter-open');
    auth_link.removeAttribute('href');

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
            <a class="btn mobile-control" aria-checked="${page.type == 'inbox'}" data-menu-item="notifications" href="${root}inbox/notifications">
                ${tl(trans.inbox.name)}
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
