import {lang, tl, trans} from "../build/trans.js";
import {html, render} from "lighterhtml";
import {select} from "./select.js";
import {setting} from "./settings.js";
import {input} from "./input.js";
import {auth, page, root} from "../build/page.js";
import {notify, notify_rm} from "./notify.js";
import {clean_number, sanitise} from "../build/tools.js";
import {log} from "../build/log.js";
import {music_grids} from "./music_grid.js";
import {settings} from "../build/config.js";
import {version} from "../main.js";
import {download} from "./share.js";

export function collage({
    host,
    sidebar
}={}) {
    if (!host || !sidebar) return;

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

    let current_year = new Date().getFullYear();
    let previous_year = current_year - 1;

    const default_type = page.requested.type || 'albums';
    const default_timeframe = page.requested.timeframe || 'date_preset=LAST_90_DAYS';

    if (page.requested.redirect) {
        setTimeout(() => {
            notify({
                id: 'collage_redirect',
                title: tl(trans.collage),
                body: tl(trans.collage_redirect),
                icon: 'icon-16-collage',
                persist: true
            });
        }, 100);
    }

    let user;
    render(host, html`
        <div class="compare-header">
            <div class="compare-users">
                <div class="compare-user" ref=${el => user = el}>
                    ${render_user()}
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
                ], default_type)}
                ${timeframe = select([
                    {
                        value: 'date_preset=LAST_7_DAYS',
                        text: tl(trans.last_count_days).replace('{c}', '7'),
                    },
                    {
                        value: 'date_preset=LAST_30_DAYS',
                        text: tl(trans.last_count_days).replace('{c}', '30'),
                    },
                    {
                        value: 'date_preset=LAST_90_DAYS',
                        text: tl(trans.last_count_days).replace('{c}', '90'),
                    },
                    {
                        value: 'date_preset=LAST_180_DAYS',
                        text: tl(trans.last_count_days).replace('{c}', '180'),
                    },
                    {
                        value: 'date_preset=LAST_365_DAYS',
                        text: tl(trans.last_count_days).replace('{c}', '365'),
                    },
                    {
                        value: 'date_preset=ALL',
                        text: tl(trans.all_time),
                    },
                    {
                        value: `from=${current_year}-01-01&rangetype=year`,
                        text: current_year
                    },
                    {
                        value: `from=${previous_year}-01-01&rangetype=year`,
                        text: previous_year
                    }
                ], default_timeframe)}
                <button class="btn primary icon" data-type="collage" ref=${el => submit = el} onclick=${() => make_collage()}>${tl(trans.generate)}</button>
            </div>
        </div>
        <div class="compare-body" data-filled="false" ref=${el => body = el}>
            <div class="loading-data-container">
                <div class="loading-data-text info">${tl(trans.choose_a_timeframe_above)}</div>
            </div>
        </div>
    `);

    let width_input = width.querySelector('input');
    let height_input = height.querySelector('input');

    let timeframe_select = timeframe.querySelector('select');
    let type_select = type.querySelector('select');

    let setting_group;
    render(sidebar, html`
        <h2>${tl(trans.settings)}</h2>
        <div class="setting-group" ref=${el => setting_group = el}>
            <div class="setting v" data-type="text">
                <div class="heading">
                    <h5>${tl(trans.profile)}</h5>
                </div>
                <div class="input-container content-form">
                    <input type="text" class="input" placeholder=${tl(trans.enter_a_profile)} value=${page.requested.profile} onchange=${e => {
                        page.requested.profile = e.target.value;
                        page.name = page.requested.profile;
                        
                        page.avatar = '';
                        if (page.name == auth.name) page.avatar = auth.avatar;
                        
                        render(user, html`
                            ${render_user()}
                        `);
                    }}>
                </div>
            </div>
            ${setting({id: 'collage_title'})}
            ${setting({id: 'collage_grid_gap'})}
            ${setting({id: 'collage_grid_text'})}
            ${setting({id: 'collage_grid_plays'})}
        </div>
    `);
    let collage_settings = setting_group.querySelectorAll(':scope > .setting');

    function render_user() {
        if (page.avatar == '') {
            fetch(`${root}user/${page.name}/tags`)
                .then(function (response) {
                    console.log('returned', response, response.text);

                    return response.text();
                })
                .then(function (dom) {
                    let doc = new DOMParser().parseFromString(dom, 'text/html');
                    console.log('DOC', doc);

                    try {
                        page.avatar = doc.querySelector('.header-avatar-inner-wrap img').getAttribute('src');
                        page.name = doc.querySelector('.header-title').textContent.trim();

                        render(user, html`
                            ${render_user()}
                        `);
                    } catch (e) {
                        console.error(e);
                    }
                });
        }

        return html`
            <div class="avatar">
                <img src=${page.avatar} alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
            </div>
            <strong>${page.name}</strong>
        `;
    }

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
        collage_settings.forEach(option => {
            option.setAttribute('disabled', true);
        });
        submit.disabled = true;

        page.state.collage = [];
        get_grid(1, pages);
    }

    function get_grid(current_page, pages) {
        render(body, html`
            <div class="loading-data-container">
                <div class="loading-data-text">${tl(trans.gathering_plays_for_user_pages).replace('{u}', page.name).replace('{current_page}', current_page).replace('{pages}', pages)}</div>
            </div>
        `);

        fetch(`${root}user/${page.name}/library/${type_select.value}?format=list&${timeframe_select.value}&page=${current_page}&ajax=1`)
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

        if (page.state.collage.length == 0) {
            render(body, html`
                <div class="loading-data-container">
                    <div class="loading-data-text failed">${tl(trans.no_plays_in_range)}</div>
                </div>
            `);

            type.querySelector('button').disabled = false;
            timeframe.querySelector('button').disabled = false;
            collage_settings.forEach(option => {
                option.setAttribute('disabled', false);
            });
            submit.disabled = false;

            return;
        }

        let grid = html.node`
            <ol class="grid-items grid-items--numbered collage-grid" style="--width: ${width_input.value}; --height: ${height_input.value}" data-width=${width_input.value} data-height=${height_input.value} />
        `;

        if (!settings.collage_grid_gap) {
            grid.style.setProperty('--item-list-gap', '0px');
            grid.style.setProperty('--item-med-radius', '0');
        }

        let total = width_input.value * height_input.value - 1;
        grid.style.setProperty('--highest', Math.max(+width_input.value, +height_input.value).toString());

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

        // 10 = item-list-gap
        // 15 = card-gap
        const default_size = 380;
        const base = 4;
        const highest = Math.max(+width_input.value, +height_input.value);

        const grid_item_size = Math.min(
            default_size,
            Math.floor(default_size * base / highest)
        );
        const grid_item_gap = (settings.collage_grid_gap) ? 10 : 0;
        const padding = (settings.collage_grid_gap) ? 15 : 0;
        const title_height = (settings.collage_title) ? (32 + 15) : 0;
        const width = padding * 2 + grid_item_size * width_input.value + grid_item_gap * (width_input.value - 1);
        const height = padding * 2 + title_height + grid_item_size * height_input.value + grid_item_gap * (height_input.value - 1);

        const cv_scale = 1;

        collage_dom.style.width = `${width}px`;
        collage_dom.style.height = `${height}px`;
        collage_dom.style.padding = `${padding}px`;
        collage_dom.style.gap = `${padding}px`;
        collage_dom.style.setProperty('--item-list-gap', `${grid_item_gap}px`);
        collage_dom.style.setProperty('--grid-item-size', `${grid_item_size}px`);

        let initial_canvas = html.node`
            <canvas width=${width * cv_scale} height=${height * cv_scale} />
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
                        el.style.setProperty('font-family', 'Overpass, Inter, Ubuntu Sans, Spline Sans, Roboto, Noto Sans, Noto Sans JP, Noto Sans KR, Noto Sans TC, Lucida Grande, Verdana, Tahoma, -apple-system, BlinkMacSystemFont, sans-serif');
                });
            }
        }).then((canvas => {
            canvas.toBlob(blob => {
                const blob_url = URL.createObjectURL(blob);

                const filename = tl(trans.chart_template_filename)
                    .replace('{timeframe}', timeframe.querySelector('button').textContent)
                    .replace('{user}', page.name)
                    .replace('{type}', tl(trans[type_select.value]))
                    .replace('{size}', `${width_input.value}x${height_input.value}`)
                    .replace('{brand}', version.brand);

                render(body, html`
                    <div class="collage-finished">
                        <strong>${tl(trans.your_collage_is_ready)}</strong>
                        <div class="button-group">
                            <button
                                class="btn primary icon"
                                data-type="download"
                                onclick=${() => download(blob_url, filename)}
                            >
                                ${tl(trans.download)}
                            </button>
                            <button
                                class="btn open"
                                data-type="open"
                                onclick=${() => open(blob_url)}
                            >
                                ${tl(trans.open)}
                            </button>
                        </div>
                    </div>
                    ${canvas}
                `);

                type.querySelector('button').disabled = false;
                timeframe.querySelector('button').disabled = false;
                collage_settings.forEach(option => {
                    option.setAttribute('disabled', false);
                });
                submit.disabled = false;
            }, 'image/png');
        }));
    }
}
