import { html, render } from 'lighterhtml';
import { log } from '../build/log';
import { page, root } from '../build/page';
import { sanitise } from '../build/tools';
import { ff } from '../sku';
import { correct_artist, correct_item_by_artist } from './lotus';
import { tl, trans } from '../build/trans';
import { clean_title } from '../build/music';

export function oracle_process() {
    log('beginning', 'oracle');

    if (ff('oracle_album_reordering') && page.type == 'track') {

    }

    if (!ff('oracle_connect') || page.type == 'artist') return;

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

    const url = `https://musicbrainz.org/ws/2/recording?query=%22${sanitise(page.name, ' ')}%22%20AND%20artist:%22${sanitise(page.sister, ' ')}%22%20AND%20status:Official`;
    log(`using url ${url}`, 'oracle');

    GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: {
            'User-Agent': 'bleh for Last.fm https://bleh.katelyn.moe https://github.com/katelyynn/bleh',
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
                console.error('oracle: failed to parse JSON', e);
                return;
            }

            log('received connect data', 'oracle', 'info', {data});
            page.state.oracle = data;

            oracle(data);
        },
        onerror: function(err) {
            console.error('oracle', err);
        }
    });

    function oracle(data) {
        if (page.type == 'track') {
            oracle_track_releases(data);
        }
    }

    function oracle_track_releases(data) {
        // let's comb through the releases to remove
        // various artists
        let releases = [];

        // let's also look thru the last.fm provided ones
        // to possibly get listener and cover data
        let lastfm_releases = [];
        const lastfm_source_albums = albums_and_lyrics_row.querySelectorAll('.source-album');
        lastfm_source_albums.forEach(release => {
            lastfm_releases.push({
                title: clean_title(release.querySelector('.source-album-name').textContent),
                artist: release.querySelector('.source-album-artist').textContent,
                plays: release.querySelector('.source-album-stats').firstChild.textContent.trim(),
                artwork: release.querySelector('.source-album-art > .cover-art > img').src
            });
        });

        let recording = data.recordings.find(r =>
            r.releases && r.releases.some(release => release.status == 'Official')
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
            recording.releases.forEach(release => {
                if (release['artist-credit'][0].name == 'Various Artists') return;

                releases.push(release);
            });

            releases = releases.filter(
                (release, index, self) =>
                    index === self.findIndex(
                        r =>
                            r.title === release.title &&
                            r['artist-credit'][0].name === release['artist-credit'][0].name
                    )
            );

            render(releases_panel, html`
                <h3 class="text-18">${tl(trans.releases)}<span class="new-badge beta">${tl(trans.beta)}</span></h3>
                <div class="source-albums">
                    ${releases.map((release, index) => {
                        if (index > 1) return html.node``;

                        log('release', 'oracle', 'log', {release});
                        const title = clean_title(release.title);
                        const artist = release['artist-credit'][0].name;
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

                        const elem = html.node`
                            <div class="source-album js-link-block link-block-cover-link" data-match=${match != null}>
                                <div class="source-album-art">
                                    <span class="cover-art">
                                        ${artwork ? html.node`
                                        <img src=${artwork} alt=${title}>
                                        ` : html.node`
                                        <img class="empty">
                                        `}
                                    </span>
                                </div>
                                <div class="source-album-details" data-kate-processed="true">
                                    <h4 class="source-album-name">${correct_item_by_artist(title, artist)}</h4>
                                    <p class="source-album-artist">${correct_artist(artist)}</p>
                                    <p class="source-album-stats oracle-stats">
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
}