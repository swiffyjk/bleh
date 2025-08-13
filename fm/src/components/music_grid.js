//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "../build/config";
import {page} from "../build/page";
import {clamp_sat, clean_number, rgb_to_hsl} from "../build/tools";
import {lang, tl, trans} from "../build/trans";
import {bleh_glacier_insights} from "../pages/glacier";
import {parse_scrobbles_as_rank} from "./colourful_counts";
import {correct_artist, correct_item_by_artist, name_includes} from "./lotus";
import {html, render} from "lighterhtml";
import ColorThief from "color-thief-browser";

export function music_grids(search=page.structure.main, use_colour = true) {
    if (!search) return;

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

    let grids = search.querySelectorAll('.grid-items-item:not([data-bleh-music-grids])');
    grids.forEach((grid, index) => {
        let is_loading = (grid.querySelector('.grid-items-empty-inner') != null);
        if (is_loading) return;

        grid.style.setProperty('--delay', index * 0.04 + 's');

        grid.setAttribute('data-bleh-music-grids', 'true');

        let is_album;
        if (page.type == 'search') {
            // search, tag pages
            is_album = (grid.querySelector('.stat-name') == null);
        } else {
            // profiles
            is_album = (grid.querySelector('.grid-items-item-aux-block') != null);
        }

        let image_wrap = grid.querySelector('.grid-items-cover-image-image');
        let image = image_wrap.querySelector('img');

        if (grid.classList.contains('grid-items-item--big'))
            image.src = image.src.replace('/avatar300s/', '/500x500/');

        if (image && !image_wrap.classList.contains('grid-items-cover-default') && use_colour) {
            let grid_colour = document.createElement('div');
            grid_colour.classList.add('grid-item-colour-bg');
            image_wrap.appendChild(grid_colour);

            image.setAttribute('crossorigin', 'anonymous');
            try {
                image.addEventListener('load', function() {
                    let thief = new ColorThief();
                    let colour = thief.getColor(image);

                    let hsl = rgb_to_hsl(colour[0], colour[1], colour[2]);

                    grid_colour.style.setProperty('background', `rgb(${colour})`);

                    grid.classList.add('grid-items-item-has-colour');
                    grid.style.setProperty('--hue-over', hsl.h);
                    grid.style.setProperty('--sat-over', clamp_sat((hsl.s / 100) * 3));
                    grid.style.setProperty('--lit-over', 1);
                });
            } catch(e) {}

            // TODO: add a timeout to check if the image has had its
            // colour taken and if not do it manually after a set amount of time
        } else {
            grid.classList.add('generic-cover');
        }

        let plays_elem;
        if (page.type == 'search') {
            if (!is_album) {
                let aux_text = grid.querySelector('.grid-items-item-aux-text');
                let stat_name = aux_text.querySelector('.stat-name');

                aux_text.removeChild(stat_name);

                plays_elem = aux_text;
            }
        } else if (page.type == 'tag') {
            let aux_text = grid.querySelector('.grid-items-item-aux-text');
            let stat_name = aux_text.querySelector('.stat-name');
            if (!stat_name) return;

            aux_text.removeChild(stat_name);

            plays_elem = aux_text;

            if (is_album) {
                let artist = grid.querySelector('.grid-items-item-aux-block');

                aux_text.removeChild(artist);

                plays_elem = document.createElement('a');
                plays_elem.textContent = aux_text.textContent;

                aux_text.textContent = '';

                aux_text.appendChild(artist);
                aux_text.appendChild(plays_elem);
            }
        } else {
            plays_elem = grid.querySelector('.grid-items-item-aux-text a:last-child');
        }

        if (plays_elem && !grid.classList.contains('obsessions-item') && !grid.classList.contains('compare-item')) {
            let plays = clean_number(plays_elem.textContent.trim().replace(`${tl(trans.plays_lower)}`, ''));
            plays_elem.classList.add('grid-item-plays');
            if (is_album)
                plays_elem.textContent = plays.toLocaleString(lang);

            if (!is_album) {
                insights.artist.display = true;
                insights.artist.values.push(plays);

                if (plays > insights.artist.highest.value)
                    insights.artist.highest.value = plays;
            } else {
                insights.album.display = true;
                insights.album.values.push(plays);

                if (plays > insights.album.highest.value)
                    insights.album.highest.value = plays;
            }

            if (page.type == 'search' || page.type == 'tag')
                plays_elem.classList.add('grid-item-listeners');

            if (!is_album && settings.colourful_counts && page.type == 'user') {
                if (
                    !plays_elem.getAttribute('href')
                    .includes('?from=') &&
                    (!plays_elem.getAttribute('href')
                    .includes('?date_preset=') || plays_elem.getAttribute('href').endsWith('?date_preset=ALL') || plays_elem.getAttribute('href').endsWith('?date_preset=null'))
                ) {
                    let parsed_scrobble_as_rank = parse_scrobbles_as_rank(plays);

                    plays_elem.setAttribute('data-bleh--scrobble-milestone', parsed_scrobble_as_rank.milestone);
                    plays_elem.style.setProperty('--hue-over', parsed_scrobble_as_rank.hue);
                    plays_elem.style.setProperty('--sat-over', parsed_scrobble_as_rank.sat);
                    plays_elem.style.setProperty('--lit-over', parsed_scrobble_as_rank.lit);
                }
            }
        }

        let name = grid.querySelector('.grid-items-item-main-text a');
        if (!name) return;

        if (!is_album) {
            name.textContent = correct_artist(name.textContent.trim());
            insights.artist.labels.push(name.textContent);
        } else {
            let artist = grid.querySelector('.grid-items-item-aux-block');
            if (!artist) return;

            if (settings.format_guest_features) {
                let name_elem = name;
                let artist_elem = artist;

                let song_title = name_elem.getAttribute('title');

                let formatted_title = name_includes(song_title, artist_elem.textContent.trim());
                let song_tags = {};

                if (formatted_title) {
                    song_title = formatted_title[0];
                    insights.album.labels.push(song_title);
                    song_tags = formatted_title[1];
                    artist.textContent = formatted_title[2];
                }

                // combine
                render(name_elem, html.node`
                    <span class="title">${song_title.trim()}</span>
                    ${song_tags.map((tag) => html.node`
                        <span class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</span>
                    `)}
                `);
            } else {
                artist.textContent = correct_artist(artist.textContent.trim());

                name.textContent = correct_item_by_artist(name.textContent.trim(), artist.textContent.trim());
            }
        }
    });

    if (page.subpage.startsWith('library'))
        bleh_glacier_insights(insights);
}
