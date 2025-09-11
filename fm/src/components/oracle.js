import { html, render } from 'lighterhtml';
import { log } from '../build/log';
import { page, root } from '../build/page';
import { sanitise } from '../build/tools';
import { ff } from '../sku';
import { correct_artist, correct_item_by_artist } from './lotus';

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
                <div class="loading-data-container">
                    <div class="loading-data-text">Fetching related releases</div>
                </div>
            </section>
        `;
        info_panel.after(releases_panel);
    }

    const url = `https://musicbrainz.org/ws/2/recording?fmt=json&query=%22${sanitise(page.name, ' ')}%22%20AND%20%22${sanitise(page.sister, ' ')}%22`;
    log(`using url ${url}`, 'oracle');
    fetch(url)
        .then(res => {
            if (!res.ok) {
                log('error fetching connect data', 'oracle', 'error', {res});
                throw new Error;
            }

            return res.json();
        })
        .then(data => {
            log('received connect data', 'oracle', 'info', {data});
            page.state.oracle = data;

            oracle(data);
        })
        .catch(err => {
            console.error('oracle', err);
            return;
        });

    function oracle(data) {
        // let's comb through the releases to remove
        // various artists
        let releases = [];

        if (!data.recordings[0]) return;

        if (data.recordings[0].releases) {
            data.recordings[0].releases.forEach(release => {
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
                <h3 class="text-18">Releases</h3>
                <div class="source-albums">
                    ${releases.map((release, index) => {
                        if (index > 1) return html.node``;

                        log('release', 'oracle', 'log', {release});
                        const title = release.title;
                        const artist = release['artist-credit'][0].name;
                        const type = release['release-group']['primary-type'];

                        const elem = html.node`
                            <div class="source-album js-link-block link-block-cover-link">
                                <div class="source-album-art">
                                    <span class="cover-art">
                                        <img class="empty">
                                    </span>
                                </div>
                                <div class="source-album-details" data-kate-processed="true">
                                    <h4 class="source-album-name">${correct_item_by_artist(title, artist)}</h4>
                                    <p class="source-album-artist">${correct_artist(artist)}</p>
                                    <p class="source-album-stats">${type}</p>
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
                <h3 class="text-18">Releases</h3>
                <div class="loading-data-container">
                    <div class="loading-data-text fail">No releases found</div>
                </div>
            `);
        }
    }
}