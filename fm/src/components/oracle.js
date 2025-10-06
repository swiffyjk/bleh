//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import { html, render } from 'lighterhtml';
import { log } from '../build/log';
import {
    oracle_albums,
    oracle_artists,
    oracle_tracks,
    page,
    root
} from '../build/page';
import { romanise, sanitise } from '../build/tools';
import { ff } from '../sku';
import { correct_artist, correct_item_by_artist } from './lotus';
import { tl, trans } from '../build/trans';
import { clean_title, fix_title } from '../build/music';
import { version } from '../main';
import { settings } from '../build/config';
import { dialog } from './dialog';
import tippy, { followCursor } from 'tippy.js';

export function oracle_process() {
    log('beginning', 'oracle');

    page.state.oracle_debug = {};

    if (ff('oracle_album_reordering') && page.type == 'track') {
    }

    if (!ff('oracle_connect') || page.type == 'artist') return;

    let tries = 2;
    const item = page.name.toLowerCase();
    const artist = page.sister.toLowerCase();
    let artist_data;

    let artist_template = `artist:"${page.sister}"`;

    const info_panel = page.structure.main.firstElementChild;
    const header = page.structure.container.querySelector('.redesigned-header');
    let releases_panel;
    if (page.type == 'track') {
        releases_panel = html.node`
            <section class="oracle-releases">
                <h3 class="text-18">${tl(trans.releases)}</h3>
                <div class="source-albums">
                    <div class="source-album oracle-loading">
                        <div class="source-album-art">
                            <span class="cover-art oracle-loading">
                                <img class="empty">
                            </span>
                        </div>
                        <div class="source-album-details" data-kate-processed="true">
                            <h4 class="source-album-name oracle-loading" />
                            <p class="source-album-artist oracle-loading" />
                            <p class="source-album-stats oracle-stats oracle-loading" />
                        </div>
                    </div>
                    <div class="source-album oracle-loading">
                        <div class="source-album-art">
                            <span class="cover-art oracle-loading">
                                <img class="empty">
                            </span>
                        </div>
                        <div class="source-album-details" data-kate-processed="true">
                            <h4 class="source-album-name oracle-loading" />
                            <p class="source-album-artist oracle-loading" />
                            <p class="source-album-stats oracle-stats oracle-loading" />
                        </div>
                    </div>
                </div>
            </section>
        `;
        info_panel.after(releases_panel);
    }

    const albums_and_lyrics_row = page.structure.main.querySelector(
        '.album-and-lyrics-row'
    );
    if (page.type == 'track')
        albums_and_lyrics_row.classList.add('oracle-hidden');

    function oracle_aliases(artist, desired) {
        log('alias request', 'oracle', 'log', {
            artist,
            desired,
            artist_data
        });

        if (
            artist.name.toLowerCase() == desired.toLowerCase() ||
            (artist_data.type == 'id' && artist.artist.id == artist_data.name)
        )
            return desired;

        return artist.name;
    }

    oracle_obtain_artist();

    function oracle_obtain_artist() {
        if (oracle_artists.hasOwnProperty(artist)) {
            artist_data = {
                type: 'id',
                name: oracle_artists[artist]
            };
            artist_template = `arid:"${oracle_artists[artist]}"`;
            oracle_connect();
            return;
        }

        artist_data = {
            type: 'name',
            name: page.sister
        };
        oracle_connect();
    }

    function oracle_get_artist() {
        if (tries < 1) return;
        tries--;

        const url = `http://musicbrainz.org/ws/2/artist?query=${sanitise(artist, ' ')}`;

        log(
            `using url ${encodeURI(url)} with ${tries} tries available`,
            'oracle'
        );

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: {
                'User-Agent': `bleh/${version.build} <https://github.com/katelyynn/bleh>`,
                Accept: 'application/json'
            },
            onload: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    log('error fetching artist data', 'oracle', 'error', {
                        response
                    });
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('failed to parse', 'oracle', 'error', { e });
                    return;
                }

                log('received artist data', 'oracle', 'info', { data });

                artist_data = data.artists[0];
                cache[artist] = artist_data;

                if (Object.keys(cache).length > 100) delete cache[0];

                localStorage.setItem(
                    'oracle_artist_ids',
                    JSON.stringify(cache)
                );

                tries = 2;
                oracle_connect();
            },
            onerror: function (err) {
                console.error('oracle', err);

                setTimeout(() => {
                    oracle_get_artist();
                }, 1000);
            }
        });
    }

    function oracle_connect() {
        if (tries < 1) return;
        tries--;

        let url;

        page.state.oracle_debug.artist = artist_data;
        log('using artist data', 'oracle', 'info', { artist_data });

        if (page.type == 'track')
            url = `https://musicbrainz.org/ws/2/recording?query="${sanitise(clean_title(page.name), ' ')}" AND ${artist_template} AND status:Official`;
        else if (page.type == 'album')
            url = `http://musicbrainz.org/ws/2/release?query=release:"${sanitise(clean_title(page.name), ' ')}" AND ${artist_template}`;

        if (
            page.type == 'album' &&
            oracle_albums.hasOwnProperty(artist) &&
            oracle_albums[artist][item] &&
            oracle_albums[artist][item].id
        ) {
            log(
                'skipping album search as an id was supplied',
                'oracle',
                'info',
                { oracle_albums, item: oracle_albums[item] }
            );
            tries = 2;

            oracle_album_fetch({
                id: oracle_albums[artist][item].id
            });
            return;
        }

        log(
            `using url ${encodeURI(url)} with ${tries} tries available`,
            'oracle'
        );

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: {
                'User-Agent': `bleh/${version.build} <https://github.com/katelyynn/bleh>`,
                Accept: 'application/json'
            },
            onload: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    log('error fetching connect data', 'oracle', 'error', {
                        response
                    });
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('failed to parse', 'oracle', 'error', { e });
                    return;
                }

                log('received connect data', 'oracle', 'info', { data });
                page.state.oracle = data;

                oracle(data);
            },
            onerror: function (err) {
                console.error('oracle', err);

                setTimeout(() => {
                    oracle_connect();
                }, 1000);
            }
        });
    }

    function oracle(data) {
        if (page.type == 'track') {
            oracle_track_releases(data);
        } else if (page.type == 'album') {
            tries = 2;

            const release = oracle_pick_release(data);

            if (!release) {
                log('no data to use, ending', 'oracle', 'info', {
                    data,
                    release
                });
                return;
            }

            page.state.oracle_debug.release_id = release.id;
            log('picked release, proceeding', 'oracle', 'info', {
                data,
                release
            });

            setTimeout(() => {
                oracle_album_fetch(release);
            }, 400);
        }
    }

    function oracle_pick_recording(data) {
        if (!data || !data.recordings) return null;

        const filtered = data.recordings.filter((recording) => {
            if (!recording.releases || recording.releases.length === 0)
                return false;

            return recording.releases.some((release) => {
                const artists = release['artist-credit'] || [];
                const various = artists.some(
                    (artist) => artist.name == 'Various Artists'
                );
                const official = release.status == 'Official';

                return !various && official;
            });
        });

        if (filtered.length === 0) return null;

        // prefer explicit
        let best = filtered.find(
            (recording) =>
                recording.disambiguation?.toLowerCase() === 'explicit'
        );
        if (best) return best;

        // check if there's one without any disambiguation
        // before going for a clean release
        best = filtered.find((recording) => !recording.disambiguation);
        if (best) return best;

        // then clean
        best = filtered.find(
            (recording) => recording.disambiguation?.toLowerCase() === 'clean'
        );
        if (best) return best;

        // try anything explicit
        best = filtered.find((recording) =>
            recording.disambiguation?.toLowerCase().includes('explicit')
        );
        if (best) return best;

        // try anything clean
        best = filtered.find((recording) =>
            recording.disambiguation?.toLowerCase().includes('clean')
        );
        if (best) return best;

        // avoid anything referencing english
        // usually an english translation of
        // e.g. a japanese album
        // also avoid music videos
        best = filtered.find((recording) => {
            const disambiguation =
                recording.disambiguation?.toLowerCase() || '';
            const video = recording.video;
            return (
                !disambiguation.includes('english') &&
                !disambiguation.endsWith('mv') &&
                !video
            );
        });
        if (best) return best;

        // avoid a music video
        best = filtered.find(
            (recording) =>
                !recording.disambiguation?.toLowerCase().endsWith('mv')
        );
        if (best) return best;

        // otherwise any
        return filtered[0];
    }

    function oracle_pick_release(data) {
        if (!data || !data.releases) return null;

        const filtered = data.releases.filter((release) => {
            const artists = release['artist-credit'] || [];
            const various = artists.some(
                (artist) => artist.name == 'Various Artists'
            );
            const official = release.status == 'Official';

            return !various && official;
        });

        // prefer a digital release
        // and albums with higher track counts
        filtered.sort((a, b) => {
            const a_media = a.media?.[0]?.format == 'Digital Media';
            const b_media = b.media?.[0]?.format == 'Digital Media';

            if (a_media == b_media) return 0;

            if (a_media != b_media) return a_media ? -1 : 1;

            return (b['track-count'] || 0) - (a['track-count'] || 0);
        });

        if (filtered.length == 0) return null;

        log('filtered releases before picking', 'oracle', 'info', { filtered });

        // prefer explicit
        let best = filtered.find(
            (release) => release.disambiguation?.toLowerCase() == 'explicit'
        );
        if (best) return best;

        // check if there's one without any disambiguation
        // before going for a clean release
        best = filtered.find((release) => !release.disambiguation);
        if (best) return best;

        // then clean
        best = filtered.find(
            (release) => release.disambiguation?.toLowerCase() == 'clean'
        );
        if (best) return best;

        // then hi-res
        // for taylor
        best = filtered.find(
            (release) => release.disambiguation?.toLowerCase() == 'hi-res'
        );
        if (best) return best;

        // then dolby atmos
        best = filtered.find(
            (release) =>
                release.disambiguation?.toLowerCase() == 'dolby atmos mix'
        );
        if (best) return best;

        // try anything explicit
        best = filtered.find((release) =>
            release.disambiguation?.toLowerCase().includes('explicit')
        );
        if (best) return best;

        // try anything clean
        best = filtered.find((release) =>
            release.disambiguation?.toLowerCase().includes('clean')
        );
        if (best) return best;

        // avoid anything referencing english
        // usually an english translation of
        // e.g. a japanese album
        // also avoid music videos
        best = filtered.find((release) => {
            const disambiguation = release.disambiguation?.toLowerCase() || '';
            return (
                !disambiguation.includes('english') &&
                !disambiguation.endsWith('mv')
            );
        });
        if (best) return best;

        // otherwise any
        return filtered[0];
    }

    function oracle_album_fetch(data) {
        if (tries < 1) return;
        tries--;

        const url = `http://musicbrainz.org/ws/2/release/${data.id}?inc=recordings+labels+artist-credits`;

        log(
            `using url ${encodeURI(url)} with ${tries} tries available`,
            'oracle'
        );

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: {
                'User-Agent': `bleh/${version.build} <https://github.com/katelyynn/bleh>`,
                Accept: 'application/json'
            },
            onload: function (response) {
                if (response.status < 200 || response.status >= 300) {
                    log('error fetching connect data', 'oracle', 'error', {
                        response
                    });
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('failed to parse', 'oracle', 'error', { e });
                    return;
                }

                log('received connect album data', 'oracle', 'info', { data });
                page.state.oracle = data;

                oracle_album(data);
            },
            onerror: function (err) {
                console.error('oracle', err);

                setTimeout(() => {
                    oracle_album_fetch(data);
                }, 1000);
            }
        });
    }

    function oracle_album(data) {
        let labels = data['label-info'];
        if (labels && labels.length > 0) {
            // filter out visually duplicates
            const seen = new Set();
            labels = labels.filter((label) => {
                const name = label.label.name;
                if (seen.has(name)) return false;

                seen.add(name);
                return true;
            });

            info_panel.appendChild(html.node`
                <div class="card-tip copyright">
                    ©
                    ${labels.map((label, index) => {
                        let label_elem;
                        const elem = html.node`
                            <span class="music-label" ref=${(el) => (label_elem = el)}>${label.label.name}</span>${index < labels.length - 1 ? ', ' : ''}
                        `;

                        if (label.label.disambiguation != '') {
                            tippy(label_elem, {
                                content: label.label.disambiguation
                            });
                        }

                        return elem;
                    })}
                </div>
            `);
        }

        const artist = data['artist-credit'][0].name.toLowerCase();
        const album = page.name.toLowerCase();

        const defaults = {
            guests_in_title: true
        };

        const oracle_entry = {
            ...defaults,
            ...((
                oracle_albums.hasOwnProperty(artist) &&
                oracle_albums[artist].hasOwnProperty(album)
            ) ?
                oracle_albums[artist][album]
            :   {})
        };
        log('entry', 'oracle', 'info', { oracle_entry });

        const media = data.media;
        const discs = media.filter((item) => item.tracks != null);

        const track_panel = html.node`
            <section class="oracle-tracks">
                <h3 class="text-18">${tl(trans.tracklist)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                ${discs.map((disc) => render_tracklist(disc, discs.length, artist))}
            </section>
        `;

        info_panel.after(track_panel);

        function render_tracklist(disc, length, retrieved_artist) {
            return html.node`
                ${
                    length > 1 ?
                        html.node`
                <div class="sub-text normal disc-header">
                    <span class="bleh-icon" style="--icon: var(--mask)" />
                    ${tl(trans.disc_number, { n: disc.position })}
                </div>
                `
                    :   ''
                }
                <table class="chartlist chartlist--with-index chartlist--with-index--length-1 chartlist--with-artist chartlist--with-more chartlist--with-duration chartlist--with-bar">
                    <tbody>
                        ${disc.tracks.map((track) => {
                            let title = fix_title(track.title);

                            const artist_lower =
                                track['artist-credit'][0].name.toLowerCase();
                            const title_lower = title.toLowerCase();

                            const track_entry =
                                (
                                    oracle_tracks.hasOwnProperty(
                                        artist_lower
                                    ) &&
                                    oracle_tracks[artist_lower].hasOwnProperty(
                                        title_lower
                                    )
                                ) ?
                                    oracle_tracks[artist_lower][title_lower]
                                :   null;

                            const total_s = Math.floor(track.length / 1000);
                            const m = Math.floor(total_s / 60);
                            const s = total_s % 60;

                            const disambig = track.recording.disambiguation;
                            const video = track.recording.video;

                            if (video) return html.node``;

                            const artists = track['artist-credit'];
                            let inherit_guests = [];
                            let guests = [];
                            let found_feature = false;
                            let first_joinphrase;

                            for (let i = 1; i < artists.length; i++) {
                                const artist = artists[i];
                                const joinphrase = (
                                    artists[i - 1].joinphrase || ''
                                )
                                    .trim()
                                    .toLowerCase();

                                if (!found_feature) {
                                    if (joinphrase.includes('feat')) {
                                        found_feature = true;
                                        first_joinphrase = joinphrase;

                                        guests.push(artist);
                                    } else {
                                        inherit_guests.push(artist);
                                    }
                                } else {
                                    guests.push(artist);
                                }
                            }

                            log(`${track.position}: artists`, 'oracle', 'log', {
                                artists,
                                guests,
                                inherit_guests
                            });

                            if (track_entry) {
                                title = track_entry;
                            } else if (
                                oracle_entry.guests_in_title &&
                                guests.length > 0
                            ) {
                                title += ` (${first_joinphrase} `;

                                guests.forEach((artist, index) => {
                                    log(`guest ${index}`, 'oracle', 'info', {
                                        artist
                                    });
                                    let joinphrase = artist.joinphrase || '';

                                    if (
                                        index == guests.length - 2 &&
                                        oracle_entry.final_guest_separator
                                    )
                                        joinphrase =
                                            oracle_entry.final_guest_separator;

                                    title += `${fix_title(artist.name)}${joinphrase}`;
                                });

                                title += ')';
                            }

                            log(`${track.position}: title`, 'oracle', 'log', {
                                title
                            });

                            const elem = html.node`
                                <tr class="chartlist-row" data-disambig=${disambig}>
                                    <td class="chartlist-index">${track.position}</td>
                                    <td class="chartlist-name">
                                        <a href="${root}music/${oracle_aliases(track['artist-credit'][0], page.sister)}/_/${sanitise(title)}" data-name=${title} data-inherit-artists=${inherit_guests.map((artist) => sanitise(fix_title(artist.name), ' ')).join(';')}>
                                            ${title}
                                        </a>
                                    </td>
                                    <td class="chartlist-duration">
                                        ${m}:${s.toString().padStart(2, '0')}
                                    </td>
                                </tr>
                            `;

                            return elem;
                        })}
                    </tbody>
                </table>
            `;
        }
    }

    function oracle_track_releases(data) {
        // let's comb through the releases to remove
        // various artists
        let releases = [];
        let releases_to_move = [];

        // let's also look thru the last.fm provided ones
        // to possibly get listener and cover data
        let lastfm_releases = [];
        const lastfm_source_albums =
            albums_and_lyrics_row.querySelectorAll('.source-album');
        // you may ask why im not cleaning the title here
        // its to avoid misleading the listener count incase it tries to show
        // the listener count for GNX (Spotify) under GNX
        lastfm_source_albums.forEach((release) => {
            lastfm_releases.push({
                title: release.querySelector('.source-album-name').textContent,
                artist: release.querySelector('.source-album-artist')
                    .textContent,
                plays: release
                    .querySelector('.source-album-stats')
                    .firstChild.textContent.trim(),
                artwork: release.querySelector(
                    '.source-album-art > .cover-art > img'
                ).src
            });
        });

        const recording = oracle_pick_recording(data);

        if (!recording) {
            render(
                releases_panel,
                html`
                    <h3 class="text-18">
                        ${tl(trans.releases)}<span class="new-badge beta"
                            >${tl(trans.beta)}</span
                        >
                    </h3>
                    <div class="loading-data-container">
                        <div class="loading-data-text failed">
                            No releases found
                        </div>
                    </div>
                `
            );
            return;
        }

        page.state.oracle_debug.recording_id = recording.id;
        log('picked recording, proceeding', 'oracle', 'info', {
            data,
            recording
        });

        if (recording) {
            log('releases in recording', 'oracle', 'info', {
                recording,
                releases: recording.releases
            });
            recording.releases.forEach((release) => {
                const artist =
                    release['artist-credit'] ?
                        release['artist-credit'][0].name
                    :   recording['artist-credit'].name;

                if (artist == 'Various Artists') return;

                const status = release.status?.toLowerCase();
                const disambiguation = release.disambiguation?.toLowerCase();

                // seems to ignore english translations of jp albums sometimes
                if (status && status.startsWith('pseudo')) return;

                if (disambiguation) {
                    if (disambiguation.includes('english')) {
                        releases_to_move.push(release);
                        return;
                    }
                }

                releases.push(release);
            });

            releases.push(...releases_to_move);

            log('releases in recording after parsing', 'oracle', 'info', {
                releases
            });

            // makes 'Bootleg' less likely if there's duplicates
            releases.sort((a, b) => {
                const rank = (status) => {
                    if (status == 'Official') return 0;
                    if (!status) return 1;
                    return 2;
                };

                return rank(a.status) - rank(b.status);
            });

            releases = releases.filter(
                (release, index, self) =>
                    index ==
                    self.findIndex((r) => {
                        const r_artist = r['artist-credit']?.[0]?.name;
                        const release_artist =
                            release['artist-credit']?.[0]?.name;
                        return (
                            r.title == release.title &&
                            r_artist == release_artist
                        );
                    })
            );

            releases.sort((a, b) => {
                const rank = (type) => {
                    if (!type) return 4;

                    type = type.toLowerCase();

                    if (type == 'album') return 0;
                    if (type == 'ep') return 1;
                    if (type != 'single') return 2;
                    return 3;
                };

                const artist_matches = (release) => {
                    return release['artist-credit']?.some((artist) => {
                        const name = oracle_aliases(artist, page.sister);
                        return name.toLowerCase() == page.sister.toLowerCase();
                    });
                };

                const a_artist_match = artist_matches(a);
                const b_artist_match = artist_matches(b);

                if (a_artist_match && !b_artist_match) return -1;
                if (!a_artist_match && b_artist_match) return 1;

                return (
                    rank(a['release-group']['primary-type']) -
                    rank(b['release-group']['primary-type'])
                );
            });

            log('releases in recording after filter', 'oracle', 'info', {
                releases
            });

            render(
                releases_panel,
                html`
                    <h3 class="text-18">
                        ${tl(trans.releases)}<span class="new-badge beta"
                            >${tl(trans.beta)}</span
                        >
                    </h3>
                    <div class="source-albums">
                        ${releases.map((release, index) => {
                            if (index > 1) return html.node``;

                            log('release', 'oracle', 'log', { release });
                            let title = clean_title(release.title);
                            const artist = oracle_aliases(
                                release['artist-credit']?.[0] ||
                                    recording['artist-credit'][0],
                                page.sister
                            );

                            const types = {
                                album: tl(trans.album),
                                single: tl(trans.single),
                                ep: 'EP',
                                other: tl(trans.other)
                            };

                            let type = release['release-group']['primary-type'];
                            if (type && type.toLowerCase() in types)
                                type = types[type.toLowerCase()];

                            const artist_lower = page.sister.toLowerCase();
                            const title_lower = title.toLowerCase();

                            const defaults = {
                                guests_in_title: false
                            };

                            const oracle_entry = {
                                ...defaults,
                                ...((
                                    oracle_albums.hasOwnProperty(
                                        artist_lower
                                    ) &&
                                    oracle_albums[artist_lower].hasOwnProperty(
                                        title_lower
                                    )
                                ) ?
                                    oracle_albums[artist_lower][title_lower]
                                :   {})
                            };
                            log('entry', 'oracle', 'info', { oracle_entry });

                            if (oracle_entry.disambiguation) {
                                if (
                                    oracle_entry.disambiguation[
                                        release.disambiguation
                                    ]
                                )
                                    title =
                                        oracle_entry.disambiguation[
                                            release.disambiguation
                                        ];
                                else if (oracle_entry.disambiguation.other)
                                    title = oracle_entry.disambiguation.other;
                            }

                            // is there a matching last.fm entry available atm?
                            const match = lastfm_releases.find(
                                (r) => r.title == title && r.artist == artist
                            );

                            let plays = 0;
                            let artwork;
                            if (match) {
                                plays = match.plays;
                                artwork = match.artwork;
                            }

                            let artwork_container;
                            let stats;

                            const elem = html.node`
                                <div class="source-album js-link-block link-block-cover-link">
                                    <div class="source-album-art" ref=${(el) => (artwork_container = el)}>
                                        ${
                                            artwork ?
                                                html.node`
                                                    <span class="cover-art">
                                                        <img src=${artwork} alt=${title}>
                                                    </span>
                                                `
                                            :   ''
                                        }
                                    </div>
                                    <div class="source-album-details" data-kate-processed="true">
                                        <h4 class="source-album-name">${romanise(correct_item_by_artist(title, artist))}</h4>
                                        <p class="source-album-artist">${romanise(correct_artist(artist))}</p>
                                        <p class="source-album-stats oracle-stats" ref=${(el) => (stats = el)}>
                                            ${type}
                                            ${
                                                match ?
                                                    html.node`
                                                        <span class="plays">
                                                            <span class="bleh-icon" />
                                                            ${plays}
                                                        </span>
                                                    `
                                                :   ''
                                            }
                                        </p>
                                        <a class="js-link-block-cover-link link-block-cover-link" href="${root}music/${sanitise(artist)}/${sanitise(title)}" tabindex="-1" aria-hidden="true" />
                                    </div>
                                </div>
                            `;

                            if (!artwork && index < 2)
                                load_cover_art(
                                    artwork_container,
                                    title,
                                    artist,
                                    stats,
                                    type
                                );

                            return elem;
                        })}
                    </div>
                `
            );

            const artist_elem = header.querySelector('h2');
            if (recording.disambiguation == 'explicit') {
                artist_elem.insertBefore(
                    html.node`
                    <span class="track-explicit">${tl(trans.explicit)}</span>
                `,
                    artist_elem.firstChild
                );
            }
        } else {
            render(
                releases_panel,
                html`
                    <h3 class="text-18">
                        ${tl(trans.releases)}<span class="new-badge beta"
                            >${tl(trans.beta)}</span
                        >
                    </h3>
                    <div class="loading-data-container">
                        <div class="loading-data-text failed">
                            No releases found
                        </div>
                    </div>
                `
            );
        }
    }

    function load_cover_art(parent, title, artist, stats = null, type = null) {
        render(
            parent,
            html`
                <span class="cover-art oracle-loading">
                    <span class="loading-spinner">
                        <span class="bleh-icon" />
                    </span>
                    <img class="empty" />
                </span>
            `
        );

        if (!ff('oracle_fetch_artwork')) return;

        fetch(`${root}music/${sanitise(artist)}/${sanitise(title)}/`)
            .then((res) => {
                if (!res.ok) {
                    log('error fetching cover art', 'oracle', 'error', { res });

                    render(
                        parent,
                        html`
                            <span class="cover-art">
                                <img class="missing-album error" />
                            </span>
                        `
                    );

                    throw new Error();
                }

                return res.text();
            })
            .then((dom) => {
                const doc = new DOMParser().parseFromString(dom, 'text/html');

                const background_image = doc.querySelector(
                    '.header-new-background-image'
                );
                if (!background_image) {
                    render(
                        parent,
                        html`
                            <span class="cover-art">
                                <img class="missing-album" />
                            </span>
                        `
                    );
                    return;
                }

                render(
                    parent,
                    html`
                        <span class="cover-art">
                            <img
                                src=${background_image
                                    .getAttribute('content')
                                    .replace('/ar0/', '/300x300/')}
                                alt=${title}
                            />
                        </span>
                    `
                );

                if (!stats || !type) return;

                const listeners = doc.querySelector(
                    '.header-new-info-desktop .header-metadata-tnew-display > p > abbr'
                );
                console.info('oracle', listeners);
                if (!listeners) return;

                render(
                    stats,
                    html`
                        ${type}
                        <span class="plays">
                            <span class="bleh-icon" />
                            ${listeners.title}
                        </span>
                    `
                );
            })
            .catch((err) => {
                console.error('oracle', err);
                return;
            });
    }
}

