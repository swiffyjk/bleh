//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html, render} from "lighterhtml";
import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {clamp_sat, return_artist_from_track, rgb_to_hsl, sanitise} from "../build/tools";
import {bleh_glacier_insights} from "../pages/glacier";
import {patch_artist_ranks_in_list_view} from "./colourful_counts";
import {correct_artist, correct_item_by_artist, name_includes} from "./lotus";
import {register_menu} from "./menu";
import {tl, trans} from "../build/trans.js";

export function patch_titles(search=page.structure.main) {
    if (page.subpage === 'tags_overview' || page.subpage == 'tags_tag')
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

        tracks.forEach((track, index) => {
            console.log('track', track);
            if (track.getAttribute('data-track-type'))
                return;

            // ads slowly move up the tree until eventually causing a crash
            if (track.classList[0] === 'chartlist-row--interlist-ad') {
                track.parentElement.removeChild(track);
                return;
            }

            track.style.setProperty('--delay', index * 0.04 + 's');

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
            if (is_album) track.classList.add('bleh--is-album');

            let track_artist = return_artist_from_track(track_title.getAttribute('href'), is_album);
            // when focused on a track in a library, an artist field is redundant
            if (!wide) track.classList.add('chartlist-row--with-artist');

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
            const has_bar = track.querySelector(':scope > .chartlist-bar');

            // menu
            let track_legacy_menu = track.querySelector('.chartlist-more-menu');

            let track_timestamp = track.querySelector('.chartlist-timestamp span');
            let track_timestamp_contents;
            if (track_timestamp && !is_active) {
                track_timestamp_contents = track_timestamp.getAttribute('title');

                if (track_timestamp_contents) {
                    track_timestamp.setAttribute('title', '');

                    tippy(track_timestamp, {
                        content: track_timestamp_contents
                    });
                }
            }

            let album = track.querySelector('.chartlist-album a');
            if (!is_album && album)
                album.textContent = correct_item_by_artist(album.textContent, track_artist);

            let image = track.querySelector('.chartlist-image img');

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
                console.log('artist matches', song_artist_element.textContent.replaceAll('+', ' ').trim() === track_artist, 'artist is blank', song_artist_element.textContent.trim() === '', song_artist_element.textContent.trim(), formatted_title[2]);
                if (song_artist_element.textContent.replaceAll('+', ' ').trim() === track_artist || song_artist_element.textContent.trim() === '') {
                    log('artist either matches or is blank, replacing', 'tracks', 'log');
                    // replaces with corrected artist if applicable
                    render(song_artist_element, html`<a href="${root}music/${sanitise(formatted_title[2])}">${formatted_title[2]}</a>`);

                    // append guests
                    let song_guests = formatted_title[3];
                    for (let guest in song_guests) {
                        song_artist_element.appendChild(html.node`
                            ,<a href="${root}music/${sanitise(song_guests[guest])}">${song_guests[guest]}</a>
                        `);
                    }
                }

                if (track_legacy_menu) {
                    track.preview = html.node`
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
                    `;
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
                let menu;

                // due to the library refreshing and destroying the html references
                // we need to remove the previous more button
                let previous = track.querySelector(':scope > .more-button-wrapper');
                if (previous) previous.style.display = 'none';

                // then we need to decide for ourselves whether u can delete or obsess
                // since we cant rely on the elements existing anymore
                const is_own_profile = page.type == 'user' && page.name == auth.name;
                const can_edit = !is_active && !has_bar;
                const can_delete = !is_active && !has_bar;

                let more_button = html.node`
                    <button class="track-more-button icon chibi" data-type="more" onclick=${() => {
                        console.info(menu);
                        menu.setProps({
                            placement: 'bottom',
                            offset: [],
                            getReferenceClientRect: null,
                        });
    
                        if (menu.state.isShown) {
                            menu.hide();
                        } else {
                            menu.show();
                        }
                    }}>
                        ${tl(trans.more)}
                    </button>
                `;

                tippy(more_button, {
                    content: tl(trans.more)
                });

                track.appendChild(html.node`
                    <td class="more-button-wrapper">
                        ${more_button}
                    </td>
                `);

                setTimeout(() => {
                    let edit_button = track_legacy_menu.querySelector('[data-analytics-action="EditScrobbleOpen"]');
                    let bulk_edit_button = track_legacy_menu.querySelector('[data-analytics-action="BulkEditScrobblesOpen"]');
                    let delete_button = track_legacy_menu.querySelector('.more-item--delete');

                    if (edit_button) {
                        let form = edit_button.parentElement;

                        page.token = form.querySelector('[name="csrfmiddlewaretoken"]').value;
                        track.setAttribute('data-action', form.getAttribute('action'));
                        track.setAttribute('data-artist-name', form.querySelector('[name="artist_name"]').value);
                        track.setAttribute('data-track-name', form.querySelector('[name="track_name"]').value);
                        track.setAttribute('data-album-name', form.querySelector('[name="album_name"]').value);
                        track.setAttribute('data-album-artist-name', form.querySelector('[name="album_artist_name"]').value);
                        track.setAttribute('data-timestamp', form.querySelector('[name="timestamp"]').value);
                    } else if (delete_button) {
                        let form = delete_button.parentElement;

                        page.token = form.querySelector('[name="csrfmiddlewaretoken"]').value;
                        track.setAttribute('data-artist-name', form.querySelector('[name="artist_name"]').value);
                        track.setAttribute('data-track-name', form.querySelector('[name="track_name"]').value);
                        track.setAttribute('data-timestamp', form.querySelector('[name="timestamp"]').value);
                    }

                    let album_name = sanitise((image) ? correct_item_by_artist(image.getAttribute('alt'), track_artist) : (album) ? album.textContent : '');

                    menu = tippy(more_button, {
                        theme: 'context-menu',
                        content: html.node`
                            ${track.preview}
                            ${can_edit ? html.node`
                            <div class="button-combo">
                                ${() => {
                                    return html.node`
                                        <form style="margin: 0" method="POST" action=${track.getAttribute('data-action')} data-edit-scrobble="">
                                            <input type="hidden" name="csrfmiddlewaretoken" value=${page.token}>
                                            <input type="hidden" name="artist_name" value=${track.getAttribute('data-artist-name')}>
                                            <input type="hidden" name="track_name" value=${track.getAttribute('data-track-name')}>
                                            <input type="hidden" name="album_name" value=${track.getAttribute('data-album-name')}>
                                            <input type="hidden" name="album_artist_name" value=${track.getAttribute('data-album-artist-name')}>
                                            <input type="hidden" name="timestamp" value=${track.getAttribute('data-timestamp')}>
                                            <button class="dropdown-menu-clickable-item" data-type="edit">
                                                ${tl(trans.edit)}
                                            </button>
                                        </form>
                                    `;
                                }}
                                ${bulk_edit_button ? html.node`
                                    <div class="button-combo-sep" />
                                    ${() => {
                                        let button = track_legacy_menu.querySelector('[data-analytics-action="BulkEditScrobblesOpen"]');
                                        button.classList = 'dropdown-menu-clickable-item chibi';
                                        button.textContent = tl(trans.bulk_edit);
                                        button.setAttribute('data-type', 'bulk-edit');
            
                                        tippy(button, {
                                            content: tl(trans.bulk_edit)
                                        });
            
                                        return button;
                                    }}
                                ` : ''}
                            </div>
                            <div class="sep" />
                            ` : ''}
                            ${() => {
                                let container = track.querySelector('.chartlist-play');
                                if (!container) return;
                                
                                let button = container.querySelector('.chartlist-play-button');
                                if (!button) return;
                                
                                button.classList = 'dropdown-menu-clickable-item';
                                button.textContent = tl(trans.play);
                                button.setAttribute('data-type', 'play');
                                
                                track.removeChild(container);
            
                                return button;
                            }}
                            <div class="button-combo">
                                ${() => {
                                    return html.node`
                                        <a class="dropdown-menu-clickable-item" data-type="track" href="${root}music/${sanitise(track_artist)}/_/${sanitise(track_title.getAttribute('title'))}">
                                            ${tl(trans.track)}
                                        </a>
                                    `;
                                }}
                                <div class="button-combo-sep"/>
                                ${() => {
                                    let button = html.node`
                                        <a class="dropdown-menu-clickable-item chibi" data-type="continue" href="${root}user/${page.name}/library/music/${sanitise(track_artist)}/_/${sanitise(track_title.getAttribute('title'))}">
                                            ${tl(trans.explore_in_library)}
                                        </a>
                                    `;
                                    
                                    tippy(button, {
                                        content: tl(trans.explore_in_library)
                                    });
                                    
                                    return button;
                                }}
                            </div>
                            <div class="button-combo">
                                ${() => {
                                    return html.node`
                                        <a class="dropdown-menu-clickable-item" data-type="album" href="${root}music/${sanitise(track_artist)}/${album_name}">
                                            ${tl(trans.album)}
                                        </a>
                                    `;
                                }}
                                <div class="button-combo-sep"/>
                                ${() => {
                                    let button = html.node`
                                        <a class="dropdown-menu-clickable-item chibi" data-type="continue" href="${root}user/${page.name}/library/music/${sanitise(track_artist)}/${album_name}">
                                            ${tl(trans.explore_in_library)}
                                        </a>
                                    `;
    
                                    tippy(button, {
                                        content: tl(trans.explore_in_library)
                                    });
    
                                    return button;
                                }}
                            </div>
                            <div class="button-combo">
                                ${() => {
                                    return html.node`
                                        <a class="dropdown-menu-clickable-item" data-type="artist" href="${root}music/${sanitise(track_artist)}">
                                            ${tl(trans.artist)}
                                        </a>
                                    `;
                                }}
                                <div class="button-combo-sep"/>
                                ${() => {
                                    let button = html.node`
                                        <a class="dropdown-menu-clickable-item chibi" data-type="continue" href="${root}user/${page.name}/library/music/${sanitise(track_artist)}">
                                            ${tl(trans.explore_in_library)}
                                        </a>
                                    `;
    
                                    tippy(button, {
                                        content: tl(trans.explore_in_library)
                                    });
    
                                    return button;
                                }}
                            </div>
                            ${() => {
                                if (!is_own_profile) return;
                                
                                return html.node`
                                    <form style="margin: 0" method="POST" action="${root}user/${auth.name}/obsessions" data-submit-to-modal="">
                                        <input type="hidden" name="csrfmiddlewaretoken" value=${page.token}>
                                        <input type="hidden" name="name" value=${track.getAttribute('data-track-name')}>
                                        <input type="hidden" name="artist_name" value=${track.getAttribute('data-artist-name')}>
                                        <button class="dropdown-menu-clickable-item" data-type="obsession">
                                            ${tl(trans.obsess)}
                                        </button>
                                    </form>
                                `;
                            }}
                            ${() => {
                                if (!is_own_profile || !can_delete) return;
                                
                                let button = html.node`
                                    <button class="dropdown-menu-clickable-item more-item--delete" data-type="delete">
                                        ${tl(trans.delete)}
                                    </button>
                                `;
                                
                                let form;
                                
                                return html.node`
                                    <div class="sep" />
                                    <form ref=${el => form = el} style="margin: 0" method="POST" action="${root}user/${auth.name}/library/delete" onsubmit=${async (e) => {
                                        e.preventDefault();
    
                                        let url = `${root}user/${auth.name}/library/delete`;
                                        let form_data = new FormData(form);
    
                                        console.info(form_data);
    
                                        try {
                                            await fetch(url, {
                                                method: 'POST',
                                                body: form_data
                                            }).then(res => {
                                                if (!res.ok) {
                                                    log('failed to delete', 'form', 'error', {res: res});
                                                    return;
                                                }
                                                
                                                let data = res.json();
    
                                                log('received response', 'form', 'info', {data: data});
                                                track.setAttribute('data-ajax-form-state', 'deleted');
                                            });
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}>
                                        <input type="hidden" name="csrfmiddlewaretoken" value=${page.token}>
                                        <input type="hidden" name="artist_name" value=${track.getAttribute('data-artist-name')}>
                                        <input type="hidden" name="track_name" value=${track.getAttribute('data-track-name')}>
                                        <input type="hidden" name="timestamp" value=${track.getAttribute('data-timestamp')}>
                                        ${button}
                                    </form>
                                `;
                            }}
                        `,
                        placement: 'right-start',
                        trigger: 'manual',
                        interactive: true,
                        interactiveBorder: 10,
                        offset: [0, 0],
                        hideOnClick: false,

                        onShow(instance) {
                            track.setAttribute('data-has-menu', true);

                            instance.popper.addEventListener('click', event => {
                                instance.hide();
                            });

                            /*let menu_items = track_legacy_menu.querySelectorAll('li > *');
                            let content = instance.popper.querySelector('.tippy-content');

                            menu_items.forEach((item) => {
                                content.appendChild(item);
                            });*/
                        },

                        onClickOutside(instance) {
                            instance.hide();
                        },

                        onHide(instance) {
                            track.setAttribute('data-has-menu', false);
                        }
                    });

                    register_menu(track, menu);
                }, 100);
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
