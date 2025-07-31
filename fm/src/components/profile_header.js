//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {sponsor_list} from "../build/sponsor";
import {sanitise} from "../build/tools";
import {tl, trans} from "../build/trans";
import {ff} from "../sku";
import {compare} from './compare';
import {correct_artist} from "./lotus";
import {open_profile_shortcut_window, set_profile_as_shortcut} from './profile_shortcut';
import {html} from "lighterhtml";
import {collage} from "./collage.js";
import {sponsor} from "../sponsor.js";
import {redirect} from "./music.js";

export function redesign_profile_header(is_own_profile, is_following) {
    let base_header = document.body.querySelector('.header-info-secondary');
    if (!base_header) return;

    let katsune = ff('katsune');


    // taste
    let taste = '';
    let taste_percentage = '';
    let taste_artists = [];

    if (!is_own_profile && page.name != sponsor_list.sponsor_account) {
        let taste_meter = base_header.querySelector('.tasteometer');

        if (taste_meter) {
            taste = taste_meter.classList[1].replace('tasteometer-compat-', '');

            let artists = taste_meter.querySelectorAll('a');
            artists.forEach((artist) => {
                taste_artists.push(correct_artist(artist.getAttribute('title')));
            });

            taste_percentage = taste_meter.querySelector('.tasteometer-viz').getAttribute('title');
            if (taste_percentage == '99%')
                taste_percentage = '100%';
        }
    }


    // create new
    let side_sep = html.node`<div class="sep"></div>`;

    let about_me = page.structure.container.querySelector('.about-me-sidebar');

    let profile_header;
    if (about_me) {
        profile_header = html.node`
            <div class="side-actions" />
        `;
    } else {
        profile_header = html.node`
            <section class="side-actions" />
        `;
    }

    if (!is_own_profile && page.name != sponsor_list.sponsor_account) {
        // follow
        let follow_wrap = document.body.querySelector('.header-avatar .class > div');

        if (follow_wrap) {
            let follow_btn = follow_wrap.querySelector('button');
            follow_btn.classList.add('btn', 'side-action');
            follow_btn.classList.remove('toggle-button', 'header-follower-btn');
            follow_btn.setAttribute('data-type', 'follow');
            profile_header.appendChild(follow_wrap);

            if (is_following)
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
                    link: msg_button.getAttribute('href')
                });
            } else {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'sponsor',
                    link: () => sponsor(),
                    action: 'button'
                });
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'message_sponsor',
                    link: msg_button.getAttribute('href'),
                    full: true
                });
            }
        }


        if (page.name != sponsor_list.sponsor_account) {
            if (ff('compare')) {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'compare',
                    link: `${root}bleh/minis/compare?profile=${page.name}`
                });
            }

            if (ff('charts')) {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'collage',
                    link: `${root}bleh/minis/collage?profile=${page.name}`,
                    text: tl(trans.collage),
                    updated: true
                });
            }

            if (settings.profile_shortcut != page.name) {
                page.state.profile_shortcut_button = create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'shortcut',
                    link: () => set_profile_as_shortcut(),
                    action: 'button'
                });
            } else {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'shortcut',
                    action: 'button'
                });
            }
        }


        if (page.structure.container.querySelector('.user-status-staff')) {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'support',
                link: 'https://support.last.fm'
            });
        }
    } else {
        // edit
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'edit',
            link: `${root}settings`
        });
        if (ff('minis')) {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'minis',
                link: `${root}bleh/minis`,
                new_release: true
            });
        } else {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'labs',
                link: `${root}labs`,
                tooltip: (`
                    <strong>${tl(trans.labs_by_last)}</strong>
                    <p>${tl(trans.labs_by_last.tagline)}</p>
                `),
                tooltip_style: 'stack',
                allow_html: true
            });
        }
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'obsession',
            link: `${root}user/${page.name}/obsessions/set`
        });

        if (ff('charts')) {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'collage',
                link: `${root}bleh/minis/collage`,
                text: tl(trans.collage),
                updated: true
            });
        }
    }

    if (about_me) {
        about_me.appendChild(side_sep);
        about_me.appendChild(profile_header);
    } else {
        if (!page.mobile)
            page.structure.side.insertBefore(profile_header, page.structure.side.firstElementChild);
        else
            page.structure.main.insertBefore(profile_header, page.structure.main.firstElementChild);
    }

    let listen_container = page.structure.row.querySelector('.listen-panel');

    if (!is_own_profile && page.name != sponsor_list.sponsor_account && katsune) {
        if (taste == '') {
            listen_container.appendChild(html.node`
                <div class="loading-data-container">
                    <div class="loading-data-text error">${tl(trans.missing_component)}</div>
                </div>
            `);

            return;
        }

        let taste_wrap = html.node`
            <div class="btn listen-item ${taste != 'super' ? 'icon' : ''} taste">
                <div class="bleh-icon taste-overlay colourful" data-taste=${taste} />
                <div class="span">
                    <img class="view-item-avatar" src=${auth.avatar} alt=${auth.name}>
                    <img class="view-item-avatar" src=${page.avatar} alt=${page.name}>
                    <div class="info">
                        <h3>${
                            html.node([
                                tl(trans.you_share_count_with).replace('{c}', `<span class="colourful" data-taste=${taste}>${taste_percentage}</span>`)
                            ])}</h3>
                        <p>
                            ${(taste_artists.length == 1) ? tl(trans.you_share_count_with.one).replace('{artist}', taste_artists[0]) : ''}
                            ${(taste_artists.length == 2) ? tl(trans.you_share_count_with.two).replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]) : ''}
                            ${(taste_artists.length == 3) ? tl(trans.you_share_count_with.three).replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]).replace('{artist3}', taste_artists[2]) : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;

        tippy(taste_wrap, {
            theme: 'stack',
            content: html.node`
                <span>
                    ${tl(trans.taste_similarity)}
                </span>
                <div class="hint">${tl(trans.click_for_more_options)}</div>
            `,
        });

        if (taste_artists.length > 1) {
            tippy(taste_wrap, {
                theme: 'context-menu',
                content: html.node`
                    <h4 class="menu-header">${tl(trans.compare_plays)}</h4>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${redirect()}${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${page.avatar}" alt="${page.name}">${taste_artists[0]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${redirect()}${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[0]}
                    </a>
                    ${(taste_artists.length >= 2) ? html.node`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${redirect()}${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${page.avatar}" alt="${page.name}">${taste_artists[1]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${redirect()}${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[1]}
                    </a>
                    ` : ''}
                    ${(taste_artists.length >= 3) ? html.node`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${redirect()}${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${page.avatar}" alt="${page.name}">${taste_artists[2]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${redirect()}${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[2]}
                    </a>
                    ` : ''}
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" data-type="compare" href="${root}bleh/minis/compare?profile=${page.name}">${tl(trans.compare)}</a>
                `,
                trigger: 'click',
                placement: 'bottom',
                interactive: true,
                interactiveBorder: 10,
                offset: [0, 0]
            });
        }

        const row = listen_container.querySelector('.listener-row');
        row.after(taste_wrap);
    }
}

export function create_profile_top_item(parent, {name, link, text='', type, new_release = false, updated = false, action='', tooltip='', allow_html=false, tooltip_theme=''}) {
    log(`creating top item of ${name}, ${link}, ${text}`, 'profile');

    let side_action;
    if (action === 'button') {
        side_action = html.node`
            <button
                class="btn side-action"
                data-type=${type}
                onclick=${link}
            >
                ${tl(trans[type])}
                ${(new_release) ? html.node`<div class="new-badge">${tl(trans.new)}</div>` : ''}
                ${(updated) ? html.node`<div class="new-badge">${tl(trans.updated)}</div>` : ''}
            </button>
        `;
    } else {
        side_action = html.node`
            <a
                class="btn side-action"
                data-type=${type}
                href=${link}
            >
                ${tl(trans[type])}
                ${(new_release) ? html.node`<div class="new-badge">${tl(trans.new)}</div>` : ''}
                ${(updated) ? html.node`<div class="new-badge">${tl(trans.updated)}</div>` : ''}
            </a>
        `;
    }

    if (type == 'shortcut') {
        if (name == settings.profile_shortcut) {
            side_action.setAttribute('data-is-shortcut', 'true');
        } else {
            side_action.setAttribute('data-is-shortcut', 'false');
        }

        side_action.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            open_profile_shortcut_window();
        });
    }

    parent.appendChild(side_action);
    return side_action;
}
