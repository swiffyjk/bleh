import { html, render } from 'lighterhtml';
import { log } from '../build/log';
import { auth, page, root } from '../build/page';
import { clean_number, sanitise } from '../build/tools';
import { tl, trans } from '../build/trans';
import { dialog } from './dialog';
import { music_grids } from './music_grid';
import { notify } from './notify';
import { custom_select } from './select';
import { patch_titles } from './track';

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
                    <div class="select-wrap custom-selector" id="pages_select">
                        <select id="pages">
                            <option value="1">50</option>
                            <option value="2">100</option>
                            <option value="3" selected>150</option>
                            <option value="4">200</option>
                        </select>
                    </div>
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
            <div class="compare-body" data-filled="false">
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

    custom_select(page.state.compare_modal.querySelector('#pages'), page.state.compare_modal.querySelector('#pages_select'));
    custom_select(page.state.compare_modal.querySelector('#type'), page.state.compare_modal.querySelector('#type_select'));
    custom_select(page.state.compare_modal.querySelector('#range'), page.state.compare_modal.querySelector('#range_select'));
}

unsafeWindow._compare = function() {
    compare();
}

unsafeWindow._begin_comparing = function() {
    page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').setAttribute('data-filled', 'false');
    let buttons = page.state.compare_modal.querySelectorAll('.compare-selection > button');
    buttons.forEach((button) => {
        button.setAttribute('disabled', 'true');
    });

    let pages = page.state.compare_modal.querySelector('#pages').value;
    let type = page.state.compare_modal.querySelector('#type').value;
    let range = page.state.compare_modal.querySelector('#range').value;

    page.state.compare = {
        you: [],
        other: [],
        shared: []
    };
    get_grid(auth.name, type, range, 1, pages, page.name, pages);
}

function get_grid(user, type, range, current_page, pages, next_user=null) {
    render(page.state.compare_modal.querySelector('.bleh-modal-body .compare-body'), html`
        <div class="loading-data-container">
            <div class="loading-data-text">${tl(trans.gathering_plays_for_user_pages).replace('{u}', user).replace('{current_page}', current_page).replace('{pages}', pages)}</div>
        </div>
    `);

    fetch(`${root}user/${user}/library/${type}?format=list&date_preset=${range}&page=${current_page}&ajax=1`)
    .then(function(response) {
        console.log('returned', response, response.text);

        return response.text();
    })
    .then(function(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        console.log('DOC', doc);

        let next_button = doc.querySelector('.pagination-next');

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
                body: tl(trans.there_was_a_network_error),
                type: 'error'
            });
            console.error(e);
        }

        if (next_button && current_page < pages) {
            get_grid(user, type, range, current_page + 1, pages, next_user);
        } else if (next_user) {
            get_grid(next_user, type, range, 1, pages);
        } else {
            let buttons = page.state.compare_modal.querySelectorAll('.compare-selection > button');
            buttons.forEach((button) => {
                button.removeAttribute('disabled');
            });

            continue_comparing(type, range);
        }
    });
}

