//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html, render} from "lighterhtml";
import {settings} from "../build/config";
import {log} from "../build/log";
import {page, root} from "../build/page";
import {clamp_sat, return_artist_from_track, rgb_to_hsl, sanitise} from "../build/tools";
import {bleh_glacier_insights} from "../pages/glacier";
import {patch_artist_ranks_in_list_view} from "./colourful_counts";
import {correct_artist, correct_item_by_artist, name_includes} from "./lotus";
import {register_menu} from "./menu";

export function patch_titles(search=page.structure.main) {
    if (page.subpage === 'tags_overview')
        return;

    if (!search) return;

    let tracklists = search.querySelectorAll('.chartlist:not(.chartlist__placeholder)');

    let insights = {
        artist: {
            display: false,
            values: [],
            labels: [],
            highest: {
                value: 0,
                label: '',
                link: '',
                img: ''
            }
        },
        album: {
            display: false,
            values: [],
            labels: [],
            highest: {
                value: 0,
                label: '',
                link: '',
                img: ''
            }
        },
        track: {
            display: false,
            values: [],
            labels: [],
            highest: {
                value: 0,
                label: '',
                link: '',
                img: ''
            }
        }
    };

    tracklists.forEach((tracklist) => {
        if (!tracklist) return;

        log('found, checking', 'tracks', 'log', {tracklist: tracklist});

        // used to ensure this hasnt been run thru
        if (tracklist.querySelector('tbody > .chartlist-row:first-child > .kate-placeholder'))
            return;

        log('new!', 'tracks', 'info', {tracklist: tracklist});

        let wide = tracklist.classList.contains('chartlist--wide-artist-column');

        let tracks = tracklist.querySelectorAll(':is(.chartlist-row:not(.chartlist__placeholder-row), .chartlist-row--interlist-ad)');

        tracks.forEach((track) => {
            console.log('track', track);
            if (track.getAttribute('data-track-type'))
                return;

            // ads slowly move up the tree until eventually causing a crash
            if (track.classList[0] === 'chartlist-row--interlist-ad') {
                track.parentElement.removeChild(track);
                return;
            }

            let bla = document.createElement('div');
            bla.classList.add('kate-placeholder');
            track.appendChild(bla);


            let track_title = track.querySelector('.chartlist-name a:not(.offset-section-anchor)');
            if (!track_title) return;

            // for albums and tracks 'avatar' is replaced with 'cover-art'
            // we can use this to detect if the item is either a user or an artist
            let is_user = track.querySelector('.chartlist-image .avatar');
            let is_artist = false;

            // now lets check if we have a user or an artist
            if (is_user) {
                let link = track_title.getAttribute('href');
                if (link.startsWith(`${root}music/`)) {
                    // this is an artist
                    is_user = false;
                    is_artist = true;
                }
            }

            log(`is user: ${is_user}, is artist: ${is_artist}`, 'tracks', 'log');

            if (is_user) {
                track.setAttribute('data-track-type', 'user');

                if (settings.colourful_counts)
                    patch_artist_ranks_in_list_view(track);

                log('finished user stuff, returning', 'tracks', 'log');
                return;
            }

            if (is_artist) {
                track.setAttribute('data-track-type', 'artist');

                if (settings.colourful_counts)
                    patch_artist_ranks_in_list_view(track);

                if (settings.corrections)
                    track_title.textContent = correct_artist(track_title.getAttribute('title'));

                insights.artist.display = true;
                let bar = track.querySelector('.chartlist-count-bar-slug');
                let value = parseInt(bar.getAttribute('data-stat-value'));
                insights.artist.values.push(value);

                if (value > insights.artist.highest.value)
                    insights.artist.highest.value = value;

                log(`pushed insight artist label of ${track_title.textContent}`, 'glacier library', 'log');
                insights.artist.labels.push(track_title.textContent);

                log('finished artist stuff, returning', 'tracks', 'log');
                return;
            }

            let is_album = track.hasAttribute('data-album-row');
            if (is_album)
                track.classList.add('bleh--is-album');

            let track_artist = return_artist_from_track(track_title.getAttribute('href'), is_album);
            // when focused on a track in a library, an artist field is redundant
            if (!wide)
                track.classList.add('chartlist-row--with-artist');

            let bar = track.querySelector('.chartlist-count-bar-slug');
            if (bar) {
                let value = parseInt(bar.getAttribute('data-stat-value'));

                if (is_album) {
                    insights.album.display = true;
                    insights.album.values.push(value);

                    if (value > insights.album.highest.value)
                        insights.album.highest.value = value;
                } else {
                    insights.track.display = true;
                    insights.track.values.push(value);

                    if (value > insights.track.highest.value)
                        insights.track.highest.value = value;
                }
            }

            let is_active = track.classList.contains('chartlist-row--now-scrobbling');

            // menu
            let track_legacy_menu = track.querySelector('.chartlist-more-menu');

            let track_timestamp = track.querySelector('.chartlist-timestamp span');
            let track_timestamp_contents;
            if (track_timestamp && !is_active) {
                track_timestamp_contents = track_timestamp.getAttribute('title');
                track_timestamp.setAttribute('title', '');

                tippy(track_timestamp, {
                    content: track_timestamp_contents
                });
            }

            let album = track.querySelector('.chartlist-album a');
            if (!is_album && album)
                album.textContent = correct_item_by_artist(album.textContent, track_artist);

            if (settings.format_guest_features) {
                let formatted_title = name_includes(track_title.getAttribute('title'), track_artist);
                console.log('formatted', formatted_title);
                let song_title = track_title.getAttribute('title');
                let song_tags = {};

                if (formatted_title) {
                    song_title = formatted_title[0];
                    song_tags = formatted_title[1];
                }

                track_title.setAttribute('title', correct_item_by_artist(track_title.getAttribute('title'), track_artist));

                // parse tags into text
                render(track_title, html`
                    <div class="title">${song_title.trim()}</div>
                    ${song_tags.map((tag) => html.node`
                        <div class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</div>
                    `)}
                `);

                let song_artist_element = track.querySelector('.chartlist-artist');
                if (!song_artist_element && !is_user) {
                    song_artist_element = document.createElement('td');
                    song_artist_element.classList.add('chartlist-artist');
                    track.appendChild(song_artist_element);
                }

                // if artist matches OR artist is blank
                if (song_artist_element.textContent.replaceAll('+', ' ').trim() === track_artist || song_artist_element.textContent.trim() === '') {
                    log('artist either matches or is blank, replacing', 'tracks', 'log');
                    // replaces with corrected artist if applicable
                    render(song_artist_element, html`<a href="${root}music/${sanitise(formatted_title[2])}" title="${formatted_title[2]}">${formatted_title[2]}</a>`);

                    // append guests
                    let song_guests = formatted_title[3];
                    for (let guest in song_guests) {
                        song_artist_element.appendChild(html.node`
                            ,<a href="${root}music/${sanitise(song_guests[guest])}" title="${song_guests[guest]}">${song_guests[guest]}</a>
                        `);
                    }
                }

                let image = track.querySelector('.chartlist-image img');

                if (track_legacy_menu) {
                    let track_preview = html.node`
                        <div class="track-preview">
                            <div class="image">
                                <div class="inner-image">
                                    ${(image) ? html.node`<img src=${image.getAttribute('src')} alt=${song_title}>` : html.node`<img class="missing-track" alt="">`}
                                </div>
                            </div>
                            <div class="info">
                                <h5 class="title">${song_title}</h5>
                                <p class="artist">${song_artist_element.firstElementChild.textContent}</p>
                                <div class="tags">
                                    ${song_tags.map((tag) => html.node`
                                        <div class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</div>
                                    `)}
                                </div>
                                ${(is_album) ? '' : html.node`<p class="album">${(image) ? correct_item_by_artist(image.getAttribute('alt'), track_artist) : (album) ? album.textContent : page.name}</p>`}
                                ${(track_timestamp && track_timestamp_contents) ? html.node`<p class="timestamp">${track_timestamp_contents}</p>` : ''}
                            </div>
                        </div>
                    `

                    track_legacy_menu.insertBefore(track_preview, track_legacy_menu.firstElementChild);
                }
            } else if (settings.corrections) {
                let song_artist_element = track.querySelector('.chartlist-artist a');
                if (song_artist_element) {
                    let corrected_title = correct_item_by_artist(track_title.textContent, song_artist_element.textContent);
                    track_title.textContent = corrected_title;
                    track_title.setAttribute('title', corrected_title);

                    let corrected_artist = correct_artist(song_artist_element.textContent);
                    song_artist_element.textContent = corrected_artist;
                    song_artist_element.setAttribute('title', corrected_artist);
                } else {
                    let corrected_title = correct_item_by_artist(track_title.textContent, track_artist);
                    track_title.textContent = corrected_title;
                    track_title.setAttribute('title', corrected_title);
                }
            }

            if (track_legacy_menu) {
                let menu = tippy(track, {
                    theme: 'context-menu',
                    content: track_legacy_menu.innerHTML,
                    allowHTML: true,
                    placement: 'right-start',
                    trigger: 'manual',
                    interactive: true,
                    interactiveBorder: 10,
                    offset: [0, 0],

                    onShow(instance) {
                        instance.popper.addEventListener('click', event => {
                            instance.hide();
                        });

                        /*let menu_items = track_legacy_menu.querySelectorAll('li > *');
                        let content = instance.popper.querySelector('.tippy-content');

                        menu_items.forEach((item) => {
                            content.appendChild(item);
                        });*/
                    }
                });

                register_menu(track, menu);
            }

            if (is_album) {
                log(`pushed insight album label of ${track_title.getAttribute('title')}`, 'glacier library', 'log');
                insights.album.labels.push(track_title.getAttribute('title'));
            } else {
                log(`pushed insight track label of ${track_title.getAttribute('title')}`, 'glacier library', 'log');
                insights.track.labels.push(track_title.getAttribute('title'));
            }


            if (!is_album && is_active) {
                let image_wrap = track.querySelector('.chartlist-image');
                if (image_wrap) {
                    let link = image_wrap.querySelector('.cover-art');
                    let image = link.querySelector('img');
                    
                    if (!settings.album_text) {
                        let alt = correct_item_by_artist(image.getAttribute('alt'), track_artist);
                        
                        track.appendChild(html.node`
                            <td class="chartlist-album custom-album-text">
                                <a href="${link.getAttribute('href')}">${alt}</a>
                            </td>
                        `);
                    }

                    if (!settings.colourful_tracks)
                        return;

                    image.setAttribute('crossorigin', 'anonymous');
                    try {
                        image.addEventListener('load', function() {
                            let thief = new ColorThief();
                            let colour = thief.getColor(image);

                            let hsl = rgb_to_hsl(colour[0], colour[1], colour[2]);

                            track.style.setProperty('--hue-over', hsl.h);
                            track.style.setProperty('--sat-over', clamp_sat((hsl.s / 100) * 3));
                            track.style.setProperty('--lit-over', 1);
                        });
                    } catch(e) {}
                }
            }
        });
    });

    if (page.subpage.startsWith('library'))
        bleh_glacier_insights(insights);
}
