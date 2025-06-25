//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html, render} from "lighterhtml";
import {patch_avatar} from "../avatar";
import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {clean_number, return_artist_from_track, sanitise} from "../build/tools";
import {lang, tl, trans, trans_legacy} from "../build/trans";
import {prep_chart_colours} from "../chart";
import {refresh_all} from "../config";
import {create_divider} from "../pages/gallery";
import {ff} from "../sku";
import {parse_scrobbles_as_rank} from "./colourful_counts";
import {correct_item_by_artist} from "./lotus";
import {register_menu} from "./menu";
import {other_listener} from "./profile_shortcut";

unsafeWindow._other_listener = function(id) {
    other_listener(id);
}

export function show_your_scrobbles() {
    let katsune = ff('katsune');
    show_numbers_on_side(page.type);

    // commonly nsbm pages are stripped of all social interaction and only have three tabs,
    // this is a simple way to detect it
    let page_is_blocked = !page.structure.main.querySelector('#shoutbox');

    if (page.subpage == 'overview') {
        let tabs = document.createElement('nav');
        tabs.classList.add('navlist', 'secondary-nav', 'navlist--more', 'redesigned-navigation');

        if (page.type == 'artist') {
            tabs.appendChild(html.node`
                <ul class="navlist-items">
                    <li class="navlist-item secondary-nav-item secondary-nav-item--overview">
                        <a class="secondary-nav-item-link secondary-nav-item-link--active" href="${window.location.href}">
                            ${tl(trans.overview)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--tracks">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+tracks">
                            ${tl(trans.tracks)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--albums">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+albums">
                            ${tl(trans.albums)}
                        </a>
                    </li>
                    ${(!page_is_blocked) ? html.node`
                    <li class="navlist-item secondary-nav-item secondary-nav-item--images">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+images">
                            ${tl(trans.photos)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--similar">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+similar">
                            ${tl(trans.similar_artists)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--wiki">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+wiki">
                            ${tl(trans.biography)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--listeners">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+listeners">
                            ${tl(trans.listeners)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--shoutbox">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+shoutbox">
                            ${tl(trans.shouts)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--events">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+events">
                            ${tl(trans.events)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--tags">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+tags">
                            ${tl(trans.tags)}
                        </a>
                    </li>
                    ` : ''}
                </ul>
            `);
        } else if (page.type == 'album') {
            tabs.appendChild(html.node`
                <ul class="navlist-items">
                    <li class="navlist-item secondary-nav-item secondary-nav-item--overview">
                        <a class="secondary-nav-item-link secondary-nav-item-link--active" href="${window.location.href}">
                            ${tl(trans.overview)}
                        </a>
                    </li>
                    ${(!page_is_blocked) ? html.node`
                    <li class="navlist-item secondary-nav-item secondary-nav-item--wiki">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+wiki">
                            ${tl(trans.wiki)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--images">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+images">
                            ${tl(trans.artwork)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--shoutbox">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+shoutbox">
                            ${tl(trans.shouts)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--tags">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+tags">
                            ${tl(trans.tags)}
                        </a>
                    </li>
                    ` : ''}
                </ul>
            `);
        } else if (page.type == 'track') {
            tabs.appendChild(html.node`
                <ul class="navlist-items">
                    <li class="navlist-item secondary-nav-item secondary-nav-item--overview">
                        <a class="secondary-nav-item-link secondary-nav-item-link--active" href="${window.location.href}">
                            ${tl(trans.overview)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--albums">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+albums">
                            ${tl(trans.albums)}
                        </a>
                    </li>
                    ${(!page_is_blocked) ? html.node`
                    <li class="navlist-item secondary-nav-item secondary-nav-item--wiki">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+wiki">
                            ${tl(trans.wiki)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--shoutbox">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+shoutbox">
                            ${tl(trans.shouts)}
                        </a>
                    </li>
                    <li class="navlist-item secondary-nav-item secondary-nav-item--tags">
                        <a class="secondary-nav-item-link" href="${window.location.href}/+tags">
                            ${tl(trans.tags)}
                        </a>
                    </li>
                    ` : ''}
                </ul>
            `);
        }

        page.structure.container.insertBefore(tabs, page.structure.row);
        page.structure.tabs = tabs;
    }

    let col_main = page.structure.container.querySelector('.top-overview-panel');
    if (!col_main)
        col_main = document.body.querySelector('.col-main');


    if (page.type == 'track') {
        let new_panel = document.createElement('section');
        new_panel.classList.add('track-info-panel');
        new_panel.innerHTML = col_main.innerHTML;

        page.structure.main.insertBefore(new_panel, page.structure.main.firstElementChild);

        col_main.style.setProperty('display', 'none');
        // make last-child
        page.structure.row.appendChild(col_main);

        console.info(col_main, new_panel);

        // now redirect later code
        col_main = new_panel;
    }


    // create container
    let top_container = document.createElement('div');
    top_container.classList.add('top-container');
    if (katsune)
        top_container.classList.add('katsune-button-row');

    let listen_container = document.createElement('div');
    listen_container.classList.add('listen-container');


    // page url
    let page_url = window.location.href;
    let page_url_split = page_url.split('/');
    let page_url_length = (page_url_split.length - 1);

    // artist
    let scrobble_page = page_url_split[page_url_length];
    if (page.type == 'album') {
        scrobble_page = page_url_split[page_url_length - 1] + '/' + page_url_split[page_url_length];
    } else if (page.type == 'track') {
        scrobble_page = page_url_split[page_url_length - 2] + '/_/' + page_url_split[page_url_length];
    }


    // you
    let your_listens = {
        name: auth.name,
        listens: 0,
        link: scrobble_page,
        avi: auth.avatar,
        katsune: katsune
    };
    // check to see if you have scrobbles
    let scrobble_button = col_main.querySelector('.personal-stats-item--scrobbles .hidden-xs a');
    if (scrobble_button) {
        your_listens.listens = clean_number(scrobble_button.textContent.trim());
    }
    // create child for u
    create_listen_item(listen_container, your_listens, page.type);


    // profile shortcut :3
    if (settings.profile_shortcut != '') {
        let shortcut_listens = {
            name: settings.profile_shortcut,
            listens: -1,
            link: scrobble_page,
            avi: localStorage.getItem('bleh_profile_shortcut_avi'),
            katsune: katsune
        }
        // create child for them
        create_listen_item(listen_container, shortcut_listens);

        fetch(`${root}user/${shortcut_listens.name}/library/music/${scrobble_page}`)
        .then(function(response) {
            console.log('returned', response, response.text);

            return response.text();
        })
        .then(function(dom) {
            let doc = new DOMParser().parseFromString(dom, 'text/html');
            console.log('DOC', doc);

            let first_metadata_item = doc.querySelector('.metadata-item .metadata-display');

            let listens = 0;

            let listen_item = page.structure.main.querySelector(`#listen-item--${shortcut_listens.name}`);

            // sometimes this fails even thou they do have plays, this is just a last.fm bug
            // i dont feel comfortable displaying 0 here as it may not be true
            // but i guess i should?
            if (first_metadata_item != null)
                listens = clean_number(first_metadata_item.textContent.trim());

            listen_item.setAttribute('data-listens', listens);

            render(listen_item, html`
                <img class="view-item-avatar" src="${shortcut_listens.avi}" alt="${shortcut_listens.name}">
                <div class="info">
                    <h3>${shortcut_listens.name}</h3>
                    <p>${tl(trans.listens.count).replace('{c}', listens.toLocaleString(lang))}</p>
                </div>
            `);

            // colourful counts
            if (settings.colourful_counts && page.type == 'artist') {
                let parsed_scrobble_as_rank = parse_scrobbles_as_rank(listens);

                listen_item.setAttribute('data-bleh--scrobble-milestone',parsed_scrobble_as_rank.milestone);
                listen_item.style.setProperty('--hue-over',parsed_scrobble_as_rank.hue);
                listen_item.style.setProperty('--sat-over',parsed_scrobble_as_rank.sat);
                listen_item.style.setProperty('--lit-over',parsed_scrobble_as_rank.lit);
            }
        });
    }


    // other user
    if (page.type != 'artist')
        listen_container.appendChild(create_divider());
    create_listen_item(listen_container, {
        name: 'other',
        listens: -3,
        link: scrobble_page,
        button: true,
        katsune: katsune
    }, page.type);


    // append
    col_main.insertBefore(listen_container, col_main.firstElementChild);

    if (!katsune)
        col_main.insertBefore(top_container, col_main.firstElementChild);
    else
        page.structure.container.querySelector('.bleh-background').after(top_container);


    // other listeners
    if (page.type == 'artist') {
        //
        let other_container = col_main.querySelector('.personal-stats-item--listeners');
        if (other_container != null) {
            let listen_divider = document.createElement('div');
            listen_divider.classList.add('listen-divider');

            listen_container.appendChild(listen_divider);

            let avatars = other_container.querySelectorAll('.personal-stats-listener-avatar img');
            let count = other_container.querySelector('.header-metadata-display a');

            let other_listeners = {
                name: 'others',
                listens: -2,
                link: scrobble_page,
                avi: avatars,
                count: (count != null) ? clean_number(count.textContent.trim()) : 5,
                katsune: katsune
            }
            // create child for them
            create_listen_item(listen_container, other_listeners, page.type);
        }
    }


    // interactables on the right
    let interact_container = document.createElement('section');
    interact_container.classList.add('side-actions');


    let text = document.body.querySelector('.header-new-title').textContent
    .replaceAll(' ', '+')
    .replaceAll('&', '%26');

    let artist = document.body.querySelector('.header-new-crumb');
    if (artist != undefined)
        text = `${text}+${artist.textContent
        .replaceAll(' ', '+')
        .replaceAll('&', '%26')}`;


    // temp probably
    let header_actions = document.body.querySelector('.header-new-actions');

    interact_container.innerHTML = header_actions.innerHTML;


    let buttons = interact_container.querySelectorAll('button');
    buttons.forEach((button) => {
        if (button.classList[0] != 'header-new-playlink')
            button.classList.add('btn', 'side-action');
        else
            button.classList.add('dropdown-menu-clickable-item');

        if (button.classList[0] == 'header-new-more-button')
            interact_container.removeChild(button.parentElement);

        if (button.classList[1] == 'header-new-love-button') {
            button.setAttribute('data-type', 'love');
            let new_text = document.createElement('span');
            new_text.textContent = tl(trans.love);
            button.appendChild(new_text);
        }
    });
    let links = interact_container.querySelectorAll('a');
    links.forEach((button) => {
        if (button.classList[0] != 'header-new-playlink')
            button.classList.add('btn', 'side-action');
        else
            button.classList.add('dropdown-menu-clickable-item');
    });


    // obsession
    let obsession_form = header_actions.querySelector('form[action$="obsessions"]');
    if (obsession_form) {
        let obsession_btn = obsession_form.querySelector('button');
        obsession_btn.classList = 'btn side-action';
        obsession_btn.setAttribute('data-type', 'obsession');
        obsession_btn.textContent = tl(trans.obsession);

        interact_container.appendChild(obsession_form);
    }


    // search similar!
    /*let search_btn = document.createElement('a');
    search_btn.classList.add('btn', 'side-action', 'search-similar-btn');
    search_btn.textContent = trans_legacy.en.music.search_variations.name;
    search_btn.href = `${root}search/${page.type}s?q=${text}`;
    search_btn.target = '_blank';

    tippy(search_btn, {
        content: trans_legacy.en.music.search_variations.tooltip
    });

    interact_container.appendChild(search_btn);*/


    // lotus
    let lotus_btn = null;
    if (settings.corrections) {
        lotus_btn = document.createElement('a');
        /*lotus_btn.classList.add('btn', 'side-action', 'lotus', 'lotus-btn');*/
        lotus_btn.classList.add('dropdown-menu-clickable-item', 'lotus', 'lotus-btn');
        lotus_btn.textContent = trans_legacy.en.lotus.correct.name;
        lotus_btn.href = 'https://github.com/katelyynn/lotus/issues/new/choose';
        lotus_btn.target = '_blank';

        if (page.corrected)
            lotus_btn.classList.add('active');

        /*if (page.corrected)
            tippy(lotus_btn, {
                content: (`<span class="lotus-active">${trans_legacy.en.lotus.correct.tooltip_active}</span><br><div class="tooltip-sub">${document.body.querySelector('.main-content > [itemscope]').getAttribute('data-page-resource-name')}</div>`),
                allowHTML: true
            });
        else
            tippy(lotus_btn, {
                content: (`${trans_legacy.en.lotus.correct.tooltip}<br><div class="tooltip-sub">${document.body.querySelector('.main-content > [itemscope]').getAttribute('data-page-resource-name')}</div>`),
                allowHTML: true
            });

        interact_container.appendChild(lotus_btn);*/
    }

    let play_btn = interact_container.querySelector('.header-new-playlink');
    if (play_btn)
        interact_container.removeChild(play_btn);

    if (!page.mobile)
        page.structure.side.insertBefore(interact_container, page.structure.side.firstElementChild);
    else
        page.structure.main.insertBefore(interact_container, page.structure.main.firstElementChild);




    // new playlist
    let new_playlist = page.structure.side.querySelector(':scope > form');
    if (new_playlist) {
        let header = new_playlist.querySelector('h3');
        new_playlist.removeChild(header);

        let playlist_button = new_playlist.querySelector('button');
        playlist_button.classList = 'btn side-action';
        playlist_button.setAttribute('data-type', 'playlist');

        interact_container.appendChild(new_playlist);
    }




    let metadata = col_main.querySelector('.metadata-column');
    if (metadata) {
        if (settings.simulate_scroll) {
            metadata.addEventListener('wheel', (e) => {
                e.preventDefault();

                if (e.deltaY > 0) {
                    metadata.scrollBy({
                        top: 0,
                        left: +200,
                        behavior: 'smooth'
                    });
                } else {
                    metadata.scrollBy({
                        top: 0,
                        left: -200,
                        behavior: 'smooth'
                    });
                }
            });
        } else {
            metadata.classList.add('no-scroll-simulation');
        }

        let groups = [];

        let headers = metadata.querySelectorAll('.catalogue-metadata-heading:not(.visible-xs)');
        headers.forEach((item, index) => {
            groups[index] = {
                header: item
            };
        });
        let values = metadata.querySelectorAll('.catalogue-metadata-description:not(.visible-xs)');
        values.forEach((item, index) => {
            groups[index].value = item;
        });

        metadata.innerHTML = '';
        groups.forEach((group) => {
            let group_wrap = document.createElement('div');
            group_wrap.classList.add('metadata-group');
            group_wrap.appendChild(group.header);
            group_wrap.appendChild(group.value);
            metadata.appendChild(group_wrap);
        });
    }

    if (page_is_blocked) {
        let alert = document.createElement('section');
        alert.classList.add('cta', 'blocked-cta');
        alert.innerHTML = `<strong>${tl(trans.blocked_page)}</strong>`;

        page.structure.main.insertBefore(alert, page.structure.main.firstElementChild);

        return;
    }

    let play_on;
    let play_links;

    let link_group = document.createElement('div');
    link_group.classList.add('metadata-group');

    let link_container = document.createElement('div');
    link_container.classList.add('music-links');

    if (page.type == 'track') {
        let header = document.createElement('div');
        header.classList.add('sub-text', 'music-small-header');
        header.textContent = tl(trans.find_on);
        link_group.appendChild(header);

        play_on = page.structure.side.querySelector('.play-this-track-playlinks');
        page.structure.side.removeChild(play_on.parentElement);
        play_links = play_on.querySelectorAll('li');

        play_links.forEach((item) => {
            let link = item.querySelector('.play-this-track-playlink:not(.visible-xs)');
            link.classList.add('music-link');
            let replace = item.querySelector('.replace-playlink');

            if (replace) {
                replace.classList.add('dropdown-menu-clickable-item');
                item.removeChild(replace);

                let menu = tippy(link, {
                    theme: 'context-menu',
                    content: replace,
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

                register_menu(link, menu);
            }

            link_container.appendChild(item);
        });

        link_container.appendChild(html.node`
            <li>
                <a class="play-this-track-playlink music-link play-this-track-playlink--genius" href="https://genius.com/search?q=${sanitise(page.sister)}+${sanitise(page.name)}" target="_blank">
                    Genius
                </a>
            </li>
        `);
        
        link_container.appendChild(html.node`
            <li>
            <a class="play-this-track-playlink music-link play-this-track-playlink--tidal" href="https://listen.tidal.com/search?q=${sanitise(page.sister, ' ')} ${sanitise(page.name, ' ')}" target="_blank">
                Tidal
            </a>

            </li>
        `);
    } else {
        let header = document.createElement('div');
        header.classList.add('sub-text', 'music-small-header');
        header.textContent = tl(trans.find_on);
        link_group.appendChild(header);

        if (page.type == 'album') {
            render(link_container, html`
                <a class="play-this-track-playlink music-link play-this-track-playlink--spotify" href="https://open.spotify.com/search/${sanitise(page.sister, ' ')} ${sanitise(page.name, ' ')}" target="_blank">
                    Spotify
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--itunes" href="https://music.apple.com/gb/search?term=${sanitise(page.sister, ' ')} ${sanitise(page.name, ' ')}" target="_blank">
                    Apple Music
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--youtube-music" href="https://music.youtube.com/search?q=${sanitise(page.sister)}+${sanitise(page.name)}" target="_blank">
                    YT Music
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--tidal" href="https://listen.tidal.com/search?q=${sanitise(page.sister, ' ')} ${sanitise(page.name, ' ')}" target="_blank">
                    Tidal
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--discogs" href="https://www.discogs.com/search?q=${sanitise(page.sister)}+${sanitise(page.name)}&type=all" target="_blank">
                    Discogs
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--aoty" href="https://www.albumoftheyear.org/search/?q=${sanitise(page.sister)}+${sanitise(page.name)}" target="_blank">
                    AOTY
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--rym" href="https://rateyourmusic.com/search?searchterm=${sanitise(page.sister, ' ')} ${sanitise(page.name, ' ')}" target="_blank">
                    RYM
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--genius" href="https://genius.com/search?q=${sanitise(page.sister)}+${sanitise(page.name)}" target="_blank">
                    Genius
                </a>
            `);
        } else {
            render(link_container, html`
                <a class="play-this-track-playlink music-link play-this-track-playlink--spotify" href="https://open.spotify.com/search/${sanitise(page.name, ' ')}" target="_blank">
                    Spotify
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--itunes" href="https://music.apple.com/gb/search?term=${sanitise(page.name, ' ')}" target="_blank">
                    Apple Music
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--youtube-music" href="https://music.youtube.com/search?q=${sanitise(page.name)}" target="_blank">
                    YT Music
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--tidal" href="https://listen.tidal.com/search?q=${sanitise(page.name, ' ')}" target="_blank">
                    Tidal
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--discogs" href="https://www.discogs.com/search?q=${sanitise(page.name)}&type=artist" target="_blank">
                    Discogs
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--aoty" href="https://www.albumoftheyear.org/search/?q=${sanitise(page.name)}" target="_blank">
                    AOTY
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--rym" href="https://rateyourmusic.com/search?searchterm=${sanitise(page.name, ' ')}" target="_blank">
                    RYM
                </a>
                <a class="play-this-track-playlink music-link play-this-track-playlink--genius" href="https://genius.com/search?q=${sanitise(page.name)}" target="_blank">
                    Genius
                </a>
            `);

            let externals = page.structure.side.querySelector('.resource-external-links');
            if (externals) {
                page.structure.side.removeChild(externals.parentElement);
                let externals_links = externals.querySelectorAll('.resource-external-link');
                externals_links.forEach((link) => {
                    link.classList.add('music-link');

                    let type = link.classList[1];
                    if (type == 'resource-external-link--homepage')
                        link.textContent = tl(trans.website);
                    else if (type == 'resource-external-link--twitter')
                        link.textContent = 'Twitter';
                    else if (type == 'resource-external-link--facebook')
                        link.textContent = 'Facebook';

                    link_container.appendChild(link);
                });
            }
        }
    }

    link_group.appendChild(link_container);
    col_main.appendChild(link_group);

    let tags = col_main.querySelector('.catalogue-tags');

    if (tags) {
        let header_tags = document.createElement('div');
        header_tags.classList.add('sub-text', 'music-small-header');
        header_tags.textContent = tl(trans.tags);
        col_main.appendChild(header_tags);

        col_main.appendChild(tags);
    }


    // lotus
    if (!settings.corrections )
        return;

    page.structure.side.appendChild(html.node`
        <section class="lotus cta">
             <strong>${tl(trans.lotus_cta[page.corrected]).replace('{t}', tl(trans[`${page.type}_lower`]))}</strong>
            <a class="see-more" href="https://github.com/katelyynn/lotus/issues/new/choose" target="_blank">${tl(trans.suggest_correction)}</a>
        </section>
    `);
}

function create_listen_item(parent, {name, listens, link, avi, count=0, button=false, katsune=false}, header_type) {
    log(`creating listen item of ${name}, ${count}, ${listens}`, 'artist', 'info', {avi: avi, link: link});

    let listen_item = document.createElement((!button) ? 'a' : 'button');
    listen_item.classList.add('btn', 'listen-item');
    listen_item.setAttribute('href', `${root}user/${name}/library/music/${link}`);
    //listen_item.setAttribute('target', '_blank');
    listen_item.setAttribute('data-listens', listens);
    listen_item.setAttribute('id', `listen-item--${name}`);

    if (listens > -1) {
        // 0 listens
        render(listen_item, html`
            <img class="view-item-avatar" src="${avi}" alt="${name}">
            <div class="info">
                <h3>${name}</h3>
                <p>${tl(trans.listens.count).replace('{c}', listens.toLocaleString(lang))}</p>
            </div>
        `);

        let menu = tippy(listen_item, {
            theme: 'context-menu',
            content: (html.node`
                <a class="dropdown-menu-clickable-item" href="${root}user/${name}" data-menu-item="view_profile">
                    ${tl(trans.profile)}
                </a>
            `),
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

        register_menu(listen_item, menu);
    } else if (listens > -2) {
        // loading listens
        render(listen_item, html`
            <img class="view-item-avatar" src="${avi}" alt="${name}">
            <div class="info">
                <h3>${name}</h3>
                <p>${tl(trans.listens)}</p>
            </div>
        `);

        let menu = tippy(listen_item, {
            theme: 'context-menu',
            content: (html.node`
                <a class="dropdown-menu-clickable-item" href="${root}user/${name}" data-menu-item="view_profile">
                    ${tl(trans.profile)}
                </a>
                <div class="sep"></div>
                <button class="dropdown-menu-clickable-item" onclick="_open_profile_shortcut_window()" data-menu-item="settings">
                    ${tl(trans.settings)}
                </button>
            `),
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

        register_menu(listen_item, menu);
    } else if (listens == -3) {
        listen_item.classList.add('listen-item-other');

        listen_item.removeAttribute('href');
        listen_item.setAttribute('onclick', `_other_listener('${link}')`);

        tippy(listen_item, {
            content: tl(trans.view_others_library)
        });
    } else {
        // other listeners by clicking this link (artist)
        render(listen_item, html`
            ${avi[0] ? html.node`<img class="view-item-avatar" src="${avi[0].getAttribute('src')}" alt="">` : ''}
            ${avi[1] ? html.node`<img class="view-item-avatar" src="${avi[1].getAttribute('src')}" alt="">` : ''}
            ${avi[2] ? html.node`<img class="view-item-avatar" src="${avi[2].getAttribute('src')}" alt="">` : ''}
            <div class="info">
                <h3>${tl(trans.following)}</h3>
                <p>${tl(trans.others_count).replace('{c}', count)}</p>
            </div>
        `);
        listen_item.setAttribute('href', `${window.location.href}/+listeners/you-know`);
    }

    // colourful counts
    if (settings.colourful_counts && listens > -1 && header_type == 'artist') {
        let parsed_scrobble_as_rank = parse_scrobbles_as_rank(listens);

        listen_item.setAttribute('data-bleh--scrobble-milestone',parsed_scrobble_as_rank.milestone);
        listen_item.style.setProperty('--hue-user',parsed_scrobble_as_rank.hue);
        listen_item.style.setProperty('--sat-user',parsed_scrobble_as_rank.sat);
        listen_item.style.setProperty('--lit-user',parsed_scrobble_as_rank.lit);
    }

    if (katsune)
        listen_item.classList.add('icon');

    parent.appendChild(listen_item);

    // ensure proper listeners element
    if (listens < -1)
        return;
}


function show_numbers_on_side(header_type) {
    let metadata = document.body.querySelectorAll('.header-metadata-tnew-item');

    let listeners = {};
    let scrobbles = {};
    let metascore = {};

    metadata.forEach((item, index) => {
        let text = item.querySelector('.header-metadata-tnew-title').textContent.trim();
        let value = item.querySelector('.header-metadata-tnew-display abbr');

        if (index == 0) {
            listeners.text = text;
            listeners.value = clean_number(value.getAttribute('title'));
            listeners.abbr = value.textContent.trim();
        } else if (index == 1) {
            scrobbles.text = text;
            scrobbles.value = clean_number(value.getAttribute('title'));
            scrobbles.abbr = value.textContent.trim();
        } else if (index == 2) {
            let link = item.querySelector('a');
            if (!link)
                return;

            metascore.text = text;
            metascore.abbr = value.textContent.trim();
            metascore.link = link.getAttribute('href');
        }
    });

    page.structure.side.classList.remove('hidden-xs');


    // get panel
    let panel = page.structure.side.querySelector('section.section-with-separator:has(.listener-trend)');

    if (!panel) {
        panel = document.createElement('section');
        panel.classList.add('section-with-separator');

        if (!page.mobile)
            page.structure.side.insertBefore(panel, page.structure.side.firstElementChild);
        else
            page.structure.main.insertBefore(panel, page.structure.main.firstElementChild);
    }

    panel.classList.add('listen-panel');


    let row = html.node`
        <div class="listener-row">
            <div class="listener-side">
                <h3>${listeners.text}</h3>
                <p>${listeners.abbr}</p>
            </div>
            <div class="scrobble-side">
                <h3>${scrobbles.text}</h3>
                <p>${scrobbles.abbr}</p>
            </div>
            ${(metascore.text) ? html.node`
            <div class="metascore-side">
                <h3>${metascore.text}</h3>
                <p><a href="${metascore.link}" target="_blank">${metascore.abbr}</a></p>
            </div>
            ` : ''}
        </div>
    `
    
    panel.insertBefore(row, panel.firstElementChild);

    if (page.mobile)
        page.structure.main.insertBefore(panel, page.structure.main.firstElementChild);

    tippy(row.querySelector('.listener-side p'), {
        content: tl(trans.count_listeners).replace('{c}', listeners.value.toLocaleString(lang))
    });
    tippy(row.querySelector('.scrobble-side p'), {
        content: tl(trans.count_scrobbles).replace('{c}', scrobbles.value.toLocaleString(lang))
    });


    // is there album artwork?
    if (page.type == 'album') {
        let album_artwork = document.body.querySelector('.artwork-and-metadata-row');

        if (album_artwork)
            page.structure.side.insertBefore(album_artwork, page.structure.side.firstElementChild);
    }

    let masonry = page.structure.row.querySelector(':scope > .col-sidebar.masonry-right');
    if (masonry) {
        // make last-child
        page.structure.row.appendChild(masonry);
    }

    if (page.type == 'album' || page.type == 'artist') {
        let upper = document.body.querySelector('.col-main');
        upper.classList.add('upper-overview-to-hide');
        // make last-child
        page.structure.row.appendChild(upper);

        let new_upper = document.createElement('section');
        new_upper.classList.add('top-overview-panel');
        new_upper.setAttribute('data-page-type', page.type);
        new_upper.innerHTML = upper.innerHTML;

        page.structure.main.insertBefore(new_upper, page.structure.main.firstElementChild);
    }


    // is there a video?
    if (page.type == 'track') {
        let video_col = document.body.querySelector('.track-overview-video-column.col-sidebar');

        if (!video_col) {
            video_unavailable(video_col);
            return;
        }

        video_col.classList.remove('col-sidebar');
        page.structure.side.insertBefore(video_col, page.structure.side.firstElementChild);

        let video = video_col.querySelector('.video-preview');

        if (!video) {
            video_unavailable(video_col);
            return;
        }

        video_col.classList.remove('col-sidebar');
        page.structure.side.insertBefore(video_col, page.structure.side.firstElementChild);

        let container = document.createElement('div');
        container.classList.add('video-overlay-container');

        let view_buttons = document.createElement('div');
        view_buttons.classList.add('view-buttons');

        let playlink = video.querySelector('.video-preview-playlink a');
        let replace = video_col.querySelector('.video-preview-replace a');

        playlink.classList = 'btn view-item video-item video-item--play';
        replace.classList = 'btn view-item video-item video-item--edit';

        view_buttons.appendChild(playlink);
        view_buttons.appendChild(replace);

        container.appendChild(view_buttons);
        video.appendChild(container);

        tippy(playlink, {
            content: playlink.getAttribute('title')
        });
        playlink.removeAttribute('title');
        tippy(replace, {
            content: replace.textContent
        });
    }
}

function video_unavailable(video_col=null) {
    let cta = page.structure.side.querySelector('.video-preview-upload-cta');

    if (cta)
        return;

    if (video_col)
        page.structure.side.removeChild(video_col);

    page.structure.side.insertBefore(html.node`
        <section class="video-placeholder">
            <div class="bleh-icon" style="--icon: var(--icon-16-video-broken)"></div>
            ${tl(trans.video_removed)}
        </section>
    `, page.structure.side.firstElementChild);


    let links = page.structure.side.querySelector('.external-links-section .play-this-track-playlinks');
    if (links)
        links.classList.add('video-unavailable');
}

export function bleh_music_page_charts() {
    if (!ff('music_page_charts'))
        return;

    log('beginning replacement', 'music charts');

    let panel = page.structure.container.querySelector('.listen-panel'); // page.structure.side fails without pro
    let trend = panel.querySelector('.listener-trend');

    if (!trend) return;

    // is this a chart reflow due to style loading?
    let previous_chart = panel.querySelector('.scrobble-canvas-container');
    if (previous_chart)
        panel.removeChild(previous_chart);

    let table = trend.querySelector('tbody');
    let days = table.querySelectorAll('tr');

    let labels = [];
    let values = [];

    let has_seen_more_than_0 = false;
    days.forEach((day, index) => {
        if (!day)
            null;

        //let label = day.querySelector('time').textContent.trim();
        let label = moment(day.querySelector('time').getAttribute('datetime'));
        let value = day.querySelector('.js-value');

        console.log('day', index, label, day, day.innerHTML);

        if (!value.getAttribute('data-value'))
            value = 0;
        else
            value = value.getAttribute('data-value');

        if (value == '0' && index < 120 && !has_seen_more_than_0)
            return;
        has_seen_more_than_0 = true;

        labels.push(label);
        values.push(value);
    });

    prep_chart_colours();

    let scrobble_canvas_container = document.createElement('div');
    scrobble_canvas_container.classList.add('scrobble-canvas-container');

    let scrobble_canvas = document.createElement('canvas');
    scrobble_canvas.classList.add('scrobble-canvas');

    let gradient = scrobble_canvas.getContext('2d').createLinearGradient(0, 0, 0, 160);
    try {
        gradient.addColorStop(0, page.state.chart_colours.link_bg_col);
        gradient.addColorStop(1, page.state.chart_colours.link_bg_col_2);
    } catch(e) {
        gradient = page.state.chart_colours.link_bg_col;
    }

    Chart.defaults.color = page.state.chart_colours.text_col;
    Chart.defaults.font.family = 'Ubuntu Sans';
    let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderWidth: 2,
                backgroundColor: gradient,
                borderColor: page.state.chart_colours.link_col,
                fill: true,
                pointRadius: 0,
                pointHitRadius: 20,
                tension: 0.1
            }]
        },
        options: page.state.chart_line_options
    });

    scrobble_canvas_container.appendChild(scrobble_canvas);
    panel.appendChild(scrobble_canvas_container);

    trend.style.setProperty('display', 'none');

    log('finished', 'music charts');
}

export function bleh_top_listeners() {
    if (!ff('unify_top_listeners'))
        return;

    let panel = page.structure.main.querySelector(':scope > .buffer-standard');

    // view-related buttons
    let view_buttons = document.createElement('div');
    view_buttons.classList.add('view-buttons-wrapper');
    view_buttons.innerHTML = (`
        <div class="view-buttons">
            <button class="btn view-item" id="toggle-list_view-1" data-toggle="list_view" data-toggle-value="1" onclick="_update_item('list_view', 1)">
                ${tl(trans.grid)}
            </button>
            <button class="btn view-item" id="toggle-list_view-0" data-toggle="list_view" data-toggle-value="0" onclick="_update_item('list_view', 0)">
                ${tl(trans.list)}
            </button>
        </div>
    `);
    panel.insertBefore(view_buttons, panel.firstElementChild);

    refresh_all();

    let legacy_top_listeners_container = panel.querySelector('.top-listeners');
    let legacy_top_listeners = legacy_top_listeners_container.querySelectorAll('.top-listeners-item');

    let new_container = document.createElement('ul');
    new_container.classList.add('user-list', 'top-listeners-list');

    legacy_top_listeners.forEach((listener, index) => {
        let new_listener = document.createElement('li');
        new_listener.classList.add('user-list-item', 'listener-list-item');

        let position = index + 1;
        if (page.requested.page != null && page.requested.page != "1") {
            position += ((parseInt(page.requested.page) - 1) * 30);
        }

        let name_wrap = listener.querySelector('.top-listeners-item-name a');
        let name = name_wrap.textContent;
        let track_wrap = listener.querySelector('.top-listeners-track');

        let avatar = listener.querySelector('.top-listeners-item-image');

        let follow = listener.querySelector('.class');

        new_listener.innerHTML = (`
            <div class="user-list-inner-wrap">
                <span class="listener-list-position">
                    ${position}
                </span>
                <h4 class="user-list-name">
                    <a class="user-list-link link-block-target" href="${name_wrap.getAttribute('href')}">
                        ${name}
                    </a>
                </h4>
                <span class="avatar user-list-avatar">
                    ${avatar.innerHTML}
                </span>
                ${follow ? follow.outerHTML : ''}
                ${track_wrap ? (`
                <div class="user-list-description">
                    <p class="user-list-about-me">
                        ${track_wrap.innerHTML}
                    </p>
                </div>
                `) : ''}
            </div>
        `);

        let badge = patch_avatar(new_listener.querySelector('.user-list-avatar'), name, 'listener');

        if (badge.type) {
            new_listener.querySelector('.user-list-link').classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${name}`);
            new_listener.classList.add('colourful', `user-status--bleh-${badge.type}`, `user-status--bleh-user-${name}`);
        }

        if (track_wrap) {
            let track_link = new_listener.querySelector('.user-list-about-me a');
            let artist = return_artist_from_track(track_link.getAttribute('href'), false);
            let track = correct_item_by_artist(track_link.textContent.trim(), artist);
            track_link.textContent = track;
        }

        new_container.appendChild(new_listener);
    });

    view_buttons.after(new_container);
    panel.removeChild(legacy_top_listeners_container);
}
