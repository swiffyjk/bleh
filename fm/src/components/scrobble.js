import {html} from 'lighterhtml';
import {random_list, root} from '../build/page';
import {tl, trans} from '../build/trans';
import {dialog, dialog_rm} from './dialog';
import {input} from './input';
import {notify} from "./notify.js";
import {log} from "../build/log.js";
import {toggle} from "./toggle.js";
import {pad2} from "../build/tools.js";

export function submit_scrobble({
    pre_track = '',
    pre_album = '',
    pre_artist = '',
    pre_album_artist = '',
    func,
    can_api
}) {
    if (!can_api) can_api = localStorage.getItem('bleh_auth') && localStorage.getItem('bleh_auth_valid') === 'true';

    if (!can_api) {
        window.location.href = `${root}bleh?tab=profiles`;
        return;
    }

    const random = random_list[Math.floor(Math.random() * random_list.length)];

    let track;
    let album;
    let artist;
    let album_artist;
    let use_current;
    let date;

    let create_scrobble;

    let max_date = new Date();
    max_date.setDate(max_date.getDate() + 1);

    dialog({
        id: 'submit_scrobble',
        title: tl(trans.new_scrobble),
        body: html.node`
            <div class="new-scrobble-form">
                <p class="generic-label">${tl(trans.track)}</p>
                ${track = input({
                    type: 'text',
                    value: pre_track,
                    placeholder: tl(trans.example).replace('{v}', random.track),
                    warn_if_empty: true
                })}
                <p class="generic-label">${tl(trans.album)}</p>
                ${album = input({
                    type: 'text',
                    value: pre_album,
                    placeholder: tl(trans.example).replace('{v}', random.album)
                })}
                <p class="generic-label">${tl(trans.artist)}</p>
                ${artist = input({
                    type: 'text',
                    value: pre_artist,
                    placeholder: tl(trans.example).replace('{v}', random.artist),
                    warn_if_empty: true
                })}
                <p class="generic-label">${tl(trans.album_artist)}</p>
                ${album_artist = input({
                    type: 'text',
                    value: pre_album_artist,
                    placeholder: tl(trans.example).replace('{v}', random.album_artist)
                })}
                <p class="generic-label">${tl(trans.time)}</p>
                <div class="toggle-and-time">
                    ${use_current = toggle({
                        value: true,
                        type: 'checkbox',
                        title: tl(trans.use_current_time),
                        func: (state) => {
                            date.disabled(state);
                        }
                    })}
                    ${date = input({
                        type: 'date',
                        max: `${max_date.getFullYear()}-${pad2(max_date.getMonth() + 1)}-${pad2(max_date.getDate())}`,
                        disabled: true
                    })}
                </div>
            </div>
            <div class="modal-footer">
                <button class="see-more cancel" onclick=${() => dialog_rm({id: 'submit_scrobble'})}>
                    ${tl(trans.cancel)}
                </button>
                <div class="fill" />
                <button class="btn primary icon" data-type="add" ref=${el => create_scrobble = el} onclick=${async () => {
                    if (track.value() == '' || artist.value() == '') {
                        notify({
                            id: 'submit_scrobble',
                            title: tl(trans.new_scrobble),
                            body: tl(trans.missing_fields),
                            type: 'error'
                        });
                        return;
                    }

                    track.disabled(true);
                    album.disabled(true);
                    artist.disabled(true);
                    album_artist.disabled(true);
                    use_current.disabled(true);
                    date.disabled(true);
                    create_scrobble.disabled = true;

                    if (album.value() != '' && album_artist.value() == '') album_artist.value(artist.value());

                    let params = {
                        sk: localStorage.getItem('bleh_auth'),
                        artist: artist.value(),
                        track: track.value(),
                        timestamp: Math.floor(date.value() / 1000)
                    };

                    if (album.value() != '') params.album = album.value();
                    if (album_artist.value() != '') params.albumArtist = album_artist.value();

                    const res = await fetch(
                        'https://jufufu.katelyn.moe/api/lastfm',
                        {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                                method: 'track.scrobble',
                                params
                            })
                        }
                    );

                    const json = await res.json();
                    log('received response', 'submit scrobble', 'info', {result: json});

                    if (json.error) {
                        log('error', 'submit scrobble', 'error');
                        notify({
                            id: 'submit_scrobble',
                            title: tl(trans.new_scrobble),
                            body: json.message,
                            type: 'error',
                            persist: true
                        });
                        dialog_rm({id: 'submit_scrobble'});
                        return;
                    }

                    notify({
                        id: 'submit_scrobble',
                        title: tl(trans.new_scrobble),
                        body: params.track,
                        type: 'success'
                    });
                    dialog_rm({id: 'submit_scrobble'});

                    if (func) func();
                }}>
                    ${tl(trans.new)}
                </button>
            </div>
        `
    });
}
