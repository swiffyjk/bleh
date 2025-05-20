import { log } from '../build/log';
import { auth, page, root } from '../build/page';
import { clean_number, sanitise } from '../build/tools';
import { tl, trans } from '../build/trans';
import { dialog } from './dialog';
import { music_grids } from './music_grid';
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

    page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').innerHTML = (`
        <div class="loading-data-container">
            <div class="loading-data-text">${tl(trans.gathering_plays)}</div>
        </div>
    `);

    page.state.compare = {
        you: [],
        other: [],
        shared: []
    };
    get_grid(auth.name, type, range, page.name);
}

function get_grid(user, type, range, next_user=null) {
    fetch(`${root}user/${user}/library/${type}?format=list&date_preset=${range}&page=1&ajax=1`)
    .then(function(response) {
        console.log('returned', response, response.text);

        return response.text();
    })
    .then(function(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        console.log('DOC', doc);

        try {
            let tracks = doc.querySelectorAll('.chartlist-row');
            tracks.forEach((track) => {
                item = {};

                item.avatar = track.querySelector('.chartlist-image img');
                if (item.avatar)
                    item.avatar = item.avatar.getAttribute('src');
                item.name = track.querySelector('.chartlist-name a').textContent.trim();
                if (type != 'artists')
                    item.sister = track.querySelector('.chartlist-artist a').textContent.trim();
                item.plays = clean_number(track.querySelector('.chartlist-count-bar-slug').getAttribute('data-stat-value'));

                if (next_user)
                    page.state.compare.you.push(item);
                else
                    page.state.compare.other.push(item);
            });
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

            continue_comparing(type);
        } else {
            get_grid(next_user, type, range);
        }
    });
}

function continue_comparing(type) {
    log('gathered initial values', 'compare', 'info', page.state.compare);

    page.state.compare.you.forEach((your_item) => {
        let other_item;
        if (type == 'albums')
            other_item = page.state.compare.other.find(other => (your_item.name === other.name) && (your_item.sister === other.sister));
        else
            other_item = page.state.compare.other.find(other => your_item.name === other.name);

        if (other_item) {
            page.state.compare.shared.push({
                avatar: your_item.avatar,
                name: your_item.name,
                sister: (your_item.sister) ? your_item.sister : '',
                plays: {
                    you: your_item.plays,
                    other: other_item.plays,
                    shared: your_item.plays + other_item.plays
                }
            });
        }
    });

    page.state.compare.shared.sort((a, b) => b.plays.shared - a.plays.shared)

    log('gathered shared values', 'compare', 'info', page.state.compare);

    page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').innerHTML = '';

    if (page.state.compare.shared.length == 0) {
        page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').innerHTML = (`
            <div class="loading-data-container">
                <div class="loading-data-text failed">${tl(trans.nothing_in_common)}</div>
            </div>
        `);

        return;
    }

    if (type != 'tracks') {
        let grid = document.createElement('ol');
        grid.classList.add('grid-items', 'grid-items--numbered', 'compare-grid');

        page.state.compare.shared.forEach((data) => {
            let item = document.createElement('li');
            item.classList.add('grid-items-item', 'compare-item');

            let template;
            if (type == 'artists')
                template = sanitise(data.name);
            else
                template = `${sanitise(data.sister)}/${sanitise(data.name)}`;

            item.innerHTML = (`
                <div class="grid-items-cover-image js-link-block link-block">
                    <div class="grid-items-cover-image-image ${(data.avatar.endsWith('/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg')) ? 'grid-items-cover-default' : ''}">
                        <img src="${data.avatar.replace('/avatar70s/', '/avatar300s/').replace('/64s/', '/avatar300s/')}" alt="${data.name}">
                    </div>
                    <div class="grid-items-item-details">
                        <p class="grid-items-item-main-text">
                            <a class="link-block-target" href="${root}music/${template}" title="${data.name}">
                                ${data.name}
                            </a>
                        </p>
                        ${(type == 'albums') ? (`
                        <p class="grid-items-item-aux-text">
                            <a class="grid-items-item-aux-block" href="${root}music/${data.sister}">
                                ${data.sister}
                            </a>
                        </p>
                        `) : ''}
                        <p class="grid-items-item-aux-text">
                            <a class="grid-item-plays with-avatar" href="${root}user/${auth.name}/library/music/${template}" target="_blank">
                                <span class="avatar">
                                    <img src="${auth.avatar}" alt="${tl(trans.your_avatar)}">
                                </span>
                                ${data.plays.you}
                            </a>
                            <a class="grid-item-plays with-avatar" href="${root}user/${page.name}/library/music/${template}" target="_blank">
                                <span class="avatar">
                                    <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                                </span>
                                ${data.plays.other}
                            </a>
                        </p>
                    </div>
                    <a class="js-link-block-cover-link link-block-cover-link" href="${root}music/${template}" tabindex="-1" aria-hidden="true"></a>
                </div>
            `);

            grid.appendChild(item);
        });

        page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').appendChild(grid);

        music_grids(grid);
    }
}