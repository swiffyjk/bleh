import { log } from '../build/log';
import { auth, page, root } from '../build/page';
import { clean_number } from '../build/tools';
import { tl, trans } from '../build/trans';
import { dialog } from './dialog';
import { notify } from './notify';
import { custom_select } from './select';

export function compare() {
    page.state.compare_modal = dialog({
        id: 'compare',
        title: tl(trans.compare),
        body: (`
            <div class="compare-header">
                <div class="compare-users">
                    <div class="compare-user">
                        <div class="avatar">
                            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
                        </div>
                        <strong>${auth.name}</strong>
                    </div>
                    <div class="bleh-icon"></div>
                    <div class="compare-user">
                        <div class="avatar">
                            <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                        </div>
                        <strong>${page.name}</strong>
                    </div>
                </div>
                <div class="compare-selection">
                    <div class="select-wrap custom-selector" id="type_select">
                        <select id="type">
                            <option value="artists">${tl(trans.artists)}</option>
                            <option value="albums">${tl(trans.albums)}</option>
                            <option value="tracks">${tl(trans.tracks)}</option>
                        </select>
                    </div>
                    <div class="select-wrap custom-selector" id="range_select">
                        <select id="range">
                            <option value="LAST_7_DAYS">${tl(trans.last_count_days).replace('{c}', '7')}</option>
                            <option value="LAST_30_DAYS">${tl(trans.last_count_days).replace('{c}', '30')}</option>
                            <option value="LAST_90_DAYS" selected>${tl(trans.last_count_days).replace('{c}', '90')}</option>
                            <option value="LAST_180_DAYS">${tl(trans.last_count_days).replace('{c}', '180')}</option>
                            <option value="LAST_365_DAYS">${tl(trans.last_count_days).replace('{c}', '365')}</option>
                        </select>
                    </div>
                    <button class="btn chibi icon primary compare" onclick="_begin_comparing()">${tl(trans.compare)}</button>
                </div>
            </div>
            <div class="compare-body">
                <div class="loading-data-container">
                    <div class="loading-data-text info">${tl(trans.choose_a_timeframe_above)}</div>
                </div>
            </div>
        `),
        type: 'compare'
    });

    tippy(page.state.compare_modal.querySelector('.chibi.compare'), {
        content: tl(trans.compare)
    });

    custom_select(page.state.compare_modal.querySelector('#type'), page.state.compare_modal.querySelector('#type_select'));
    custom_select(page.state.compare_modal.querySelector('#range'), page.state.compare_modal.querySelector('#range_select'));
}

unsafeWindow._compare = function() {
    compare();
}

unsafeWindow._begin_comparing = function() {
    let buttons = page.state.compare_modal.querySelectorAll('.compare-header button');
    buttons.forEach((button) => {
        button.setAttribute('disabled', 'true');
    });

    let type = page.state.compare_modal.querySelector('#type').value;
    let range = page.state.compare_modal.querySelector('#range').value;

    page.state.compare = {
        you: [],
        other: []
    };
    get_grid(auth.name, type, range, page.name);
}

function get_grid(user, type, range, next_user=null) {
    fetch(`${root}user/${user}/library/${type}?format=grid&date_preset=${range}&page=1&ajax=1`)
    .then(function(response) {
        console.log('returned', response, response.text);

        return response.text();
    })
    .then(function(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        console.log('DOC', doc);

        try {
            if (type != 'tracks') {
                let grids = doc.querySelectorAll('.grid-items-item');
                grids.forEach((grid) => {
                    item = {};

                    item.name = grid.querySelector('.grid-items-item-main-text a').textContent.trim();
                    if (type == 'albums')
                        item.sister = grid.querySelector('.grid-items-item-aux-block').textContent.trim();
                    item.plays = clean_number(grid.querySelector('.grid-items-item-aux-text a:last-child').textContent.trim().replace(`${tl(trans.plays_lower)}`, ''));

                    if (next_user)
                        page.state.compare.you.push(item);
                    else
                        page.state.compare.other.push(item);
                });
            } else {
                let tracks = doc.querySelectorAll('.chartlist-row');
                tracks.forEach((track) => {
                    item = {};

                    item.name = track.querySelector('.chartlist-name a').textContent.trim();
                    item.sister = track.querySelector('.chartlist-artist a').textContent.trim();
                    item.plays = track.querySelector('.chartlist-count-bar-slug').getAttribute('data-stat-value');

                    if (next_user)
                        page.state.compare.you.push(item);
                    else
                        page.state.compare.other.push(item);
                });
            }
        } catch(e) {
            notify({
                id: 'compare',
                title: tl(trans.failed),
                body: tl(trans.there_was_an_error_network),
                type: 'error'
            });
            console.error(e);
        }

        if (!next_user) {
            let buttons = page.state.compare_modal.querySelectorAll('.compare-header button');
            buttons.forEach((button) => {
                button.removeAttribute('disabled');
            });

            continue_comparing();
        } else {
            get_grid(next_user, type, range);
        }
    });
}

function continue_comparing() {
    log('finished gathering values', 'compare', 'info', page.state.compare);
}