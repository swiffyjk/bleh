import {dialog} from "./dialog.js";
import {lang, tl, trans} from "../build/trans.js";
import {html, render} from "lighterhtml";
import {select} from "./select.js";
import {setting} from "./settings.js";
import {input} from "./input.js";
import {page, root} from "../build/page.js";
import {notify, notify_rm} from "./notify.js";
import {clean_number, sanitise} from "../build/tools.js";
import {log} from "../build/log.js";
import {music_grids} from "./music_grid.js";
import {settings} from "../build/config.js";
import {version} from "../main.js";
import {download} from "./share.js";

export function collage() {
    let width;
    let height;

    let timeframe;
    let type;

    let settings_btn;
    let submit;
    let body;

    let value = 5;
    let min = 1;
    let max = 20;

    dialog({
        id: 'collage',
        title: tl(trans.collage),
        body: html.node`
            <div class="compare-header">
                <div class="compare-users">
                    <div class="compare-user">
                        <div class="avatar">
                            <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                        </div>
                        <strong>${page.name}</strong>
                    </div>
                </div>
                <div class="compare-selection">
                    <div class="input-group">
                        ${width = input({
                            type: 'number',
                            value: value,
                            placeholder: value,
                            min: min,
                            max: max
                        })}
                        <div class="bleh-icon" style="--icon: var(--icon-16-x)" />
                        ${height = input({
                            type: 'number',
                            value: value,
                            placeholder: value,
                            min: min,
                            max: max
                        })}
                    </div>
                    ${type = select([
                        {
                            value: 'artists',
                            text: html`<div class="bleh-icon" style="--icon: var(--icon-16-artist)" />${tl(trans.artists)}`,
                        },
                        {
                            value: 'albums',
                            text: html`<div class="bleh-icon" style="--icon: var(--icon-16-album)" />${tl(trans.albums)}`,
                        },
                        {
                            value: 'tracks',
                            text: html`<div class="bleh-icon" style="--icon: var(--icon-16-track)" />${tl(trans.tracks)}`,
                        }
                    ], 'albums')}
                    ${timeframe = select([
                        {
                            value: 'LAST_7_DAYS',
                            text: tl(trans.last_count_days).replace('{c}', '7'),
                        },
                        {
                            value: 'LAST_30_DAYS',
                            text: tl(trans.last_count_days).replace('{c}', '30'),
                        },
                        {
                            value: 'LAST_90_DAYS',
                            text: tl(trans.last_count_days).replace('{c}', '90'),
                        },
                        {
                            value: 'LAST_180_DAYS',
                            text: tl(trans.last_count_days).replace('{c}', '180'),
                        },
                        {
                            value: 'LAST_365_DAYS',
                            text: tl(trans.last_count_days).replace('{c}', '365'),
                        },
                        {
                            value: 'ALL',
                            text: tl(trans.all_time),
                        }
                    ], 'LAST_90_DAYS')}
                    <button class="btn chibi icon" data-type="settings" ref=${el => settings_btn = el}>${tl(trans.settings)}</button>
                    <button class="btn primary icon" data-type="collage" ref=${el => submit = el} onclick=${() => make_collage()}>${tl(trans.generate)}</button>
                </div>
            </div>
            <div class="compare-body" data-filled="false" ref=${el => body = el}>
                <div class="loading-data-container">
                    <div class="loading-data-text info">${tl(trans.choose_a_timeframe_above)}</div>
                </div>
            </div>
        `
    });

    let width_input = width.querySelector('input');
    let height_input = height.querySelector('input');

    let timeframe_select = timeframe.querySelector('select');
    let type_select = type.querySelector('select');

    tippy(settings_btn, {
        content: tl(trans.settings)
    });
    tippy(settings_btn, {
        theme: 'window',
        content: html.node`
            <div class="dialog-settings">
                ${setting({id: 'collage_title'})}
                <div class="sep" />
                ${setting({id: 'collage_grid_text'})}
                ${setting({id: 'collage_grid_plays'})}
            </div>
        `,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',
    });

    function make_collage(bypass = false) {
        if (
            width_input.value == '' || height_input.value == '' ||
            parseInt(width_input.value) < min || parseInt(width_input.value) > max ||
            parseInt(height_input.value) < min || parseInt(height_input.value) > max
        ) {
            notify({
                id: 'collage_failed',
                title: tl(trans.name_failed).replace('{name}', tl(trans.collage)),
                body: tl(trans.your_settings_are_invalid),
                type: 'error'
            });
            return;
        }

        let per_page = 50; // decided by last.fm
        let pages = Math.ceil((width_input.value * height_input.value) / per_page);

        if (pages > 4 && !bypass) {
            let warn = notify({
                id: 'collage_warning',
                title: tl(trans.are_you_sure),
                body: tl(trans.this_will_require_loading_count_pages).replace('{c}', pages),
                type: 'warning',
                actions: [
                    {
                        type: 'check',
                        action: () => {
                            notify_rm(warn);
                            make_collage(true);
                        },
                        text: tl(trans.continue)
                    }
                ],
                persist: true
            });
            return;
        }

        type.querySelector('button').disabled = true;
        timeframe.querySelector('button').disabled = true;
        settings_btn.disabled = true;
        submit.disabled = true;

        page.state.collage = [];
        body.setAttribute('data-filled', 'false');
        get_grid(1, pages);
    }

    function get_grid(current_page, pages) {
        render(body, html`
            <div class="loading-data-container">
                <div class="loading-data-text">${tl(trans.gathering_plays_for_user_pages).replace('{u}', page.name).replace('{current_page}', current_page).replace('{pages}', pages)}</div>
            </div>
        `);

        fetch(`${root}user/${page.name}/library/${type_select.value}?format=list&date_preset=${timeframe_select.value}&page=${current_page}&ajax=1`)
            .then(function(response) {
                console.log('returned', response, response.text);

                return response.text();
            })
            .then(function(dom) {
                let doc = new DOMParser().parseFromString(dom, 'text/html');
                console.log('DOC', doc);

                let next_button = doc.querySelector('.pagination-next');

                try {
                    let tracks = doc.querySelectorAll('.chartlist-row');
                    tracks.forEach((track) => {
                        let item = {};

                        item.avatar = track.querySelector('.chartlist-image img');
                        if (item.avatar)
                            item.avatar = item.avatar.getAttribute('src');
                        item.name = track.querySelector('.chartlist-name a').textContent.trim();
                        if (type_select.value != 'artists')
                            item.sister = track.querySelector('.chartlist-artist a').textContent.trim();
                        item.plays = clean_number(track.querySelector('.chartlist-count-bar-slug').getAttribute('data-stat-value'));

                        page.state.collage.push(item);
                    });
                } catch(e) {
                    notify({
                        id: 'collage_failed',
                        title: tl(trans.name_failed).replace('{name}', tl(trans.collage)),
                        body: tl(trans.there_was_a_network_error),
                        type: 'error'
                    });
                    console.error(e);
                }

                if (next_button && current_page < pages) {
                    get_grid(current_page + 1, pages);
                } else {
                    continue_collage();
                }
            });
    }

    async function continue_collage() {
        log('gathered initial values', 'collage', 'info', page.state.collage);

        let grid = html.node`
            <ol class="grid-items grid-items--numbered collage-grid" style="--width: ${width_input.value}; --height: ${height_input.value}" data-width=${width_input.value} data-height=${height_input.value} />
        `;

        if (width_input.value >= 8 || height_input.value >= 8) {
            grid.setAttribute('data-scale-down', '2');
        } else if (width_input.value >= 7 || height_input.value >= 7) {
            grid.setAttribute('data-scale-down', '1');
        }

        let total = width_input.value * height_input.value - 1;
        let highest = width_input.value;
        if (height_input.value > width_input.value)
            highest = height_input.value;

        grid.style.setProperty('--highest', highest);

        page.state.collage.some((data, index) => {
            if (index > total)
                return false;

            let template;
            if (type_select.value == 'artists')
                template = sanitise(data.name);
            else
                template = `${sanitise(data.sister)}/${sanitise(data.name)}`;

            grid.appendChild(html.node`
                <li class="compare-item grid-items-item">
                    <div class="grid-items-cover-image">
                        <div class="grid-items-cover-image-image ${(data.avatar.endsWith('/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg') || data.avatar.endsWith('/2a96cbd8b46e442fc41c2b86b821562f.jpg')) ? 'grid-items-cover-default' : ''}">
                            <img src="${data.avatar.replace('/avatar70s/', '/avatar300s/').replace('/64s/', '/avatar300s/')}" alt="${data.name}" loading="lazy">
                        </div>
                        ${settings.collage_grid_text || settings.collage_grid_plays ? html.node`
                        <div class="grid-items-item-details">
                            ${settings.collage_grid_text ? html.node`
                            <p class="grid-items-item-main-text">
                                <a class="link-block-target" href="${root}music/${template}" title="${data.name}">
                                    ${data.name}
                                </a>
                            </p>
                            ` : ''}
                            ${(type_select.value != 'artists') ? html.node`
                            <p class="grid-items-item-aux-text">
                                ${settings.collage_grid_text ? html.node`
                                <a class="grid-items-item-aux-block" href="${root}music/${data.sister}">
                                    ${data.sister}
                                </a>
                                ${settings.collage_grid_plays ? html.node`
                                <a class="grid-item-plays" href="${root}user/${page.name}/library/music/${template}?date_preset=${timeframe_select.value}" target="_blank">
                                    ${data.plays.toLocaleString(lang)}
                                </a>
                                ` : ''}
                                ` : settings.collage_grid_plays ? html.node`
                                <a class="grid-item-plays" href="${root}user/${page.name}/library/music/${template}?date_preset=${timeframe_select.value}" target="_blank">
                                    ${data.plays.toLocaleString(lang)}${tl(trans.plays_lower)}
                                </a>
                                ` : ''}
                            </p>
                            ` : html.node`
                            ${settings.collage_grid_plays ? html.node`
                            <p class="grid-items-item-aux-text">
                                <a class="grid-item-plays" href="${root}user/${page.name}/library/music/${template}?date_preset=${timeframe_select.value}" target="_blank">
                                    ${data.plays.toLocaleString(lang)}${tl(trans.plays_lower)}
                                </a>
                            </p>
                            ` : ''}
                            `}
                        </div>
                        ` : ''}
                    </div>
                </li>
            `);
        });

        let collage_dom = html.node`
            <div class="collage">
                ${settings.collage_title ? html.node`
                <div class="header">
                    <div class="type" data-type=${type_select.value}>
                        <div class="bleh-icon" />
                        <strong class="brand">${version.brand}</strong>
                        <strong>${timeframe.querySelector('button').textContent}</strong>
                        <strong>${tl(trans.top_type).replace('{type}', tl(trans[type_select.value]))}</strong>
                        <strong>${width_input.value}x${height_input.value}</strong>
                    </div>
                    <div class="user">
                        <div class="avatar">
                            <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                        </div>
                        <strong>${page.name}</strong>
                    </div>
                </div>
                ` : ''}
                ${grid}
            </div>
        `;
        render(body, html`
            <div class="loading-data-container">
                <div class="loading-data-text">${tl(trans.waiting_for_images)}</div>
            </div>
            ${collage_dom}
        `);

        music_grids(grid, false);

        let cv_width = 1500;
        let cv_height = 1547;
        let cv_scale = 1;

        let initial_canvas = html.node`
            <canvas width=${cv_width * cv_scale} height=${cv_height * cv_scale} />
        `;

        html2canvas(collage_dom, {
            useCORS: true,
            letterRendering: true,
            canvas: initial_canvas,
            scale: cv_scale,
            onclone: (doc) => {
                doc.querySelectorAll('*').forEach((el) => {
                    if (el.classList == 'brand')
                        el.style.setProperty('font-family', 'Darumadrop One');
                    else
                        el.style.setProperty('font-family', 'Ubuntu Sans, Spline Sans, Inter, Roboto, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Sans TC, Noto Color Emoji, Lucida Grande, Verdana, Tahoma, -apple-system, BlinkMacSystemFont, sans-serif');
                });
            }
        }).then((canvas => {
            body.setAttribute('data-filled', 'true');

            render(body, html`
                <div class="collage-finished">
                    <strong>${tl(trans.your_collage_is_ready)}</strong>
                    <div class="button-group">
                        <button class="btn primary icon" data-type="download" onclick=${() => download(canvas.toDataURL('image/png'), tl(trans.chart_template_filename)
                                .replace('{timeframe}', timeframe.querySelector('button').textContent)
                                .replace('{user}', page.name)
                                .replace('{type}', tl(trans[type_select.value]))
                                .replace('{size}', `${width_input.value}x${height_input.value}`)
                                .replace('{brand}', version.brand))}>${tl(trans.download)}</button>
                        <button class="btn open" data-type="open" onclick=${() => open(canvas.toDataURL('image/png'))}>${tl(trans.open)}</button>
                    </div>
                </div>
                ${canvas}
            `);

            type.querySelector('button').disabled = false;
            timeframe.querySelector('button').disabled = false;
            settings_btn.disabled = false;
            submit.disabled = false;
        }));
    }
}
