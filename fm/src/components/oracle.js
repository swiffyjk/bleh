import { html, render } from 'lighterhtml';
import { log } from '../build/log';
import { oracle_albums, oracle_tracks, page, root } from '../build/page';
import { sanitise } from '../build/tools';
import { ff } from '../sku';
import { correct_artist, correct_item_by_artist } from './lotus';
import { tl, trans } from '../build/trans';
import { clean_title } from '../build/music';
import { version } from '../main';
import { settings } from '../build/config';

export function oracle_process() {
    log('beginning', 'oracle');

    if (ff('oracle_album_reordering') && page.type == 'track') {

    }

    if (!ff('oracle_connect') || page.type == 'artist') return;

    let tries = 2;

    const info_panel = page.structure.main.firstElementChild;
    let releases_panel;
    if (page.type == 'track') {
        releases_panel = html.node`
            <section class="oracle-releases">
                <h3 class="text-18">Releases</h3>
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

    const albums_and_lyrics_row = page.structure.main.querySelector('.album-and-lyrics-row');
    if (page.type == 'track') albums_and_lyrics_row.classList.add('oracle-hidden');

    oracle_connect();

    function oracle_connect() {
        if (tries < 1) return;
        tries--;

        let url;

        if (page.type == 'track')
            url = `https://musicbrainz.org/ws/2/recording?query="${sanitise(clean_title(page.name), ' ')}" AND artist:"${sanitise(page.sister, ' ')}" AND status:Official`;
        else if (page.type == 'album')
            url = `http://musicbrainz.org/ws/2/release?query=release:"${sanitise(clean_title(page.name), ' ')}" AND artist:"${sanitise(page.sister, ' ')}"`;

        log(`using url ${encodeURI(url)} with ${tries} tries available`, 'oracle');

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: {
                'User-Agent': `bleh/${version.build} <https://github.com/katelyynn/bleh>`,
                'Accept': 'application/json'
            },
            onload: function(response) {
                if (response.status < 200 || response.status >= 300) {
                    log('error fetching connect data', 'oracle', 'error', {response});
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('failed to parse', 'oracle', 'error', {e});
                    return;
                }

                log('received connect data', 'oracle', 'info', {data});
                page.state.oracle = data;

                oracle(data);
            },
            onerror: function(err) {
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

            setTimeout(() => {
                oracle_album_fetch(release);
            }, 400);
        }
    }

    function oracle_pick_release(data) {
        if (!data || !data.releases) return null;

        const filtered = data.releases.filter(release => {
            const artists = release['artist-credit'] || [];
            const various = artists.some(artist => artist.name == 'Various Artists');
            const official = release.status == 'Official';

            return !various && official;
        });

        if (filtered.length == 0) return null;

        // prefer explicit
        let best = filtered.find(release => release.disambiguation?.toLowerCase().includes('explicit'));
        if (best) return best;

        // then clean
        best = filtered.find(release => release.disambiguation?.toLowerCase().includes('clean'));
        if (best) return best;

        // otherwise any
        return filtered[0];
    }

    function oracle_album_fetch(data) {
        if (tries < 1) return;
        tries--;

        const url = `http://musicbrainz.org/ws/2/release/${data.id}?inc=recordings+labels+artist-credits`;

        log(`using url ${encodeURI(url)} with ${tries} tries available`, 'oracle');

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: {
                'User-Agent': `bleh/${version.build} <https://github.com/katelyynn/bleh>`,
                'Accept': 'application/json'
            },
            onload: function(response) {
                if (response.status < 200 || response.status >= 300) {
                    log('error fetching connect data', 'oracle', 'error', {response});
                    return;
                }

                let data;
                try {
                    data = JSON.parse(response.responseText);
                } catch (e) {
                    log('failed to parse', 'oracle', 'error', {e});
                    return;
                }

                log('received connect album data', 'oracle', 'info', {data});
                page.state.oracle = data;

                oracle_album(data);
            },
            onerror: function(err) {
                console.error('oracle', err);

                setTimeout(() => {
                    oracle_album_fetch(data);
                }, 1000);
            }
        });
    }

    function oracle_album(data) {
        const labels = data['label-info'];
        if (labels && labels.length > 0) {
            info_panel.appendChild(html.node`
                <div class="sub-text music-small-header">
                    <span>
                        ${tl(trans.label)}<span class="new-badge beta">${tl(trans.beta)}</span>
                    </span>
                </div>
                <div class="music-labels catalogue-tags">
                    <ul class="tags-list">
                        ${labels.map(label => html.node`
                            <li class="tag">
                                <a class="music-label" href="${root}tag/${sanitise(label.label.name, '+')}">${label.label.name}</a>
                            </li>
                        `)}
                    </ul>
                </div>
            `);
        }

        const tracks = data.media[0].tracks;

        const track_panel = html.node`
            <section class="oracle-tracks">
                <h3 class="text-18">${tl(trans.tracklist)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                <table class="chartlist chartlist--with-index chartlist--with-index--length-1 chartlist--with-artist chartlist--with-more chartlist--with-duration chartlist--with-bar">
                    <tbody>
                        ${tracks.map(track => {
                            const total_s = Math.floor(track.length / 1000);
                            const m = Math.floor(total_s / 60);
                            const s = total_s % 60;

                            const disambig = track.recording.disambiguation;

                            const elem = html.node`
                                <tr class="chartlist-row" data-disambig=${disambig}>
                                    <td class="chartlist-index">${track.position}</td>
                                    <td class="chartlist-name">
                                        <a href="${root}music/${sanitise(track['artist-credit'][0].name)}/_/${sanitise(track.title)}" data-name="${track.title}">
                                            ${track.title}
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
            </section>
        `;

        info_panel.after(track_panel);
    }

    function oracle_track_releases(data) {
        // let's comb through the releases to remove
        // various artists
        let releases = [];

        // let's also look thru the last.fm provided ones
        // to possibly get listener and cover data
        let lastfm_releases = [];
        const lastfm_source_albums = albums_and_lyrics_row.querySelectorAll('.source-album');
        // you may ask why im not cleaning the title here
        // its to avoid misleading the listener count incase it tries to show
        // the listener count for GNX (Spotify) under GNX
        lastfm_source_albums.forEach(release => {
            lastfm_releases.push({
                title: release.querySelector('.source-album-name').textContent,
                artist: release.querySelector('.source-album-artist').textContent,
                plays: release.querySelector('.source-album-stats').firstChild.textContent.trim(),
                artwork: release.querySelector('.source-album-art > .cover-art > img').src
            });
        });

        let recording = data.recordings.find(r =>
            r.releases &&
            r.releases.some(release => release.status === 'Official') &&
            !(r.disambiguation?.toLowerCase().endsWith('live') ||
            r.disambiguation?.toLowerCase().endsWith('mix')) &&
            !r.releases.some(release =>
                release['artist-credit'] &&
                release['artist-credit'][0] &&
                release['artist-credit'][0].name == 'Various Artists'
            )
        );

        if (!recording) recording = data.recordings.find(r => r.releases && r.releases.length > 0);

        if (!recording) {
            render(releases_panel, html`
                <h3 class="text-18">${tl(trans.releases)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                <div class="loading-data-container">
                    <div class="loading-data-text failed">No releases found</div>
                </div>
            `);
            return;
        }

        if (recording) {
            log('releases in recording', 'oracle', 'info', {releases: recording.releases});
            recording.releases.forEach(release => {
                const artist = release['artist-credit'] ? release['artist-credit'][0].name : recording['artist-credit'].name;

                if (artist == 'Various Artists') return;

                releases.push(release);
            });
            log('releases in recording after parsing', 'oracle', 'info', {releases});

            releases = releases.filter(
                (release, index, self) => index === self.findIndex(r => {
                    const r_artist = r['artist-credit']?.[0]?.name;
                    const release_artist = release['artist-credit']?.[0]?.name;
                    return r.title === release.title && r_artist === release_artist;
                })
            );
            log('releases in recording after filter', 'oracle', 'info', {releases});

            render(releases_panel, html`
                <h3 class="text-18">${tl(trans.releases)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                <div class="source-albums">
                    ${releases.map((release, index) => {
                        if (index > 1) return html.node``;

                        log('release', 'oracle', 'log', {release});
                        const title = clean_title(release.title);
                        const artist = release['artist-credit']?.[0]?.name || recording['artist-credit'][0].name;
                        const type = release['release-group']['primary-type'];

                        // is there a matching last.fm entry available atm?
                        const match = lastfm_releases.find(
                            r => r.title == title && r.artist == artist
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
                            <div class="source-album js-link-block link-block-cover-link" data-match=${match != null}>
                                <div class="source-album-art" ref=${el => artwork_container = el}>
                                    ${artwork ? html.node`
                                    <span class="cover-art">
                                        <img src=${artwork} alt=${title}>
                                    </span>
                                    ` : ''}
                                </div>
                                <div class="source-album-details" data-kate-processed="true">
                                    <h4 class="source-album-name">${correct_item_by_artist(title, artist)}</h4>
                                    <p class="source-album-artist">${correct_artist(artist)}</p>
                                    <p class="source-album-stats oracle-stats" ref=${el => stats = el}>
                                        ${type}
                                        ${match ? html.node`
                                        <span class="plays">
                                            <span class="bleh-icon" />
                                            ${plays}
                                        </span>
                                        ` : ''}
                                    </p>
                                    <a class="js-link-block-cover-link link-block-cover-link" href="${root}music/${sanitise(artist)}/${sanitise(title)}" tabindex="-1" aria-hidden="true" />
                                </div>
                            </div>
                        `;

                        if (!artwork) load_cover_art(artwork_container, title, artist, stats, type);

                        return elem;
                    })}
                </div>
            `);
        } else {
            render(releases_panel, html`
                <h3 class="text-18">${tl(trans.releases)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                <div class="loading-data-container">
                    <div class="loading-data-text failed">No releases found</div>
                </div>
            `);
        }
    }

    function load_cover_art(parent, title, artist, stats = null, type = null) {
        render(parent, html`
            <span class="cover-art oracle-loading">
                <span class="loading-spinner">
                    <span class="bleh-icon" />
                </span>
                <img class="empty">
            </span>
        `);

        if (!ff('oracle_fetch_artwork')) return;

        fetch(`${root}music/${sanitise(artist)}/${sanitise(title)}/`)
            .then(res => {
                if (!res.ok) {
                    log('error fetching cover art', 'oracle', 'error', {res});
                    throw new Error;
                }

                return res.text();
            })
            .then((dom) => {
                const doc = new DOMParser().parseFromString(dom, 'text/html');

                const background_image = doc.querySelector('.header-new-background-image');
                if (!background_image) {
                    render(parent, html`
                        <span class="cover-art">
                            <img class="missing-album">
                        </span>
                    `);
                    return;
                }

                render(parent, html`
                    <span class="cover-art">
                        <img src=${background_image.getAttribute('content').replace('/ar0/', '/300x300/')} alt=${title}>
                    </span>
                `);

                if (!stats || !type) return;

                const listeners = doc.querySelector('.header-new-info-desktop .header-metadata-tnew-display > p > abbr');
                console.info('oracle', listeners);
                if (!listeners) return;

                render(stats, html`
                    ${type}
                    <span class="plays">
                        <span class="bleh-icon" />
                        ${listeners.title}
                    </span>
                `);
            })
            .catch(err => {
                console.error('oracle', err);
                return;
            });
    }
}

export function oracle_data(force = false) {
    if (!(ff('oracle') && settings.oracle_beta)) return;

    let cached_albums = localStorage.getItem('oracle_albums');
    let cached_albums_expire = new Date(localStorage.getItem('oracle_albums_expire'));

    let cached_tracks = localStorage.getItem('oracle_tracks');
    let cached_tracks_expire = new Date(localStorage.getItem('oracle_tracks_expire'));

    let current_time = new Date();

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
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`${type} list responded with ${xhr.status}`, 'oracle');

        if (xhr.status != 200) {
            log('request has been cancelled, will request again in 1h', 'oracle');
            api_expire.setHours(api_expire.getHours() + 1);
        }

        // set expire date
        let api_expire = new Date();

        if (xhr.status == 200) {
            if (type == 'albums') {
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
    }

    xhr.send();
}