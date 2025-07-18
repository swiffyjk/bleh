import {html, render} from "lighterhtml";
import {auth} from "../build/page.js";
import {tl, trans} from "../build/trans.js";
import {input} from "./input.js";

export function pixel({
  host,
  sidebar
}={}) {
    if (!host || !sidebar) return;

    let text = 'my anti-aircraft friend';
    let title_elem;
    let hints_container;
    render(host, html`
        <div class="pixel-artwork">
            <img src="https://lastfm.freetls.fastly.net/i/u/ar0/def68d94aae8e52ef2d1c0c9d3e16ff4.jpg" alt=${auth.name} />
        </div>
        <div class="pixel-info">
            <div class="sub-text">${tl(trans.jumbled_title)}</div>
            <div class="pixel-album-name">
                <h1 ref=${el => title_elem = el}>${jumble_string(text)}</h1>
                ${() => {
                    let btn = html.node`
                        <button class="chibi icon" data-type="jumble" onclick=${() => {
                            title_elem.textContent = jumble_string(text);
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
            <div class="pixel-guess">
                ${input({
                    type: 'text',
                    placeholder: tl(trans.enter_a_guess),
                    func: (value) => {
                        console.info(value);
                    }
                })}
                <p class="card-tip">${tl(trans.jumbled_guess)}</p>
            </div>
            <h2>${tl(trans.hints)}</h2>
            <div class="hints" ref=${el => hints_container = el}></div>
        </div>
    `);
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
