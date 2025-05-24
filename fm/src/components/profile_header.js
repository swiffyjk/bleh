import { settings } from "../build/config";
import { log } from "../build/log";
import { auth, page, root } from "../build/page";
import { sponsor_list } from "../build/sponsor";
import { clean_number, sanitise } from "../build/tools";
import { lang, trans, tl } from "../build/trans";
import { ff } from "../sku";
import { compare } from './compare';
import { correct_artist } from "./lotus";
import { register_menu } from "./menu";
import { open_profile_shortcut_window } from './profile_shortcut';
import { html } from "lighterhtml";

unsafeWindow._toggle_profile_header = function(button) {
    let current = settings.profile_header_expand;

    settings.profile_header_expand = !current;
    button.setAttribute('aria-expanded', !current);

    document.documentElement.setAttribute('data-bleh--profile_header_expand', !current);

    // save to settings
    localStorage.setItem('bleh', JSON.stringify(settings));
}

export function redesign_profile_header(is_own_profile, is_following) {
    let base_header = document.body.querySelector('.header-info-secondary');
    if (!base_header) return;

    let katsune = ff('katsune');

    let header_meta = base_header.querySelector('.header-metadata');
    header_meta.classList.add('profile-header-metadata-legacy');

    // acquire info
    let scrobbles = 0;
    let average = 0;
    let artists = 0;
    let loved = 0;

    if (!katsune) {
        let metadata = header_meta.querySelectorAll('.header-metadata-display');
        metadata.forEach((item, index) => {
            if (index == 0) {
                let para = item.querySelector('p');

                scrobbles = clean_number(para.textContent.trim());
                average = para.getAttribute('title');
            } else if (index == 1) {
                artists = clean_number(item.textContent.trim());
            } else if (index == 2) {
                loved = clean_number(item.textContent.trim());
            }
        });
    }


    // taste
    let taste = '';
    let taste_percentage = '';
    let taste_artists = [];
    let profile_avi = '';

    if (!is_own_profile && page.name != sponsor_list.sponsor_account) {
        let taste_meter = base_header.querySelector('.tasteometer');

        taste = taste_meter.classList[1].replace('tasteometer-compat-', '');

        let artists = taste_meter.querySelectorAll('a');
        artists.forEach((artist) => {
            taste_artists.push(correct_artist(artist.getAttribute('title')));
        });

        profile_avi = document.body.querySelector('.header-avatar img');
        if (profile_avi != null)
            profile_avi = profile_avi.getAttribute('src');
        else
            profile_avi = '';

        taste_percentage = taste_meter.querySelector('.tasteometer-viz').getAttribute('title');
        if (taste_percentage == '99%')
            taste_percentage = '100%';
    }


    // create new
    let profile_header = document.createElement('section');
    profile_header.classList.add('side-actions');

    if (!is_own_profile && page.name != sponsor_list.sponsor_account) {
        // follow
        let follow_wrap = document.body.querySelector('.header-avatar .class > div');

        if (follow_wrap != null) {
            let follow_btn = follow_wrap.querySelector('button');
            follow_btn.classList.add('btn', 'side-action');
            follow_btn.classList.remove('toggle-button', 'header-follower-btn');
            follow_btn.setAttribute('data-type', 'follow');
            profile_header.appendChild(follow_wrap);

            if (follow_wrap.getAttribute('data-toggle-button-current-state') == 'followed')
                follow_btn.setAttribute('data-followed', 'true');

            let mutual_text = document.createElement('i');
            mutual_text.textContent = tl(trans.following_mutuals);
            follow_btn.appendChild(mutual_text);

            if (!katsune)
                tippy(follow_btn, {
                    content: follow_btn.textContent
                });

            follow_btn.addEventListener('click', () => {
                window.setTimeout(() => {
                    follow_btn._tippy.setContent(follow_btn.textContent);
                }, 50);
            });
        } else {
            // ignore list
            let follow_placeholder = document.createElement('button');
            follow_placeholder.classList.add('btn', 'side-action');
            follow_placeholder.setAttribute('data-type', 'follow');
            follow_placeholder.textContent = tl(trans.blocked);

            follow_placeholder.setAttribute('disabled', 'true');
            follow_placeholder.setAttribute('data-ignored', 'true');

            if (!katsune)
                tippy(follow_placeholder, {
                    content: tl(trans.blocked)
                });

            profile_header.appendChild(follow_placeholder);
        }
    }

    if (!is_own_profile) {
        // message
        let msg_button = document.body.querySelector('.header-message-user');
        if (msg_button) {
            if (page.name != sponsor_list.sponsor_account) {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'message',
                    link: msg_button.getAttribute('href'),
                    katsune: katsune
                });
            } else {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'sponsor',
                    link: '_sponsor()',
                    full: true,
                    action: 'button',
                    katsune: katsune
                });
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'message_sponsor',
                    link: msg_button.getAttribute('href'),
                    full: true,
                    katsune: katsune
                });
            }
        }


        if (page.name != sponsor_list.sponsor_account) {
            if (ff('compare')) {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'compare',
                    link: '_compare()',
                    action: 'button',
                    katsune: katsune
                });
            }

            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'shortcut',
                link: `_set_profile_as_shortcut(this, '${page.name}')`,
                action: 'button',
                katsune: katsune
            });
        }


        if (page.structure.container.querySelector('.user-status-staff')) {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'support',
                link: 'https://support.last.fm',
                katsune: katsune
            });
        }
    } else {
        // edit
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'edit',
            link: `${root}settings`,
            katsune: katsune
        });
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'labs',
            link: `${root}labs`,
            katsune: katsune,
            tooltip: (`
                <strong>${tl(trans.labs_by_last)}</strong>
                <p>${tl(trans.labs_by_last.tagline)}</p>
            `),
            tooltip_style: 'stack',
            allow_html: true
        });
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'obsession',
            link: `${root}user/${page.name}/obsessions/set`,
            katsune: katsune
        });
    }

    let listen_container = page.structure.row.querySelector('.listen-panel');

    if (!is_own_profile && page.name != sponsor_list.sponsor_account && katsune) {
        let taste_wrap = document.createElement('div');
        taste_wrap.classList.add('btn', 'listen-item', 'icon');

        taste_wrap.innerHTML = (`
            <div class="span">
                <img class="view-item-avatar" src="${auth.avatar}">
                <img class="view-item-avatar" src="${profile_avi}">
                <div class="info">
                    <h3>${tl(trans.you_share_count_with).replace('{c}', `<span class="colourful" data-taste="${taste}">${taste_percentage}</span>`)}</h3>
                    <p>
                        ${(taste_artists.length == 1) ? tl(trans.you_share_count_with.one).replace('{artist}', taste_artists[0]) : ''}
                        ${(taste_artists.length == 2) ? tl(trans.you_share_count_with.two).replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]) : ''}
                        ${(taste_artists.length == 3) ? tl(trans.you_share_count_with.three).replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]).replace('{artist3}', taste_artists[2]) : ''}
                    </p>
                </div>
            </div>
            <div class="taste-bar colourful" data-taste="${taste}">
                <div class="taste-bar-fill" style="width: ${taste_percentage}"></div>
            </div>
        `);

        tippy(taste_wrap, {
            theme: 'stack',
            content: html.node`
                <span>
                    ${tl(trans.taste_similarity)}
                </span>
                <div class="hint">${tl(trans.right_click_for_more_options)}</div>
            `,
        });

        listen_container.appendChild(taste_wrap);

        if (taste_artists.length > 1) {
            let menu = tippy(taste_wrap, {
                theme: 'context-menu',
                content: (html.node`
                    <h4 class="menu-header">${tl(trans.compare_plays)}</h4>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[0]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[0]}
                    </a>
                    ${(taste_artists.length >= 2) ? html.node`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[1]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[1]}
                    </a>
                    ` : ''}
                    ${(taste_artists.length >= 3) ? html.node`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[2]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[2]}
                    </a>
                    ` : ''}
                `),
                placement: 'right-start',
                trigger: 'manual',
                interactive: true,
                interactiveBorder: 10,
                offset: [0, 0]
            });

            register_menu(taste_wrap, menu);
        }
    }

    if (!page.mobile)
        page.structure.side.insertBefore(profile_header, page.structure.side.firstElementChild);
    else
        page.structure.main.insertBefore(profile_header, page.structure.main.firstElementChild);
}