function continue_comparing(type, range) {
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
        render(page.state.compare_modal.querySelector('.bleh-modal-body .compare-body'), html`
            <div class="loading-data-container">
                <div class="loading-data-text failed">${tl(trans.nothing_in_common)}</div>
            </div>
        `);
    page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').setAttribute('data-filled', 'false');

        return;
    }

    page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').setAttribute('data-filled', 'true');

    if (type != 'tracks') {
        let grid = document.createElement('ol');
        grid.classList.add('grid-items', 'grid-items--numbered', 'compare-grid');

        page.state.compare.shared.forEach((data) => {
            let template;
            if (type == 'artists')
                template = sanitise(data.name);
            else
                template = `${sanitise(data.sister)}/${sanitise(data.name)}`;

            grid.appendChild(html.node`
                <li class="compare-item grid-items-item">
                    <div class="grid-items-cover-image js-link-block link-block">
                        <div class="grid-items-cover-image-image ${(data.avatar.endsWith('/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg') || data.avatar.endsWith('/2a96cbd8b46e442fc41c2b86b821562f.jpg')) ? 'grid-items-cover-default' : ''}">
                            <img src="${data.avatar.replace('/avatar70s/', '/avatar300s/').replace('/64s/', '/avatar300s/')}" alt="${data.name}" loading="lazy">
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
                                <a class="grid-item-plays with-avatar" href="${root}user/${auth.name}/library/music/${template}?date_preset=${range}" target="_blank">
                                    <span class="avatar">
                                        <img src="${auth.avatar}" alt="${tl(trans.your_avatar)}">
                                    </span>
                                    ${data.plays.you}
                                </a>
                                <a class="grid-item-plays with-avatar" href="${root}user/${page.name}/library/music/${template}?date_preset=${range}" target="_blank">
                                    <span class="avatar">
                                        <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                                    </span>
                                    ${data.plays.other}
                                </a>
                            </p>
                        </div>
                        <a class="js-link-block-cover-link link-block-cover-link" href="${root}music/${template}" tabindex="-1" aria-hidden="true"></a>
                    </div>
                </li>
            `);
        });

        page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').appendChild(grid);

        music_grids(grid);
    } else {
        let table = document.createElement('table');
        table.classList.add('chartlist', 'chartlist--with-index', 'chartlist--with-index--length-2', 'chartlist--with-image', 'chartlist--with-artist', 'chartlist--with-bar', 'compare-chartlist');

        let body = document.createElement('tbody');
        table.appendChild(body);

        let max = 0;
        page.state.compare.shared.forEach((item) => {
            if (item.plays.you > max)
                max = item.plays.you;
            if (item.plays.other > max)
                max = item.plays.other;
        });

        page.state.compare.shared.forEach((data, index) => {
            let template = `${sanitise(data.sister)}/_/${sanitise(data.name)}`;

            body.appendChild(html.node`
                <tr class="chartlist-row chartlist-row--with-artist compare-item">
                    <td class="chartlist-index">${index + 1}</td>
                    <td class="chartlist-image">
                        <a class="cover-art" href="${root}music/${template}">
                            <img src="${data.avatar}" alt="${data.name}" loading="lazy">
                        </a>
                    </td>
                    <td class="chartlist-name">
                        <a href="${root}music/${template}" title="${data.name}">
                            ${data.name}
                        </a>
                    </td>
                    <td class="chartlist-artist">
                        <a href="${root}music/${data.sister}" title="${data.sister}">
                            ${data.sister}
                        </a>
                    </td>
                    <td class="chartlist-bar with-multiple">
                        <span class="chartlist-count-bar">
                            <a class="chartlist-count-bar-link" href="${root}user/${auth.name}/library/music/${template}?date_preset=${range}" target="_blank">
                                <span class="chartlist-count-bar-slug" data-max-stat-value="${max}" data-stat-value="${data.plays.you}" style="width: ${(data.plays.you / max) * 100}%;"></span>
                                <span class="chartlist-count-bar-value">${data.plays.you}</span>
                            </a>
                            <span class="avatar">
                                <img src="${auth.avatar}" alt="${tl(trans.your_avatar)}">
                            </span>
                        </span>
                        <span class="chartlist-count-bar">
                            <a class="chartlist-count-bar-link" href="${root}user/${page.name}/library/music/${template}?date_preset=${range}" target="_blank">
                                <span class="chartlist-count-bar-slug" data-max-stat-value="${max}" data-stat-value="${data.plays.other}" style="width: ${(data.plays.other / max) * 100}%;"></span>
                                <span class="chartlist-count-bar-value">${data.plays.other}</span>
                            </a>
                            <span class="avatar">
                                <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                            </span>
                        </span>
                    </td>
                </tr>
            `);
        });

        page.state.compare_modal.querySelector('.bleh-modal-body .compare-body').appendChild(table);

        patch_titles(page.state.compare_modal);
    }
}