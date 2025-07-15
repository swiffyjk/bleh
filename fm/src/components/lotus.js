//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "../build/config";
import {log} from "../build/log";
import {album_track_corrections, artist_corrections, includes} from "../build/music";
import {page, root} from "../build/page";
import {return_artist_from_generic, sanitise} from "../build/tools";
import {trans_legacy} from "../build/trans";
import {prepare_corrections_page} from "../pages/bleh_config";
import {dialog} from "./dialog";
import {notify} from "./notify";
import {html, render} from "lighterhtml";

const flat_patterns = [];

Object.entries(includes).forEach(([group, pats]) => {
    pats.forEach(pat => {
        flat_patterns.push({
            group,
            pat: pat.toLowerCase()
        });
    });
});

// prefer longest patterns first
flat_patterns.sort((a, b) => b.pat.length - a.pat.length);

export function lotus(force = false) {
    if (!settings.corrections)
        return;

    let lotus_artist = localStorage.getItem('lotus_artist');
    let lotus_artist_expire = new Date(localStorage.getItem('lotus_artist_expire'));

    let lotus_album_track = localStorage.getItem('lotus_album_track');
    let lotus_album_track_expire = new Date(localStorage.getItem('lotus_album_track_expire'));

    let current_time = new Date();

    if (lotus_artist == null) {
        console.info('lotus - artist list is not cached, fetching');
        lotus_request('artist', true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        Object.assign(artist_corrections, JSON.parse(lotus_artist));

        // is it valid?
        if (lotus_artist_expire < current_time && !force) {
            lotus_request();
        } else if (force) {
            lotus_request('artist', true);
        }
    }

    if (lotus_album_track == null) {
        console.info('lotus - album_track list is not cached, fetching');
        lotus_request('album_track', true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        Object.assign(album_track_corrections, JSON.parse(lotus_album_track));

        // is it valid?
        if (lotus_album_track_expire < current_time && !force) {
            lotus_request('album_track');
        } else if (force) {
            lotus_request('album_track', true);
        }
    }
}

function lotus_request(type = 'artist', send_notify = false) {
    let button = document.body.querySelector('[onclick="_lotus_check()"]');
    if (button != null)
        button.setAttribute('disabled', '');

    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/lotus/${type}.json?${Math.random()}`;
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`${type} list responded with ${xhr.status}`, 'lotus');

        if (xhr.status != 200) {
            log('request has been cancelled, will request again in 1h', 'lotus');
            api_expire.setHours(api_expire.getHours() + 1);
        }

        // set expire date
        let api_expire = new Date();

        if (xhr.status == 200) {
            if (type == 'artist') {
                Object.assign(artist_corrections, JSON.parse(this.response));
            } else {
                Object.assign(album_track_corrections, JSON.parse(this.response));
            }

            if (send_notify) {
                notify({
                    title: trans_legacy.en.lotus[type],
                    icon: 'icon-16-lotus',
                    classname: 'lotus'
                });
            }

            // save to cache for next page load
            localStorage.setItem(`lotus_${type}`, this.response);
            api_expire.setHours(api_expire.getHours() + 4);
            log(`${type} list cached until ${api_expire}`, 'lotus');
        }

        localStorage.setItem(`lotus_${type}_expire`, api_expire);

        if (button != null)
            button.removeAttribute('disabled');
    }

    xhr.send();
}


unsafeWindow._lotus_check = function() {
    lotus(true);
}


unsafeWindow._open_correction_modal = function() {
    dialog({
        id: 'corrections',
        title: trans_legacy.en.settings.corrections.name,
        body: html.node`
            <h4>${trans_legacy.en.settings.corrections.listing.artists}</h4>
            <div class="corrections artist" id="corrections-artist"></div>
            <h4>${trans_legacy.en.settings.corrections.listing.albums_tracks}</h4>
            <div class="corrections album_tracks" id="corrections-albums_tracks"></div>
        `,
        has_close: true,
        type: 'corrections',
        allow_scroll: true
    });

    prepare_corrections_page();
}


/**
 * correct capitalisation of a generic artist name combo
 * @param {string} parent individual css selector for each item wrapper
 * @returns if not found
 */
export function correct_generic_artist(parent) {
    let albums = document.body.querySelectorAll(`.${parent}`);
    if (albums.length == 0) return;

    if (!settings.corrections) return;

    albums.forEach((album) => {
        if (!album.hasAttribute('data-kate-processed')) {
            album.setAttribute('data-kate-processed', 'true');

            let artist_name = album.querySelector(`.${parent.replace('-details', '')}-name a`);
            if (!artist_name)  return;

            let corrected_artist_name = correct_artist(artist_name.textContent);

            artist_name.textContent = corrected_artist_name;
        }
    });
}
/**
 * correct capitalisation of a generic album/track name & artist combo
 * @param {string} parent individual css selector for each item wrapper
 * @returns if not found
 */
export function correct_generic_combo(parent) {
    let albums = document.body.querySelectorAll(`.${parent}`);
    if (albums.length == 0) return;

    if (!settings.corrections) return;

    albums.forEach((album) => {
        if (!album.hasAttribute('data-kate-processed')) {
            album.setAttribute('data-kate-processed','true');

            let album_name = album.querySelector(`.${parent.replace('-details','')}-name a`);
            if (!album_name) return;

            let artist_name = album.querySelector(`.${parent.replace('-details','')}-artist a`);

            if (!artist_name) return;

            let corrected_album_name = correct_item_by_artist(album_name.textContent, artist_name.textContent);
            let corrected_artist_name = correct_artist(artist_name.textContent);

            album_name.textContent = corrected_album_name;
            artist_name.textContent = corrected_artist_name;
        }
    });
}
/**
 * correct capitalisation of a generic album/track name (no artist field!!) combo
 * @param {string} parent individual css selector for each item wrapper
 * @returns if not found
 */
export function correct_generic_combo_no_artist(parent) {
    let albums = document.body.querySelectorAll(`.${parent}`);
    if (albums.length == 0) return;

    if (!settings.corrections) return;

    albums.forEach((album) => {
        if (!album.hasAttribute('data-kate-processed')) {
            album.setAttribute('data-kate-processed','true');

            let album_name = album.querySelector(`.${parent.replace('-details','')}-name a`);
            if (!album_name) return;

            let artist_name = return_artist_from_generic(album_name.getAttribute('href'));

            let corrected_album_name = correct_item_by_artist(album_name.textContent, artist_name);
            album_name.textContent = corrected_album_name;
        }
    });
}


/**
 * correct item based on artist
 * @param {string} item either a track/album title
 * @param {string} artist artist name (is converted to lowercase)
 * @returns {string} corrected title if applicable or original title
 */
export function correct_item_by_artist(item, artist) {
    if (!settings.corrections)
        return item;
    artist = artist.toLowerCase();

    try {
        if (album_track_corrections.hasOwnProperty(artist)) {
            if (album_track_corrections[artist].hasOwnProperty(item)) {
                log(`corrected ${item} by ${artist} as ${album_track_corrections[artist][item]}`, 'lotus');
                return album_track_corrections[artist][item];
            } else {
                return item;
            }
        } else {
            return item;
        }
    } catch(e) {
        log(`correcting ${item} by ${artist}`, 'lotus');
        console.error(e);
        return item;
    }
}
/**
 * correct artist
 * @param {string} artist artist name (NOT converted to lowercase)
 * @returns corrected artist if applicable or original artist
 */
export function correct_artist(artist, broadcast = false) {
    if (!settings.corrections)
        return artist;

    try {
        if (artist_corrections.hasOwnProperty(artist)) {
            log(`corrected ${artist} as ${artist_corrections[artist]}`, 'lotus');
            if (broadcast)
                page.corrected = true;

            return artist_corrections[artist];
        } else {
            if (broadcast)
                page.corrected = false;

            return artist;
        }
    } catch(e) {
        log(`correcting ${artist}`, 'lotus');
        console.error(e);
        return artist;
    }
}


// feat.
export function name_includes(original_title, original_artist) {
    // track if we applied an album/track correction
    let original_title_corrected = false;
    // start with the raw title, then apply any album_track_corrections
    let formatted_title = original_title;
    const artist_key = original_artist.toLowerCase();
    if (
        album_track_corrections.hasOwnProperty(artist_key) &&
        settings.corrections
    ) {
        const corr_map = album_track_corrections[artist_key];
        if (corr_map.hasOwnProperty(formatted_title)) {
            formatted_title = corr_map[formatted_title];
            log(`corrected ${original_title} by ${original_artist} as ${formatted_title}`, 'lotus');
            original_title_corrected = true;
        }
    }

    const lower_title = formatted_title.toLowerCase();
    // find all tag‐matches (idx ≥ 1), with special remaster logic
    // due to Nirvana nonsense such as 20th Anniversary Remaster etc.
    const matches = flat_patterns
        .map(({group, pat}) => ({
            group,
            pat,
            idx: lower_title.indexOf(pat)
        }))
        .filter(m => {
            if (m.idx < 1) return false;
            if (
                m.group === 'remasters' &&
                !lower_title.includes(' remaster') &&
                !lower_title.includes('(remaster')
            ) {
                return false;
            }
            return true;
        })
        .sort((a, b) => a.idx - b.idx);

    // apply any artist corrections
    if (
        artist_corrections.hasOwnProperty(original_artist) &&
        settings.corrections
    ) {
        original_artist = correct_artist(
            artist_corrections[original_artist]
        );
    }

    // no tags found → return original title and flags
    if (matches.length === 0) {
        return [
            formatted_title,
            [],
            original_artist,
            [],
            original_title_corrected
        ];
    }

    // everything before the first tag
    const cleaned_title = formatted_title
        .slice(0, matches[0].idx)
        .trim()
        .replace(/[\(\[\{]+$/, '')
        .trim();

    // extract each tag block
    const extras = matches.map((match, i) => {
        const start = match.idx;
        const end = i + 1 < matches.length
            ? matches[i + 1].idx
            : formatted_title.length;
        const tag_text = formatted_title
            .slice(start, end)
            // strip only leading brackets () [] {} or hyphens and whitespace
            .replace(/^[\(\[\{\-\s]+/, '')
            // strip any trailing brackets () [] {}, hyphens or whitespace
            .replace(/[\(\)\[\]\{\}\-\s]+$/, '')
            .trim();
        return {
            group: match.group,
            text: tag_text
        };
    });

    // collect all guest artists
    // artists with commas in their title can mistakenly be separated
    // into multiple artists, so we fix them manually
    // see Tyler, The Creator
    let song_guests = [];
    extras.forEach(extra => {
        if (extra.group !== 'guests') return;
        const normalized = extra.text
            .replace(/feat\.?|ft\.?|featuring|with|w\//gi, '')
            .replace(/ & /g, ';')
            .replace(/, /g, ';')
            .replace(/ and /gi, ';')
            .replace(/- /g, '')
            .replace(/,;/g, ';')
            .replace(/tyler;the/gi, 'Tyler, The')
            .replace(/ of bts/gi, ';BTS')
            .replace(/marina;the diamonds/gi, 'Marina and The Diamonds')
            .replace(/selena gomez;the scene/gi, 'Selena Gomez & the Scene');
        const guests = normalized
            .split(/;+/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(correct_artist);
        song_guests.push(...guests);
    });

    return [
        cleaned_title,
        extras,
        original_artist,
        song_guests,
        original_title_corrected
    ];
}


export function artist_title() {
    let title = document.body.querySelector('.header-new-title');
    let title_text = title.textContent.trim();

    let has_multi = false;
    if (title_text.includes(', ') || title_text.includes(' & '))
        has_multi = true;

    page.multi = false;

    if (!has_multi) {
        if (!settings.corrections)
            return;

        title.textContent = correct_artist(title_text, true);
    } else {
        title_text = title_text
        .replaceAll(' & ', ';').replaceAll(', ', ';')
        .replace('Tyler;the', 'Tyler, The').replace('Tyler;The', 'Tyler, The')
        .replace('Marina;the Diamonds', 'Marina and The Diamonds')
        .replace(/selena gomez;the scene/gi, 'Selena Gomez & the Scene')
        .replaceAll(';;', ';');

        page.multi = true;
        title.innerHTML = '';

        let split = title_text.split(';');

        if (split.length < 2) {
            page.multi = false;

            if (!settings.corrections)
                return;

            title.textContent = correct_artist(title_text, true);

            return;
        }

        split.forEach((artist, index) => {
            if (index > 0)
                title.innerHTML += ',';

            let part = document.createElement('a');
            part.classList.add('multi-artist-part');
            part.setAttribute('href',`${root}music/${sanitise(artist)}`);

            if (settings.corrections)
                part.textContent = correct_artist(artist);
            else
                part.textContent = artist;

            title.appendChild(part);
        });
    }
}

export function patch_header_title() {
    if (!settings.corrections && !settings.format_guest_features && !page.multi)
        return;

    page.corrected = false;

    let track_title = document.body.querySelector('.header-new-title');
    let track_artist = document.body.querySelector('.header-new-crumb span');

    if (!track_title)
        return;

    // correct artist
    if (!track_artist) {
        // must be on artist page
        if (artist_corrections.hasOwnProperty(track_title.textContent)) {
            let corrected_artist = artist_corrections[track_title.textContent];
            log(`corrected ${track_title.textContent} as ${corrected_artist}`, 'lotus');
            track_title.textContent = corrected_artist;

            page.corrected = true;
        }

        return;
    } else {
        // album/track page
        if (artist_corrections.hasOwnProperty(track_artist.textContent)) {
            let corrected_artist = artist_corrections[track_artist.textContent];
            log(`corrected ${track_artist.textContent} as ${corrected_artist}`, 'lotus');
            track_artist.textContent = corrected_artist;
        }
    }

    if (settings.format_guest_features) {
        try {
        if (!track_title.hasAttribute('data-kate-processed')) {
            track_title.setAttribute('data-kate-processed','true');

            let formatted_title = name_includes(track_title.textContent, track_artist.textContent);
            let song_title = formatted_title[0];
            let song_tags = formatted_title[1];

            page.corrected = formatted_title[4];

            // combine
            render(track_title, html.node`
                <div class="title">${song_title.trim()}</div>
                ${song_tags.map((tag) => html.node`
                    <div class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</div>
                `)}
            `);

            let song_artist_element = document.body.querySelector('span[itemprop="byArtist"]');
            let song_guests = formatted_title[3];
            page.sister_others = formatted_title[3];
            song_artist_element.innerHTML = song_artist_element.innerHTML.trim();
            for (let guest in song_guests) {
                // &
                song_artist_element.innerHTML = `${song_artist_element.innerHTML},`;

                // no whitespace to make sure it looks correct
                song_artist_element.appendChild(html.node`
                    <a class="header-new-crumb" href="${root}music/${sanitise(song_guests[guest])}" title=${song_guests[guest]}>${song_guests[guest]}</a>
                `);
            }
        }
        } catch(e) {}
    } else {
        if (!track_title.hasAttribute('data-kate-processed')) {
            track_title.setAttribute('data-kate-processed','true');

            let corrected_title = correct_item_by_artist(track_title.textContent, track_artist.textContent);
            log(`corrected ${track_title.textContent} by ${track_artist.textContent} as ${corrected_title}`, 'lotus');

            if (corrected_title != track_title.textContent)
                page.corrected = true;

            track_title.textContent = corrected_title;
        }
    }
}