export function oracle_data(force = false) {
    if (!(ff('oracle') && settings.oracle_beta)) return;

    let cached_artists = localStorage.getItem('oracle_artists');
    let cached_artists_expire = new Date(
        localStorage.getItem('oracle_artists_expire')
    );

    let cached_albums = localStorage.getItem('oracle_albums');
    let cached_albums_expire = new Date(
        localStorage.getItem('oracle_albums_expire')
    );

    let cached_tracks = localStorage.getItem('oracle_tracks');
    let cached_tracks_expire = new Date(
        localStorage.getItem('oracle_tracks_expire')
    );

    let current_time = new Date();

    if (!cached_artists) {
        log('artists list is not cached, fetching', 'oracle');
        oracle_request('artists', true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        Object.assign(oracle_artists, JSON.parse(cached_artists));

        // is it valid?
        if (cached_artists_expire < current_time && !force) {
            oracle_request();
        } else if (force) {
            oracle_request('artists', true);
        }
    }

    if (!cached_albums) {
        log('albums list is not cached, fetching', 'oracle');
        oracle_request('albums', true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        Object.assign(oracle_albums, JSON.parse(cached_albums));

        // is it valid?
        if (cached_albums_expire < current_time && !force) {
            oracle_request();
        } else if (force) {
            oracle_request('albums', true);
        }
    }

    if (!cached_tracks) {
        log('tracks list is not cached, fetching', 'oracle');
        oracle_request('tracks', true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        Object.assign(oracle_tracks, JSON.parse(cached_tracks));

        // is it valid?
        if (cached_tracks_expire < current_time && !force) {
            oracle_request();
        } else if (force) {
            oracle_request('tracks', true);
        }
    }
}

function oracle_request(type = 'albums') {
    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/oracle/${type}.json?${Math.random()}`;
    xhr.open('GET', url, true);

    xhr.onload = function () {
        log(`${type} list responded with ${xhr.status}`, 'oracle');

        if (xhr.status != 200) {
            log(
                'request has been cancelled, will request again in 1h',
                'oracle'
            );
            api_expire.setHours(api_expire.getHours() + 1);
        }

        // set expire date
        let api_expire = new Date();

        if (xhr.status == 200) {
            if (type == 'artists') {
                Object.assign(oracle_artists, JSON.parse(this.response));
            } else if (type == 'albums') {
                Object.assign(oracle_albums, JSON.parse(this.response));
            } else {
                Object.assign(oracle_tracks, JSON.parse(this.response));
            }

            // save to cache for next page load
            localStorage.setItem(`oracle_${type}`, this.response);
            api_expire.setHours(api_expire.getHours() + 4);
            log(`${type} list cached until ${api_expire}`, 'oracle');
        }

        localStorage.setItem(`oracle_${type}_expire`, api_expire);
    };

    xhr.send();
}

export function oracle_debug() {
    const debug = page.state.oracle_debug;
    log('debug', 'oracle', 'info', { debug });

    dialog({
        id: 'oracle_debug',
        title: 'oracle',
        body: html.node`
            <table class="fancy-table oracle-debug">
                <tbody>
                    ${Object.entries(debug).map(([item, val]) => {
                        let va;
                        const entry = html.node`
                            <tr>
                                <td>${item}</td>
                                <td ref=${(el) => (va = el)}>${val}</td>
                            </tr>
                        `;

                        if (item == 'artist') {
                            render(
                                va,
                                html`
                                    <p>type: ${val.type}</p>
                                    <p>name: ${val.name}</p>
                                    ${val.type == 'id' ?
                                        html.node`
                                    <a
                                        class="see-more"
                                        href="https://musicbrainz.org/artist/${val.name}"
                                        target="_blank"
                                        >view</a
                                    >
                                    `
                                    :   ''}
                                `
                            );
                        } else if (item == 'release_id') {
                            render(
                                va,
                                html`
                                    <p>${val}</p>
                                    <a
                                        class="see-more"
                                        href="https://musicbrainz.org/release/${val}"
                                        target="_blank"
                                        >view</a
                                    >
                                `
                            );
                        } else if (item == 'recording_id') {
                            render(
                                va,
                                html`
                                    <p>${val}</p>
                                    <a
                                        class="see-more"
                                        href="https://musicbrainz.org/recording/${val}"
                                        target="_blank"
                                        >view</a
                                    >
                                `
                            );
                        }

                        return entry;
                    })}
                </tbody>
            </table>
        `
    });
}
