//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {sanitise} from "../build/tools";
import {tl, trans, trans_legacy} from "../build/trans";
import {artist_title, correct_item_by_artist} from "../components/lotus";
import {register_menu} from "../components/menu";
import {bleh_music_page_charts, bleh_top_listeners, show_your_scrobbles} from "../components/music";
import {checkup_page_structure} from "../components/structure";
import {register_background, update_page} from "../page";
import {ff} from "../sku";
import {bleh_gallery_list, bleh_gallery_upload} from "./gallery";
import {bleh_tags_mini} from "./tag";
import {bleh_wiki, bleh_wiki_editor, bleh_wiki_history} from "./wiki";
import {html} from "lighterhtml";
import {expand_avatar} from "../avatar.js";
import {other_listener} from "../components/profile_shortcut.js";
import {setting} from "../components/settings.js";

export function bleh_artists() {
    let artist_header = document.body.querySelector('.header-new--artist');

    page.name = artist_header.querySelector('.header-new-title').textContent;
    page.sister = '';

    artist_title();

    let is_subpage = artist_header.classList.contains('header-new--subpage');


    // without pro theres two containers
    if (auth.pro) {
        // pro

        page.structure.container = document.body.querySelector('.page-content:not(.visible-xs, :has(.content-top-lower-row, a + .js-gallery-heading))');
    } else {
        // not pro

        if (!is_subpage) {
            // normal, is there an ad then a container?
            page.structure.container = document.body.querySelector('.full-bleed-ad-container + .page-content:not(.visible-xs)');

            // death grips for some reason
            if (!page.structure.container)
                page.structure.container = document.body.querySelector('.page-content');
        } else {
            page.structure.container = document.body.querySelector('.page-content:not(.visible-xs, :has(.content-top-lower-row, a + .js-gallery-heading))');
        }
    }
    try {
        page.structure.row = page.structure.container.querySelector('.row');

        if (!is_subpage)
            page.structure.main = page.structure.row.querySelector('.col-main.buffer-standard');
        else
            page.structure.main = page.structure.row.querySelector('.col-main');

        if (auth.pro) {
            page.structure.side = page.structure.row.querySelector('.col-sidebar:not(.masonry-right)');
        } else {
            page.structure.side = page.structure.row.querySelector('.col-sidebar:not(.section-with-separator--col)');
        }
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure(is_subpage, artist_header);

    let katsune = ff('katsune');
    let featured_items = artist_header.querySelector('.artist-header-featured-items');

    if (ff('refreshed_music_nav')) {
        let avatar = artist_header.querySelector('.header-new-background-image');
        let title = artist_header.querySelector('.header-new-title');
        let on_tour = artist_header.querySelector('.header-new-on-tour');
        let position = artist_header.querySelector('.header-new-chart-position-number');

        let multi_info_box;
        let redesigned_artist_header = html.node`
            <section class="redesigned-header redesigned-artist-header no-background">
                <div class="avatar-side">
                    ${(avatar) ? html.node`
                    <img src="${avatar.getAttribute('content').replace('/ar0/', '/avatar300s/')}">
                    <a class="bleh--avatar-clickable-link"></a>
                    ` : html.node`<img class="missing-artist">`}
                </div>
                <div class="info-side">
                    ${(page.multi) ? html.node`
                    <div class="sub-text">
                        ${tl(trans.artists)}
                        <div class="info-tip" ref=${el => multi_info_box = el}>
                            <div class="bleh-icon bleh-info-icon"></div>
                        </div>
                    </div>
                    ` : html.node`
                    <div class="sub-text">${tl(trans.artist)}</div>
                    `}
                    <div class="title-container" data-multi="${page.multi}">
                        <h1>${title}</h1>
                        ${(position) ? position : ''}
                        ${(on_tour) ? on_tour : ''}
                    </div>
                </div>
            </section>
        `;

        if (multi_info_box) {
            tippy(multi_info_box, {
                content: tl(trans.artists_tooltip)
            });
        }

        if (position) {
            tippy(position, {
                content: trans_legacy.en.charts.view
            });
        }

        let bg;

        if (avatar)
            bg = register_background(avatar.getAttribute('content'));
        else
            bg = register_background(null);

        page.structure.container.insertBefore(redesigned_artist_header, page.structure.container.firstElementChild);
        artist_header.classList.add('legacy-header');


        let avatar_side = redesigned_artist_header.querySelector('.avatar-side');
        let avatar_link = avatar_side.querySelector('a');

        if (avatar != null && avatar_link != null) {
            if (settings.default_avatar_action == 'expand' && avatar != null)
                avatar_link.setAttribute('onclick', `_expand_avatar('${avatar.getAttribute('content')}')`);
            else if (settings.default_avatar_action == 'gallery')
                avatar_link.href = `${root}music/${sanitise(page.name)}/+images`;

            let menu = tippy(avatar_side, {
                theme: 'context-menu',
                content: html.node`
                    ${(avatar != null) ? html.node`
                    <button class="dropdown-menu-clickable-item" onclick=${() => expand_avatar(avatar.getAttribute('content'))} data-menu-item="expand">
                        ${tl(trans.expand)}
                    </button>
                    ` : ''}
                    <a class="dropdown-menu-clickable-item" href="${root}music/${sanitise(page.name)}/+images" data-menu-item="gallery">
                        ${tl(trans.photos)}
                    </a>
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}bleh?tab=customise" data-menu-item="settings">
                        ${tl(trans.settings)}
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

            register_menu(avatar_side, menu);
        }

        if (!is_subpage) {
            let view_button = redesigned_artist_header.querySelector('.view-all-button');

            if (view_button) {
                let view_menu = tippy(view_button, {
                    theme: 'context-menu',
                    content: html.node`
                        <a class="dropdown-menu-clickable-item" href="${root}bleh?tab=customise" data-menu-item="settings">
                            ${tl(trans.settings)}
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

                register_menu(view_button, view_menu);
            }
        }
    }

    if (!is_subpage) {
        show_your_scrobbles();

        bleh_music_page_charts();

        bleh_tags_mini();


        let top_tracks = page.structure.main.querySelector('#top-tracks');
        if (top_tracks) {
            let settings_btn;

            let top = top_tracks.querySelector('.section-controls');
            top.classList = 'top-container';

            let header = top.querySelector('h3');

            let select_btn = top.querySelector('.dropdown-menu-clickable-button');

            select_btn.classList.add('btn', 'view-item', 'interact-item', 'select-button', 'link-select');
            select_btn.classList.remove('dropdown-menu-clickable-button');

            let play = top.querySelector('.section-playlink');

            play.classList.add('btn', 'view-item', 'interact-item', 'radio');
            play.classList.remove('section-playlink', 'hover-section-control');
            play.setAttribute('data-type', 'play');

            header.after(html.node`
                <div class="accompany view-buttons blend blend-v2">
                    ${select_btn}
                </div>
                <div class="view-buttons blend blend-v2">
                    ${play}
                    <button class="panel-settings-button btn view-item interact-item left-icon" data-type="settings" ref=${el => settings_btn = el}>
                        ${tl(trans.settings)}
                    </button>
                </div>
            `);

            tippy(settings_btn, {
                theme: 'window',
                content: html.node`
                    <div class="dialog-settings">
                        ${setting({id: 'format_guest_features'})}
                        ${setting({id: 'show_guest_features'})}
                    </div>
                `,
                placement: 'bottom',
                interactive: true,
                interactiveBorder: 10,
                trigger: 'click'
            });
        }

        let top_albums = page.structure.main.querySelector('#top-albums');
        if (top_albums) {
            let top = top_albums.querySelector('.section-controls');
            top.classList = 'top-container';

            let header = top.querySelector('h3');

            let select_btn = top.querySelector('.dropdown-menu-clickable-button');

            select_btn.classList.add('btn', 'view-item', 'interact-item', 'select-button', 'link-select');
            select_btn.classList.remove('dropdown-menu-clickable-button');

            header.after(html.node`
                <div class="accompany view-buttons blend blend-v2">
                    ${select_btn}
                </div>
            `);
        }


        if (katsune && featured_items) {
            let featured_panel = html.node`
                <section class="featured-items-panel">
                    ${Array.from(featured_items.querySelectorAll('li')).map(item => {
                        item.classList.remove('artist-header-featured-items-item-wrap--video-thumbnail');
                        let type = item.getAttribute('itemprop');
                        
                        let text = tl(trans.latest_album);
                        if (type == 'track')
                            text = tl(trans.popular_now);
                        
                        let header = item.querySelector('.artist-header-featured-items-item-header');
                        header.parentElement.removeChild(header);
                        
                        let name = correct_item_by_artist(item.querySelector('.artist-header-featured-items-item-name').textContent, page.sister);
                        let aux = item.querySelector('.artist-header-featured-items-item-aux-text')?.textContent.trim();
                        let link = item.querySelector('.link-block-cover-link')?.getAttribute('href');
                        let img = item.querySelector('img')?.src;
                        
                        if (type == 'track')
                            img = img.replace('0.jpg', 'mqdefault.jpg');
                        
                        return html.node`
                            <div class="featured-artist-item">
                                <div class="sub-text normal" data-type=${type}>
                                    <span class="bleh-icon" style="--icon: var(--mask)" />
                                    ${text}
                                </div>
                                <div class="source-album js-link-block link-block" data-type=${type}>
                                    <div class="source-album-art">
                                        <span class="cover-art">
                                            <img src=${img} alt=${name} />
                                        </span>
                                    </div>
                                    <div class="source-album-details">
                                        <h4 class="source-album-name">
                                            <a href=${link}>${name}</a>
                                        </h4>
                                        <p class="source-album-stats">${aux}</p>
                                    </div>
                                    <a class="js-link-block-cover-link link-block-cover-link" href=${link} tabindex="-1" aria-hidden="true" />
                                </div>
                            </div>
                        `;
                    })}
                </section>
            `;

            /*let listen_panel = page.structure.side.querySelector('.listen-panel');
            if (listen_panel)
                listen_panel.after(featured_panel);
            else
                page.structure.side.insertBefore(featured_panel, page.structure.side.firstElementChild);*/

            page.structure.main.querySelector('.top-overview-panel').after(featured_panel);
        }
    } else {
        let btn_add = page.structure.side.querySelector('.add-button');
        if (btn_add != null)
            btn_add.setAttribute('data-page-subpage', page.subpage);

        if (page.subpage == 'images_image-upload')
            bleh_gallery_upload();
        else if (page.subpage == 'images_overview')
            bleh_gallery_list();
        else if (page.subpage == 'wiki_overview')
            bleh_wiki();
        else if (page.subpage == 'wiki_history')
            bleh_wiki_history();
        else if (page.subpage == 'wiki_edit')
            bleh_wiki_editor();
        else if (page.subpage == 'listeners_overview')
            bleh_top_listeners();
        else if (page.subpage == 'listeners_you-know')
            bleh_listeners();
        else if (page.subpage == 'tracks')
            bleh_artist_tracks();
        else if (page.subpage == 'albums')
            bleh_artist_albums();
    }

    log('status is', 'page', 'info', page);
    update_page();
}

function bleh_artist_tracks() {
    let top_tracks = page.structure.main.querySelector('section');
    if (top_tracks) {
        let settings_btn;

        let top = top_tracks.querySelector('.section-controls');
        top.classList = 'top-container';

        let header = top.querySelector('h2');
        header.classList.remove('subpage-title');

        let select_btn = top.querySelector('.dropdown-menu-clickable-button');

        select_btn.classList.add('btn', 'view-item', 'interact-item', 'select-button', 'link-select');
        select_btn.classList.remove('dropdown-menu-clickable-button');

        header.after(html.node`
                <div class="accompany view-buttons blend blend-v2">
                    ${select_btn}
                </div>
                <div class="view-buttons blend blend-v2">
                    <button class="panel-settings-button btn view-item interact-item left-icon" data-type="settings" ref=${el => settings_btn = el}>
                        ${tl(trans.settings)}
                    </button>
                </div>
            `);

        tippy(settings_btn, {
            theme: 'window',
            content: html.node`
                    <div class="dialog-settings">
                        ${setting({id: 'format_guest_features'})}
                        ${setting({id: 'show_guest_features'})}
                    </div>
                `,
            placement: 'bottom',
            interactive: true,
            interactiveBorder: 10,
            trigger: 'click'
        });
    }
}

function bleh_artist_albums() {
    let top_albums = page.structure.main.querySelector('#artist-albums-section');
    if (top_albums) {
        let top = top_albums.querySelector('.section-controls');
        top.classList = 'top-container';

        let header = top.querySelector('h3');

        let select_btn = top.querySelector('.dropdown-menu-clickable-button');

        select_btn.classList.add('btn', 'view-item', 'interact-item', 'select-button', 'link-select');
        select_btn.classList.remove('dropdown-menu-clickable-button');

        header.after(html.node`
            <div class="accompany view-buttons blend blend-v2">
                ${select_btn}
            </div>
        `);
    }
}

function bleh_listeners() {
    // i could just render away the ad here but courtesy
    page.structure.side.appendChild(html.node`
        <section class="side-actions">
            <a class="btn side-action" data-type="profile" href="${root}user/${auth.name}/library/music/${sanitise(page.name)}">
                ${auth.name}
            </a>
            ${settings.profile_shortcut != '' ? html.node`
            <a class="btn side-action" data-type="profile_shortcut" href="${root}user/${settings.profile_shortcut}/library/music/${sanitise(page.name)}">
                ${settings.profile_shortcut}
            </a>
            ` : ''}
            <div class="sep" />
            <button class="btn side-action" data-type="add" onclick=${() => other_listener(sanitise(page.name))}>
                ${tl(trans.custom)}
            </button>
        </section>
    `);
}
