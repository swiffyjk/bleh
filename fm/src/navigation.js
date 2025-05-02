import { settings } from "./build/config";
import { auth, page, root } from "./build/page";
import { stored_season } from "./build/seasonal";
import { lang, non_override_lang, trans_legacy, tl, trans } from "./build/trans";
import { load_badges } from "./components/badge";
import { version } from "./main";
import { show_theme_change_in_menu } from "./pages/bleh_config";
import { ff } from "./sku";

export function patch_masthead(element) {
    let masthead_logo = element.querySelector('.masthead-logo');

    if (!masthead_logo)
        return;

    if (!masthead_logo.hasAttribute('data-kate-processed')) {
        masthead_logo.setAttribute('data-kate-processed','true');

        let link = document.createElement('a');
        link.classList.add('home-link');
        link.setAttribute('href', `${root}music`);
        link.innerHTML = `<div class="bleh-logo">${version.brand}</div>`;
        masthead_logo.appendChild(link);

        let version_text = document.createElement('a');
        version_text.classList.add('bleh--version');
        version_text.setAttribute('href', `${root}bleh`);
        version_text.textContent = `${version.build}.${version.sku}${(settings.dev) ? ` (dev)` : ''}`;

        masthead_logo.appendChild(version_text);
    }
}

export function append_nav() {
    if (ff('developer') && !page.structure.indicator) {
        let page_indicator = document.createElement('div');
        page_indicator.classList.add('page-indicator');
        document.documentElement.appendChild(page_indicator);

        page.structure.indicator = page_indicator;
    }

    // 2025-04-14
    let masthead = document.body.querySelector('.masthead');
    let new_auth = masthead.querySelector('.auth-dropdown-menu');
    let auth_link = masthead.querySelector('.masthead-nav-wrap > .site-auth .auth-link');

    if (!auth_link)
        return;

    if (auth_link.hasAttribute('data-bleh'))
        return;
    auth_link.setAttribute('data-bleh', 'true');

    let text = document.createElement('p');
    text.textContent = auth.name;
    auth_link.appendChild(text);

    if (masthead.querySelector('.masthead-pro-wrap'))
        auth.pro = true;
    else
        auth.pro = false;

    let badges = load_badges(auth.name, true);

    if (badges) {
        let badge = document.createElement('span');
        badge.classList.add('label', `user-status--bleh-${badges[0].type}`, `user-status--bleh-user-${auth.name}`, 'auth-badge');
        badge.textContent = badges[0].name;
        auth_link.appendChild(badge);
    } else if (auth.pro) {
        let pro_badge = document.createElement('p');
        pro_badge.classList.add('label', 'user-status-subscriber', 'auth-badge');
        pro_badge.textContent = 'Pro';
        auth_link.appendChild(pro_badge);
    }


    let notif_count = new_auth.querySelector('[data-analytics-label="notifications"] + .auth-avatar-notification-count-badge');
    let inbox_count = new_auth.querySelector('[data-analytics-label="inbox"] + .auth-avatar-notification-count-badge');


    let links = masthead.querySelector('.masthead-nav .navlist-items');
    links.innerHTML = '';

    let notif_container = document.createElement('li');
    notif_container.classList.add('masthead-nav-item');
    notif_container.innerHTML = (`
        <a class="masthead-nav-control" href="${root}inbox/notifications" data-label="notifications">
            ${tl(trans.notifications.name)}
            ${(notif_count) ? `<div class="notification-count-badge"></div>` : ''}
        </a>
    `);

    if (notif_count) {
        notif_count = notif_count.textContent;

        tippy(notif_container, {
            content: tl(trans.notifications.count).replace('{count}', notif_count)
        });

        notif_container.setAttribute('data-count', notif_count);
    } else {
        tippy(notif_container, {
            content: tl(trans.notifications.none)
        });
    }

    links.appendChild(notif_container);

    let inbox_container = document.createElement('li');
    inbox_container.classList.add('masthead-nav-item');
    inbox_container.innerHTML = (`
        <a class="masthead-nav-control" href="${root}inbox" data-label="inbox">
            ${tl(trans.inbox.name)}
            ${(inbox_count) ? `<div class="notification-count-badge"></div>` : ''}
        </a>
    `);

    if (inbox_count) {
        inbox_count = inbox_count.textContent;

        tippy(inbox_container, {
            content: tl(trans.inbox.count).replace('{count}', inbox_count)
        });

        inbox_container.setAttribute('data-count', inbox_count);
    } else {
        tippy(inbox_container, {
            content: tl(trans.inbox.none)
        });
    }

    links.appendChild(inbox_container);

    // what's new?
    let changelog_container = document.createElement('li');
    changelog_container.classList.add('masthead-nav-item');
    changelog_container.innerHTML = (`
        <a class="masthead-nav-control" onclick="_query_changelog()" data-label="changelog">
            ${tl(trans.changelog)}
        </a>
    `);
    tippy(changelog_container, {
        content: tl(trans.changelog)
    });
    links.appendChild(changelog_container);

    // configure bleh
    let bleh_container = document.createElement('li');
    bleh_container.classList.add('masthead-nav-item');
    bleh_container.innerHTML = (`
        <a class="masthead-nav-control" href="${root}bleh${(stored_season.id != 'none') ? '?tab=seasonal' : ''}" data-label="bleh" data-season="${stored_season.id}" data-season-active="${(stored_season.id != 'none') ? 'true' : 'false'}">
            ${(stored_season.id == 'none') ? tl(trans.configure_bleh) : moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}
        </a>
    `);
    if (stored_season.id == 'none') {
        tippy(bleh_container, {
            content: tl(trans.configure_bleh)
        });
    } else {
        page.header.season_tooltip = tippy(bleh_container, {
            theme: 'seasonal-swatch',
            content: (`
                <span class="season-colour-name">${tl(trans.seasonal.listing[stored_season.id])}</span>
                <span class="season-exclusive">${trans_legacy[lang].auth_menu.seasonal_notice}</span>
            `),
            allowHTML: true
        });
    }
    links.appendChild(bleh_container);

    page.header.season = bleh_container.querySelector('a');


    // language
    let selected_language = document.querySelector('.footer-language--active strong')?.textContent;
    let language_options = document.querySelectorAll('.footer-language-form');

    let language_menu = document.createElement('div');
    language_menu.classList.add('language-menu');

    let sel_button = document.createElement('button');
    sel_button.classList.add('dropdown-menu-clickable-item', 'lang-item', 'active');
    sel_button.setAttribute('data-lang', non_override_lang);
    sel_button.style.setProperty('--flag-url', `url('https://katelyynn.github.io/bleh/fm/flags/${non_override_lang}.svg')`);
    sel_button.textContent = selected_language;

    language_menu.appendChild(sel_button);

    language_options.forEach((language_option) => {
        let button = language_option.querySelector('button');
        button.classList.remove('mimic-link');
        button.classList.add('dropdown-menu-clickable-item', 'lang-item');
        button.setAttribute('data-lang', button.getAttribute('name'));
        button.style.setProperty('--flag-url', `url('https://katelyynn.github.io/bleh/fm/flags/${button.getAttribute('name')}.svg')`);

        language_menu.appendChild(language_option);
    });


    // auth menu
    let site_auth = document.body.querySelector('.site-auth');
    let token = new_auth.querySelector('[name="csrfmiddlewaretoken"]').getAttribute('value');
    let auth_menu = tippy(auth_link, {
        theme: 'auth-menu',
        content: (`
            <a class="dropdown-menu-clickable-item" data-menu-item="profile" href="${root}user/${auth.name}">
                ${auth.name}
            </a>
            <a class="dropdown-menu-clickable-item" data-menu-item="profile-shortcut" href="${root}user/${settings.profile_shortcut}" data-profile-shortcut="${settings.profile_shortcut}">
                ${settings.profile_shortcut}
            </a>
            <div class="sep"></div>
            <a class="dropdown-menu-clickable-item" data-menu-item="library" href="${root}user/${auth.name}/library">
                ${tl(trans.library)}
            </a>
            <a class="dropdown-menu-clickable-item" data-menu-item="shouts" href="${root}user/${auth.name}/shoutbox">
                ${tl(trans.shouts)}
            </a>
            ${(settings.auth_menu_obsessions) ? (`
            <a class="dropdown-menu-clickable-item" data-menu-item="obsessions" href="${root}user/${auth.name}/obsessions">
                ${trans_legacy[lang].auth_menu.obsessions}
            </a>
            `) : ''}
            <button class="dropdown-menu-clickable-item" data-menu-item="themes" onclick="toggle_theme()">
                <span class="auth-dropdown-item-row">
                    <span class="auth-dropdown-item-left">${tl(trans.themes.name)}</span>
                    <span class="auth-dropdown-item-right" id="theme-value">${tl(trans.themes[settings.theme])}</span>
                </span>
            </button>
            <button class="dropdown-menu-clickable-item" data-menu-item="language">
                <span class="auth-dropdown-item-row">
                    <span class="auth-dropdown-item-left">${tl(trans.language)}</span>
                    <span class="auth-dropdown-item-right" id="theme-value">${selected_language}</span>
                </span>
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
        `),
        allowHTML: true,
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
                content: (`
                    ${language_menu.innerHTML}
                `),
                allowHTML: true,
                placement: 'left',
                hideOnClick: false,
                interactive: true,
                interactiveBorder: 10
            });

            let theme_menu_item = tippy(instance.popper.querySelector('[data-menu-item="themes"]:not([aria-expanded])'), {
                theme: 'menu',
                content: (`
                    <button class="dropdown-menu-clickable-item theme-item-in-menu" data-bleh-theme="light" onclick="change_theme_from_menu('light')">
                        ${tl(trans.themes.light)}
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
                `),
                allowHTML: true,
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
    let container = new_auth.parentElement;
    container.parentElement.removeChild(container);
    auth_link.removeAttribute('aria-controls');
    auth_link.removeAttribute('data-disclose-hover');
    auth_link.removeAttribute('data-disclose-hover--allow-enter-open');
    auth_link.removeAttribute('href');
}