export function create_profile_top_item(parent, {name, link, text='', type, taste='', artists=[], avi='', percent='', action='', tooltip='', allow_html=false, tooltip_theme='', full=false, primary=false, katsune=false, mini=false}) {
    log(`creating top item of ${name}, ${link}, ${text}`, 'profile');

    let listen_item = document.createElement((action != 'button') ? 'a' : 'button');
    listen_item.classList.add('btn', 'side-action');
    listen_item.setAttribute('data-type', type);

    if (mini)
        listen_item.classList.add('mini');

    if (action != 'button' && type != 'going' && type != 'maybe' && type != 'total') {
        listen_item.setAttribute('href', link);
        //listen_item.setAttribute('target', '_blank');
    } else if (type != 'going' && type != 'maybe' && type != 'total') {
        listen_item.setAttribute('onclick', link);
    }

    if (primary)
        listen_item.classList.add('primary');

    if (type != 'taste') {
        text = text.toLocaleString(lang);
        listen_item.innerHTML = text;
    }

    if (katsune) {
        full = true;
    }

    if (full) {
        listen_item.classList.add('profile-top-item-full');
        listen_item.textContent = tl(trans[type]);
    }

    if (type == 'compare') {
        listen_item.innerHTML = `${tl(trans.compare)}<div class="new-badge">${tl(trans.new)}</div>`;
    }

    parent.appendChild(listen_item);

    if (type == 'shortcut') {
        listen_item.textContent = tl(trans.shortcut);

        if (name == settings.profile_shortcut) {
            listen_item.setAttribute('data-is-shortcut', 'true');
            listen_item.removeAttribute('onclick');
        } else {
            listen_item.setAttribute('data-is-shortcut', 'false');
        }

        listen_item.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            open_profile_shortcut_window();
        });

        return;
    }

    if (katsune && !mini)
        return;

    if (tooltip == '')
        tippy(listen_item, {
            content: tl(trans[type])
        });
    else
        tippy(listen_item, {
            content: tooltip,
            allowHTML: allow_html,
            theme: tooltip_theme
        });
}