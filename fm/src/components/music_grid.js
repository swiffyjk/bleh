import { settings } from "../build/config";
import { page } from "../build/page";
import { clamp_sat, clean_number, rgb_to_hsl, sanitise_text } from "../build/tools";
import { lang, trans_legacy, trans, tl } from "../build/trans";
import { bleh_glacier_insights } from "../pages/glacier";
import { parse_scrobbles_as_rank } from "./colourful_counts";
import { correct_artist, correct_item_by_artist, name_includes } from "./lotus";

export function music_grids() {
    if (page.structure.main == null)
        return;

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

    let grids = page.structure.main.querySelectorAll('.grid-items-item:not([data-bleh-music-grids])');
    grids.forEach((grid) => {
        let is_loading = (grid.querySelector('.grid-items-empty-inner') != null);
        if (is_loading) return;

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
        if (image && !image_wrap.classList.contains('grid-items-cover-default')) {
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

        if (plays_elem != null && !grid.classList.contains('obsessions-item')) {
            let plays = clean_number(plays_elem.textContent.trim().replace(` ${trans_legacy[lang].statistics.plays.name}`, ''));
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

        if (!is_album) {
            name.textContent = correct_artist(name.textContent.trim());
            insights.artist.labels.push(name.textContent);
        } else {
            let artist = grid.querySelector('.grid-items-item-aux-block');
            if (!artist) return;

            if (settings.format_guest_features) {
                let name_elem = name;
                let artist_elem = artist;

                let song_title = name_elem.textContent;

                let formatted_title = name_includes(song_title, artist_elem.textContent);
                let song_tags = {};

                if (formatted_title) {
                    song_title = formatted_title[0];
                    insights.album.labels.push(song_title);
                    song_tags = formatted_title[1];
                }

                // parse tags into text
                let song_tags_text = '';
                for (let song_tag in song_tags) {
                    song_tags_text = `${song_tags_text}<div class="feat" data-bleh--tag-type="${song_tags[song_tag].type}" data-bleh--tag-group="${song_tags[song_tag].group}">${sanitise_text(song_tags[song_tag].text)}</div>`;
                }

                // combine
                name_elem.innerHTML = `<div class="title">${sanitise_text(song_title).trim()}</div>${song_tags_text}`;
            } else {
                artist.textContent = correct_artist(artist.textContent.trim());

                name.textContent = correct_item_by_artist(name.textContent.trim(), artist.textContent.trim());
            }
        }
    });

    if (page.subpage.startsWith('library'))
        bleh_glacier_insights(insights);
}