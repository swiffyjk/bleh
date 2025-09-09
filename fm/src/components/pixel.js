//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html, render} from "lighterhtml";
import {api_key, auth} from "../build/page.js";
import {tl, trans} from "../build/trans.js";
import {input} from "./input.js";
import tippy from "tippy.js";
import { status } from './status.js';
import { notify } from './notify.js';
import { correct_artist, correct_item_by_artist } from './lotus.js';

export function pixel({
    host,
    sidebar
}={}) {
    if (!host || !sidebar) return;

    const user_albums_url = `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${auth.name}&api_key=${api_key}&format=json&limit=500`;
    let user_albums = [];

    pixel_home();

    function pixel_home() {
        render(host, html`
            <div class="pixel-home">
                <h1 class="pixel-logo">pixel</h1>
                <div class="pixel-guess center">
                    <button class="primary jumbo continue" onclick=${() => pixel_prepare()}>
                        ${tl(trans.begin)}
                    </button>
                </div>
            </div>
        `);
    }

    function pixel_prepare() {
        if (user_albums.length == 0) {
            fetch(user_albums_url)
                .then(res => {
                    if (!res.ok) {
                        notify({
                            id: 'api-error',
                            type: 'error',
                            title: tl(trans.value_failed_to_load).replace('{v}', tl(trans.albums)),
                            body: res.statusText
                        });
                        throw new Error;
                    }

                    return res.json();
                })
                .then(data => {
                    const pre_parsed = data.topalbums.album;

                    pre_parsed.forEach(album => {
                        user_albums.push({
                            image: album.image[3]['#text'],
                            name: correct_item_by_artist(album.name, album.artist.name),
                            sister: correct_artist(album.artist.name),
                            type: 'album',
                            plays: album.playcount
                        });
                    });

                    pixel_random();
                })
                .catch(err => {
                    return;
                });
        } else {
            pixel_random();
        }
    }

    function pixel_random() {
        pixel_guess(user_albums[Math.floor(Math.random() * user_albums.length)]);
    }

    function pixel_guess({
        image,
        name,
        sister,
        type,
        plays
    }={
        image: '',
        name: 'Unknown Album',
        sister: 'Unknown Artist',
        type: 'album',
        plays: 0
    }) {
        let guess_input;

        let title_elem;
        let hints_container;
        render(host, html``);
        render(host, html`
            <div class="pixel-artwork">
                <img src=${image}>
            </div>
            <div class="pixel-guess">
                ${guess_input = input({
                    type: 'text',
                    placeholder: tl(trans.enter_a_guess),
                    func: (value) => {
                        pixel_make_a_guess(value);
                    }
                })}
                ${() => {
                    const btn = html.node`
                        <button class="primary icon chibi" data-type="send" onclick=${() => guess_input.submit()}>
                            ${tl(trans.guess)}
                        </button>
                    `;

                    tippy(btn, {
                        content: btn.textContent
                    });

                    return btn;
                }}
            </div>
            <div class="pixel-info">
                <h2>${tl(trans.jumbled_title)}</h2>
                <div class="pixel-album-name">
                    <h1 ref=${el => title_elem = el}>${jumble_string(name)}</h1>
                    ${() => {
                        let btn = html.node`
                            <button class="chibi icon" data-type="jumble" onclick=${() => {
                                title_elem.textContent = jumble_string(name);
                            }}>
                                ${tl(trans.re_jumble)}
                            </button>
                        `;

                        tippy(btn, {
                            content: tl(trans.re_jumble)
                        });

                        return btn;
                    }}
                </div>
            </div>
            <div class="pixel-info">
                <h2>${tl(trans.hints)}</h2>
                <div class="hints" ref=${el => hints_container = el}></div>
            </div>
        `);

        render(hints_container, html`
            sister: ${sister}<br>
            type: ${type}<br>
            plays: ${plays}
        `);

        guess_input.focus();

        function pixel_make_a_guess(guess) {
            if (guess.toLowerCase() == name.toLowerCase()) {
                status({
                    title: tl(trans.you_guessed_correctly)
                });

                pixel_random();
            }
        }
    }
}

function shuffle_array(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function jumble_string(input) {
    let output = input
        .split(' ')
        .map(word => {
            if (!word) return '';
            const letters = word.split('');
            return shuffle_array(letters).join('');
        })
        .join(' ');

    if (output == input) return jumble_string(input);

    return output;
}
