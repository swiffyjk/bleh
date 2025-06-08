//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html} from "lighterhtml";
import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {sanitise, sanitise_text} from "../build/tools";
import {tl, trans, trans_legacy} from "../build/trans";
import {prep_chart_colours} from "../chart";
import {correct_artist, correct_item_by_artist} from "../components/lotus";
import {refresh_all} from "../config";
import {ff} from "../sku";

export function bleh_user_library() {
    // date sidebar into its own panel
    let date_items = page.structure.side.querySelectorAll(':scope > :is(div, figure)');

    //let date_button_panel = document.createElement('section');
    //date_button_panel.classList.add('date-button-panel');

    let date_panel = document.createElement('section');
    date_panel.classList.add('date-panel');
    date_panel.setAttribute('data-glacier-graphs', settings.glacier_library_graphs);

    date_items.forEach((item, index) => {
        /*if (index == 0)
            date_button_panel.appendChild(item);
        else
            date_panel.appendChild(item);*/
        date_panel.appendChild(item);

        if (index == 0)
            page.structure.glacier.selector = item;
    });

    //page.structure.side.appendChild(date_button_panel);
    if (date_items.length > 0) {
        if (!page.mobile)
            page.structure.side.appendChild(date_panel);
        else
            page.structure.main.insertBefore(date_panel, page.structure.main.firstChild);
    }

    page.structure.glacier.date_panel = date_panel;


    // tabs
    let tabs = page.structure.container.querySelector('.library-controls .navlist-items');
    if (page.name == auth.name) {
        let velocity_tab = document.createElement('li');
        velocity_tab.classList.add('navlist-item', 'secondary-nav-item', 'secondary-nav-item--velocity');
        velocity_tab.innerHTML = (`
            <a class="secondary-nav-item-link" href="${root}labs/artist-velocity" target="_blank">
                ${tl(trans.velocity)}
            </a>
        `);
        tabs.appendChild(velocity_tab);
    } else {
        let compare_tab = document.createElement('li');
        compare_tab.classList.add('navlist-item', 'secondary-nav-item', 'secondary-nav-item--compare');
        compare_tab.innerHTML = (`
            <a class="secondary-nav-item-link" onclick="_compare()">
                ${tl(trans.compare)}
            </a>
        `);
        tabs.appendChild(compare_tab);
    }


    if (!ff('glacier_library'))
        return;


    if (settings.glacier_library_graphs && date_items.length > 0) {
        let chart_view_selector = document.createElement('div');
        chart_view_selector.classList.add('view-buttons', 'chart-view-selector', 'view-buttons-middle');
        chart_view_selector.innerHTML = (`
            <button class="btn view-item" id="toggle-chart_view-line" data-toggle="chart_view" data-toggle-value="line" onclick="_update_item('chart_view', 'line')">
                ${tl(trans.line)}
            </button>
            <button class="btn view-item" id="toggle-chart_view-pie" data-toggle="chart_view" data-toggle-value="pie" onclick="_update_item('chart_view', 'pie')">
                ${tl(trans.pie)}
            </button>
            <button class="btn view-item" id="toggle-chart_view-bar" data-toggle="chart_view" data-toggle-value="bar" onclick="_update_item('chart_view', 'bar')">
                ${tl(trans.bar)}
            </button>
        `);

        page.structure.glacier.selector.after(chart_view_selector);

        let chart_axis_selector = document.createElement('div');
        chart_axis_selector.classList.add('view-buttons', 'chart-axis-selector', 'view-buttons-middle');
        chart_axis_selector.innerHTML = (`
            <button class="btn view-item" id="toggle-chart_bar_axis-horizontal" data-toggle="chart_bar_axis" data-toggle-value="horizontal" onclick="_update_item('chart_bar_axis', 'horizontal')">
                ${tl(trans.horizontal)}
            </button>
            <button class="btn view-item" id="toggle-chart_bar_axis-vertical" data-toggle="chart_bar_axis" data-toggle-value="vertical" onclick="_update_item('chart_bar_axis', 'vertical')">
                ${tl(trans.vertical)}
            </button>
        `);

        chart_view_selector.after(chart_axis_selector);

        refresh_all(page.structure.glacier.date_panel);
    }


    //let picker_content = date_button_panel.querySelector('.date-range-picker-content');
    if (date_items.length > 0)
        bleh_glacier_library_date();


    if (page.subpage == 'library_overview' || page.subpage.endsWith('-search')) {
        // scrobbles tab
        bleh_glacier_library_top(true);

        page.state.glacier.insights = {
            artist: {
                display: false,
                values: [],
                labels: [],
                highest: {
                    value: 0,
                    label: '',
                    link: '',
                    img: ''
                }
            },
            album: {
                display: false,
                values: [],
                labels: [],
                highest: {
                    value: 0,
                    label: '',
                    link: '',
                    img: ''
                }
            },
            track: {
                display: false,
                values: [],
                labels: [],
                highest: {
                    value: 0,
                    label: '',
                    link: '',
                    img: ''
                }
            }
        };
    }

    if (date_items.length > 0 && (
        page.subpage == 'library_overview' || page.subpage.startsWith('library_artist_') ||
    page.subpage.startsWith('library_album_') || page.subpage.startsWith('library_track_'))) {
        // new graph
        log('refresh is now marked true', 'glacier library');
        page.structure.glacier.refresh = true;
        bleh_glacier_date_graph(true);
    }

    if (
        page.subpage.startsWith('library_artist_') ||
        page.subpage.startsWith('library_album_') ||
        page.subpage.startsWith('library_track_')
    ) {
        bleh_glacier_library_focused();
    }
}

function bleh_glacier_library_date() {
    let picker_content = page.structure.glacier.date_panel.querySelector('.date-range-picker-content:not([data-glacier-library-date])');

    if (picker_content == null)
        return;
    picker_content.setAttribute('data-glacier-library-date', 'true');

    let picker_presets = picker_content.querySelector('.date-range-picker-presets-wrap');
    let picker_col_2 = picker_content.querySelector('.date-range-picker-presets--col-2');

    /*let all_time_preset = picker_col_2.querySelector('.date-range-picker-preset:last-child');
    picker_presets.after(all_time_preset);*/

    // this year
    let new_wrap = document.createElement('div');
    new_wrap.classList.add('date-range-picker-presets-wrap');

    let new_presets = document.createElement('ul');
    new_presets.classList.add('date-range-picker-presets');

    let params = new URLSearchParams(document.location.search);
    page.requested.from = params.get('from');
    page.requested.to = params.get('to');
    page.requested.rangetype = params.get('rangetype');

    let current_year = new Date().getFullYear();
    let previous_year = current_year - 1;
    if (current_year >= 2025) {
        new_presets.classList.add('date-range-picker-presets-2');

        let last_year = document.createElement('div');
        last_year.classList.add('date-range-picker-preset', 'date-range-picker-preset-custom', 'date-range-picker-preset-last-year');
        last_year.innerHTML = (`
            <a href="${window.location.href.replace(window.location.search, '')}?from=${previous_year}-01-01&rangetype=year">
                ${previous_year}
            </a>
        `);
        new_presets.appendChild(last_year);

        let this_year = document.createElement('div');
        this_year.classList.add('date-range-picker-preset', 'date-range-picker-preset-custom', 'date-range-picker-preset-this-year');
        this_year.innerHTML = (`
            <a href="${window.location.href.replace(window.location.search, '')}?from=${current_year}-01-01&rangetype=year">
                ${current_year}
            </a>
        `);
        new_presets.appendChild(this_year);

        if (page.requested.from == `${current_year}-01-01` && (page.requested.to == `${current_year}-12-31` || page.requested.rangetype == 'year'))
            this_year.classList.add('date-range-picker-preset--selected');
        else if (page.requested.from == `${previous_year}-01-01` && (page.requested.to == `${previous_year}-12-31` || page.requested.rangetype == 'year'))
            last_year.classList.add('date-range-picker-preset--selected');
    } else {
        new_presets.classList.add('date-range-picker-presets-wide');

        let this_year = document.createElement('div');
        this_year.classList.add('date-range-picker-preset', 'date-range-picker-preset-custom', 'date-range-picker-preset-this-year');
        this_year.innerHTML = (`
            <a href="${window.location.href.replace(window.location.search, '')}?from=${current_year}-01-01&rangetype=year">
                ${current_year}<span class="new-badge">${tl(trans.new)}</span>
            </a>
        `);
        new_presets.appendChild(this_year);

        if (page.requested.from == `${current_year}-01-01` && (page.requested.to == `${current_year}-12-31` || page.requested.rangetype == 'year'))
            this_year.classList.add('date-range-picker-preset--selected');
    }

    //picker_col_2.appendChild(this_year);
    new_wrap.appendChild(new_presets);
    picker_presets.after(new_wrap);
}

// can update at any time!!
export function bleh_glacier_library() {
    // table
    bleh_glacier_library_table();

    // top header info
    bleh_glacier_library_top();

    // new graph
    bleh_glacier_date_graph();
}

function bleh_glacier_library_table() {
    if (!ff('glacier_library'))
        return;

    let table = page.structure.glacier.date_panel.querySelector('.highcharts-root');

    if (table == null)
        return;

    console.log('glacier library', table);
    log('refresh is now marked false (table log)', 'glacier library');
    page.structure.glacier.refresh = false;

    let current_view = page.structure.glacier.date_panel.querySelector('.date-range-picker-button-inner');

    if (current_view == null) {
        console.log('glacier library current view', page.structure.glacier.date_panel.innerHTML);
        log('returned as current view is null', 'glacier library');
        log('refresh is now marked true', 'glacier library');
        page.structure.glacier.refresh = true;
        return;
    }

    if (table.hasAttribute('data-glacier-library-table'))
        return;
    table.setAttribute('data-glacier-library-table', 'true');

    page.structure.glacier.table = table;
    log('refresh is now marked true (table found)', 'glacier library');
    page.structure.glacier.refresh = true;
    log('pending refresh', 'glacier library');
}

function bleh_glacier_library_top(static_page = false) {
    if (!ff('glacier_library'))
        return;

    let legacy_top_header;
    if (!static_page)
        legacy_top_header = page.structure.main.querySelector('.library-top');
    else
        legacy_top_header = page.structure.main.querySelector('.metadata-list');

    if (!legacy_top_header) return;

    legacy_top_header.classList.add('glacier-legacy-top-header');

    if (!static_page) {
        if (legacy_top_header.style.getPropertyValue('display')) {
            legacy_top_header.removeAttribute('data-glacier-library-top');
            return;
        }

        if (legacy_top_header.hasAttribute('data-glacier-library-top'))
            return;
        legacy_top_header.setAttribute('data-glacier-library-top', 'true');
    }

    log('loading top', 'glacier library');

    let metadata = legacy_top_header.querySelectorAll('.metadata-item');

    let first_run = false;
    let glacier_top = page.structure.glacier.top;
    if (!glacier_top || !page.structure.main.contains(glacier_top))
        first_run = true;

    if (first_run) {
        glacier_top = document.createElement('section');
        glacier_top.classList.add('glacier-library-top');
    }


    // meta
    let glacier_meta;
    if (first_run) {
        glacier_meta = document.createElement('div');
        glacier_meta.classList.add('glacier-library-metadata');
    } else {
        glacier_meta = page.structure.glacier.top.querySelector('.glacier-library-metadata');
        glacier_meta.innerHTML = '';
    }

    metadata.forEach((meta, index) => {
        let text = meta.querySelector('.metadata-title');
        let value = meta.querySelector('.metadata-display').textContent;

        if (text) {
            text = text.textContent;

            if (page.subpage == 'library_overview') {
                if (index == 1)
                    text = tl(trans.average);
            } else if (page.subpage == 'library_artists') {
                text = tl(trans.artists);
            } else if (page.subpage == 'library_albums') {
                text = tl(trans.albums);
            } else if (page.subpage == 'library_tracks') {
                text = tl(trans.tracks);
            }
        } else {
            // search results
            text = tl(trans.results_for);
            value = meta.querySelector('.metadata-display').textContent;

            let start = value.indexOf('“') + 1;
            let end = value.indexOf('”');
            value = value.substring(start, end);
        }

        glacier_meta.appendChild(html.node`
            <div class="glacier-library-metadata-item">
                <div class="sub-text">${text}</div>
                <div class="glacier-library-metadata-item-value">${value}</div>
            </div>
        `);
    });

    if (first_run)
        glacier_top.appendChild(glacier_meta);

    if (!first_run)
        return;


    // buttons
    let top_wrap = page.structure.main.querySelector('.library-top-wrap');

    let view_buttons = document.createElement('div');
    view_buttons.classList.add('view-buttons', 'glacier-library-buttons');

    let add_divider = false;

    let sort = legacy_top_header.querySelector('.library-sort');
    if (!static_page) {
        let sort_button;
        if (sort) {
            sort_button = sort.querySelector('.dropdown-menu-clickable-button');
            add_divider = true;

            if (sort_button) {
                sort_button.classList.add('btn', 'view-item', 'glacier-library-button');
                let sort_menu = sort.querySelector('.dropdown-menu-clickable');

                view_buttons.appendChild(sort_button);
                view_buttons.appendChild(sort_menu);
            }
        }
    }

    if (!static_page && page.subpage != 'library_tracks') {
        let format_button = document.createElement('button');
        format_button.classList.add('btn', 'view-item', 'glacier-library-button', 'glacier-view-button');
        format_button.setAttribute('onclick', '_update_glacier_view()');
        page.structure.glacier.format = format_button;
        add_divider = true;

        if (top_wrap.getAttribute('data-current-format') == 'grid') {
            format_button.setAttribute('data-glacier-view', 'grid');
            format_button.textContent = tl(trans.grid);
        } else {
            format_button.setAttribute('data-glacier-view', 'list');
            format_button.textContent = tl(trans.list);
        }

        view_buttons.appendChild(format_button);
    }

    if (!static_page && add_divider) {
        let listen_divider = document.createElement('div');
        listen_divider.classList.add('listen-divider');
        view_buttons.appendChild(listen_divider);
    }

    let configure_button = document.createElement('button');
    configure_button.classList.add('btn', 'view-item', 'glacier-library-button', 'glacier-configure-button', 'panel-settings-button');
    configure_button.textContent = tl(trans.settings);

    tippy(configure_button, {
        content: tl(trans.settings)
    });

    tippy(configure_button, {
        theme: 'window',
        content: html.node`
            <div class="dialog-settings">
                ${(page.subpage == 'library_artists') ? html.node`
                <div class="setting" data-type="toggle" id="container-colourful_counts" onclick="_update_item('colourful_counts')">
                    <div class="heading">
                        <h5>${tl(trans.colourful_counts.name)}</h5>
                        <p>${tl(trans.colourful_counts.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-colourful_counts" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                ` : html.node`
                <div class="setting" data-type="toggle" id="container-format_guest_features" onclick="_update_item('format_guest_features')">
                    <button class="btn reset" onclick="_reset_item('format_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.format_guest_features.name)}</h5>
                        <p>${tl(trans.format_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-format_guest_features" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting hide-if-format-guest-disabled" data-type="toggle" id="container-show_guest_features" onclick="_update_item('show_guest_features')">
                    <button class="btn reset" onclick="_reset_item('show_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.show_guest_features.name)}</h5>
                        <p>${tl(trans.show_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_guest_features" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                `}
                <div class="sep"></div>
                ${((page.subpage == 'library_artists' || page.subpage == 'library_albums') && auth.pro) ? html.node`
                <div class="setting" data-type="toggle" id="container-grid_glow" onclick="_update_item('grid_glow')">
                    <button class="btn reset" onclick="_reset_item('grid_glow')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.grid_glow.name)}</h5>
                        <p>${tl(trans.grid_glow.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-grid_glow" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                ` : ''}
                <div class="setting" data-type="toggle" id="container-glacier_library_graphs" onclick="_update_item('glacier_library_graphs')">
                    <button class="btn reset" onclick="_reset_item('glacier_library_graphs')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.glacier_graphs.name)}</h5>
                        <p>${tl(trans.glacier_graphs.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-glacier_library_graphs" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
        `,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow(instance) {
            refresh_all(instance.popper);
        }
    });

    view_buttons.appendChild(configure_button);

    glacier_top.appendChild(view_buttons);


    page.structure.glacier.top = glacier_top;
    page.structure.main.insertBefore(glacier_top, page.structure.main.firstElementChild);
}

unsafeWindow._update_glacier_view = function() {
    let format = page.structure.main.querySelector('.library-view-button');
    if (format == null)
        return;

    format.click();

    if (format.getAttribute('href') && format.getAttribute('href').endsWith('reset')) {
        page.structure.glacier.format.setAttribute('data-glacier-view', 'list');
        page.structure.glacier.format.textContent = tl(trans.list);
    } else {
        page.structure.glacier.format.setAttribute('data-glacier-view', 'grid');
        page.structure.glacier.format.textContent = tl(trans.grid);
    }
}


function bleh_glacier_date_graph(static_page = false, own_table = null) {
    if (!page.structure.glacier.refresh)
        return;

    if (!settings.glacier_library_graphs)
        return;

    log('reviewing graph situation', 'glacier library');

    if (own_table != null) {
        log('table has been passed to function (from network request presumably?)', 'glacier library', 'info', own_table);
    } else {
        log('no table has been passed, must source ourselves', 'glacier library');
    }

    /*let scrobble_chart_wrap = page.structure.side.querySelector('.scrobble-table:not([data-glacier-date-graph])');

    if (scrobble_chart_wrap == null)
        return;

    scrobble_chart_wrap.setAttribute('data-glacier-date-graph', 'true');*/

    bleh_glacier_library_date();

    let current_view = page.structure.glacier.date_panel.querySelector('.date-range-picker-button-inner');

    if (!current_view)
        return;

    current_view = current_view.textContent.trim();

    let tab_matches;
    if (page.name == page.state.glacier.name &&
        (page.subpage == 'library_overview' || page.subpage == 'library_artists' || page.subpage == 'library_albums' || page.subpage == 'library_tracks') &&
        (page.state.glacier.current_tab == 'library_overview' || page.state.glacier.current_tab == 'library_artists' || page.state.glacier.current_tab == 'library_albums' || page.state.glacier.current_tab == 'library_tracks'))
        tab_matches = true;

    if (page.state.glacier.current_view == current_view && !own_table && tab_matches) {
        // re-use old values as view matches
        bleh_glacier_date_graph_generate();
        log('refresh is now marked false', 'glacier library');
        page.structure.glacier.refresh = false;

        log(`returned as view (${current_view}) matches ${page.state.glacier.current_view}. last tab was ${page.state.glacier.current_tab} (${page.state.glacier.name}) and current tab is ${page.subpage} (${page.name})`, 'glacier library');
        return;
    }

    page.state.glacier.current_view = current_view;

    let scrobble_chart_content = page.structure.row.querySelector('#scrobble-chart-content');
    if (!scrobble_chart_content) return;

    if (scrobble_chart_content.getAttribute('data-highcharts-chart') && scrobble_chart_content.getAttribute('data-highcharts-chart') == '0') {
        log('highchart registered', 'glacier library');
        log('refresh is now marked false', 'glacier library');
        page.structure.glacier.refresh = false;
        return;
    }

    let scrobble_chart_wrap = page.structure.row.querySelector('.scrobble-table');

    if (!scrobble_chart_wrap)
        return;

    let scrobble_table;
    if (own_table)
        scrobble_table = own_table;
    else
        scrobble_table = scrobble_chart_wrap.querySelector('.table');

    if (!scrobble_table) {
        // lets see if we can make this request ourselves
        let request_url;
        if (window.location.search == '')
            request_url = `${window.location.href}/chart?ajax=1`;
        else
            request_url = window.location.href.replace(window.location.search, `/chart${window.location.search}&ajax=1`);
        bleh_glacier_library_request(request_url);
        /*console.info(page.structure.glacier.table);

        let series = page.structure.glacier.table.querySelectorAll('.highcharts-bar-series a');

        // we fake-hover the first bar to get the relationship
        // between height and real value
        let subject = series[0];
        let bar = subject.querySelector('rect');
        let height = bar.getAttribute('height');

        setTimeout(function() {
            subject.dispatchEvent(new Event('mouseover'));
        }, 300);

        subject.addEventListener('mouseover', e => {
            console.info(e);
        });*/


        return;
    }

    let chart_type = scrobble_table.getAttribute('data-bucket-size');
    let entries = scrobble_table.querySelectorAll('tbody tr');

    page.state.glacier.labels = [];
    page.state.glacier.links = [];
    page.state.glacier.values = [];

    let values_not_empty = 0;

    entries.forEach((entry) => {
        let period = entry.querySelector('.js-period a');
        let value = entry.querySelector('.js-scrobbles').textContent.trim();

        page.state.glacier.labels.push(period.textContent.trim());
        page.state.glacier.links.push(period.getAttribute('href'));
        page.state.glacier.values.push(value);

        if (value != '0')
            values_not_empty += 1;
    });

    if (values_not_empty == 0) {
        log('graph cancelled as all values are 0', 'glacier library');
        page.structure.glacier.refresh = false;
        return;
    }

    scrobble_table.innerHTML = '';

    bleh_glacier_date_graph_generate();

    log('refresh is now marked false (finished generating)', 'glacier library');
    page.structure.glacier.refresh = false;
}

export function bleh_glacier_insights(insights = null) {
    if (insights) {
        if (page.subpage == 'library_artists') {
            page.state.glacier.insights.album.display = false;
            page.state.glacier.insights.track.display = false;
        }
        if (page.subpage == 'library_albums') {
            page.state.glacier.insights.artist.display = false;
            page.state.glacier.insights.track.display = false;
        }
        if (page.subpage == 'library_tracks') {
            page.state.glacier.insights.artist.display = false;
            page.state.glacier.insights.album.display = false;
        }

        for (let item in insights) {
            log(`checking insights status of item ${item} - display of ${insights[item].display}`, 'glacier library', 'info', {checking: insights[item], global: page.state.glacier.insights[item]});
            if (insights[item].display && JSON.stringify(insights[item]) != JSON.stringify(page.state.glacier.insights[item])) {
                log(`confirmed insights status of item ${item} - is different`, 'glacier library');
                page.state.glacier.insights[item] = insights[item];

                bleh_glacier_insights_generate(item, page.state.glacier.insights[item]);
            }
        }
    } else {
        for (let item in page.state.glacier.insights) {
            if (page.state.glacier.insights[item].display)
                bleh_glacier_insights_generate(item, page.state.glacier.insights[item]);
        }
    }
}

function bleh_glacier_insights_generate(type, item) {
    if (item.highest.value == 0)
        return;

    log(`requesting insights generator for ${type}`, 'glacier library', 'info', item);

    let new_run = false;
    let scrobble_insights_panel = page.structure.side.querySelector(`.scrobble-insights-panel[data-type="${type}"]`);
    if (!scrobble_insights_panel) {
        scrobble_insights_panel = document.createElement('section');
        scrobble_insights_panel.classList.add('scrobble-insights-panel');
        scrobble_insights_panel.setAttribute('data-type', type);
        new_run = true;
    }
    scrobble_insights_panel.innerHTML = `<h2>${trans_legacy.en[type].plural}</h2>`;

    let scrobble_canvas_container = document.createElement('div');
    scrobble_canvas_container.classList.add('scrobble-insights-canvas-container');

    let scrobble_canvas = document.createElement('canvas');
    scrobble_canvas.classList.add('scrobble-insights-canvas');

    Chart.defaults.color = page.state.chart_colours.text_col;
    Chart.defaults.font.family = 'Ubuntu Sans';
    if (settings.chart_insights_view == 'line') {
        let gradient = scrobble_canvas.getContext('2d').createLinearGradient(0, 0, 0, 160);
        try {
            gradient.addColorStop(0, page.state.chart_colours.link_bg_col);
            gradient.addColorStop(1, page.state.chart_colours.link_bg_col_2);
        } catch(e) {
            gradient = page.state.chart_colours.link_bg_col;
        }

        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: item.labels,
                datasets: [{
                    data: item.values,
                    borderWidth: 2,
                    backgroundColor: gradient,
                    borderColor: page.state.chart_colours.link_col,
                    fill: true,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1
                }]
            },
            options: page.state.chart_library_line_options_no_click
        });
    } else if (settings.chart_insights_view == 'pie') {
        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: item.labels,
                datasets: [{
                    data: item.values,
                    borderWidth: 2,
                    backgroundColor: [
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '360')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '340')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '320')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '300')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '280')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '270')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '255')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '235')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '220')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '208')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '200')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '180')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '160')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '140')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '120')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '100')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '80')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '60')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '40')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '20')})`
                    ],
                    borderColor: page.state.chart_colours.bg_col,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1
                }]
            },
            options: page.state.chart_library_pie_options_no_click
        });
    } else if (settings.chart_insights_view == 'bar') {
        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: item.labels,
                datasets: [{
                    data: item.values,
                    borderWidth: 0,
                    backgroundColor: [
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '360')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '340')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '320')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '300')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '280')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '270')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '255')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '235')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '220')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '208')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '200')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '180')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '160')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '140')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '120')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '100')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '80')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '60')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '40')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '20')})`
                    ],
                    borderColor: page.state.chart_colours.bg_col,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1,
                    borderRadius: 9
                }]
            },
            options: page.state.chart_library_bar_options_no_click
        });
    }

    scrobble_canvas_container.appendChild(scrobble_canvas);
    scrobble_insights_panel.appendChild(scrobble_canvas_container);
    if (new_run)
        page.structure.side.appendChild(scrobble_insights_panel);
}

export function bleh_glacier_library_open_index(index) {
    window.location.href = page.state.glacier.links[index];
}


function bleh_glacier_library_request(request_url) {
    log(`making our own request with ${request_url}`, 'glacier library');
    console.info(page.structure.glacier.refresh);
    page.structure.glacier.refresh = false;

    page.structure.glacier.date_panel.classList.add('data-is-loading');

    fetch(request_url)
    .then(function(response) {
        console.log('glacier library returned', response, response.text, response.status);

        if (response.status != 200)
            throw new Error;

        return response.text();
    })
    .then(function(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        console.log('glacier library DOC', doc, doc.querySelector('.table'));

        log('received response', 'glacier library');
        log('refresh is now marked true', 'glacier library');
        page.structure.glacier.refresh = true;

        let table = doc.querySelector('.table');

        if (table != null) {
            bleh_glacier_date_graph(false, table);
        } else {
            log('table is null?', 'glacier library', 'error');
            console.info('glacier library', doc.body.innerHTML);
            console.info('glacier library', new DOMParser().parseFromString(doc.body.innerHTML, 'text/html'));
            throw new Error;
        }

        page.structure.glacier.date_panel.classList.remove('data-is-loading');
    });
}

export function bleh_glacier_date_graph_generate() {
    page.state.glacier.current_tab = page.subpage;
    page.state.glacier.name = page.name;
    log('generating', 'glacier library', 'info', {
        labels: page.state.glacier.labels,
        links: page.state.glacier.links,
        values: page.state.glacier.values
    });

    prep_chart_colours();

    let new_run = false;
    let scrobble_canvas_container = page.structure.glacier.date_panel.querySelector('.scrobble-canvas-container');
    if (scrobble_canvas_container == null) {
        scrobble_canvas_container = document.createElement('div');
        scrobble_canvas_container.classList.add('scrobble-canvas-container');
        new_run = true;
    } else {
        scrobble_canvas_container.innerHTML = '';
    }

    let scrobble_canvas = document.createElement('canvas');
    scrobble_canvas.classList.add('scrobble-canvas');

    Chart.defaults.color = page.state.chart_colours.text_col;
    Chart.defaults.font.family = 'Ubuntu Sans';
    if (settings.chart_view == 'line') {
        let gradient = scrobble_canvas.getContext('2d').createLinearGradient(0, 0, 0, 160);
        try {
            gradient.addColorStop(0, page.state.chart_colours.link_bg_col);
            gradient.addColorStop(1, page.state.chart_colours.link_bg_col_2);
        } catch(e) {
            gradient = page.state.chart_colours.link_bg_col;
        }

        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: page.state.glacier.labels,
                datasets: [{
                    data: page.state.glacier.values,
                    borderWidth: 2,
                    backgroundColor: gradient,
                    borderColor: page.state.chart_colours.link_col,
                    fill: true,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1
                }]
            },
            options: page.state.chart_library_line_options
        });
    } else if (settings.chart_view == 'pie') {
        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'pie',
            data: {
                labels: page.state.glacier.labels,
                datasets: [{
                    data: page.state.glacier.values,
                    borderWidth: 2,
                    backgroundColor: [
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '360')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '340')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '320')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '300')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '280')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '270')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '255')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '235')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '220')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '208')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '200')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '180')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '160')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '140')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '120')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '100')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '80')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '60')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '40')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '20')})`
                    ],
                    borderColor: page.state.chart_colours.bg_col,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1
                }]
            },
            options: page.state.chart_library_pie_options
        });
    } else if (settings.chart_view == 'bar') {
        let scrobble_chart = new Chart(scrobble_canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: page.state.glacier.labels,
                datasets: [{
                    data: page.state.glacier.values,
                    borderWidth: 0,
                    backgroundColor: [
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '360')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '340')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '320')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '300')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '280')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '270')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '255')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '235')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '220')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '208')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '200')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '180')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '160')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '140')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '120')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '100')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '80')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '60')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '40')})`,
                        `hsl(${page.state.chart_colours.link_h_col.replace(page.state.chart_colours.hue, '20')})`
                    ],
                    borderColor: page.state.chart_colours.bg_col,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    tension: 0.1,
                    borderRadius: 9
                }]
            },
            options: (settings.chart_bar_axis == 'horizontal') ? page.state.chart_library_bar_options : page.state.chart_library_bar_v_options
        });
    }

    scrobble_canvas_container.appendChild(scrobble_canvas);
    if (new_run)
        page.structure.glacier.date_panel.appendChild(scrobble_canvas_container);
}


function bleh_glacier_library_focused() {
    page.state.glacier.insights.artist = {
        display: false,
        values: [],
        labels: [],
        highest: {
            value: 0,
            label: '',
            link: '',
            img: ''
        }
    };

    let legacy_header = page.structure.main.querySelector('.library-header');

    let type;
    if (page.subpage.startsWith('library_artist'))
        type = 'artist';
    else if (page.subpage.startsWith('library_album'))
        type = 'album';
    else if (page.subpage.startsWith('library_track'))
        type = 'track';


    let header_title = legacy_header.querySelector('.library-header-crumb'); // subpage
    if (!header_title)
        header_title = legacy_header.querySelector('.library-header-title'); // main

    let duration = header_title.querySelector('.library-header-title-duration');
    if (duration)
        header_title.removeChild(duration);

    header_title = header_title.textContent.trim();

    let artist = legacy_header.querySelector('.text-colour-link');
    if (artist)
        artist = artist.textContent.trim();

    let image = legacy_header.querySelector('.library-header-image img');

    let link = `${root}music/${sanitise(header_title)}`;
    if (type == 'album')
        link = `${root}music/${sanitise(artist)}/${sanitise(header_title)}`;
    else if (type == 'track')
        link = `${root}music/${sanitise(artist)}/_/${sanitise(header_title)}`;


    let header = document.createElement('section');
    header.classList.add('glacier-library-top', 'glacier-library-focused-header');

    let upper_wrap = document.createElement('div');
    upper_wrap.classList.add('glacier-library-top-upper');

    let current_suffix = window.location.search;

    let metadata = html.node`
        <div class="glacier-library-metadata">
            <div class="glacier-library-metadata-avatar">
                ${image}
            </div>
            <div class="glacier-library-metadata-item">
                <div class="sub-text">
                    ${tl(trans[type])}
                </div>
                <div class="glacier-library-metadata-item-value glacier-library-metadata-focus" data-type="${type}">
                    <a href="${link}">${(type == 'artist') ? correct_artist(header_title) : correct_item_by_artist(header_title, artist)}</a>${(duration) ? html.node`<span class="glacier-library-track-duration">${duration.textContent}</span>` : ''}${(type != 'artist') ? html`${{html: trans_legacy.en.glacier.by_artist.replace('{a}', `<a href="${root}user/${page.name}/library/music/+noredirect/${sanitise(artist)}${current_suffix}">${sanitise_text(correct_artist(artist))}</a>`)}}` : ''}
                </div>
            </div>
        </div>
    `;

    upper_wrap.appendChild(metadata);
    header.appendChild(upper_wrap);

    let view_buttons = document.createElement('div');
    view_buttons.classList.add('view-buttons', 'glacier-library-buttons');

    let cta = legacy_header.querySelector('.library-header-ctas');

    let love_form = legacy_header.querySelector('.library-header-love-form:not(:has(button))');
    if (love_form) {
        let state = love_form.querySelector(':scope > .love-button-toggle').getAttribute('data-ajax-form-state');
        if (state == 'loved')
            state = 0;
        else
            state = 1;

        let love_form_items = love_form.querySelectorAll(':scope > div > div');
        love_form_items.forEach((item, index) => {
            if (state != index)
                item.classList.add('hide');

            cta.appendChild(item);
        });
    }

    if (cta) {
        let wrappers = cta.querySelectorAll(':scope > *');
        wrappers.forEach((wrapper) => {
            let button;

            console.info('wrapper', wrapper);

            if (wrapper.classList[0] == 'library-header-cta-item')
                button = wrapper;
            else
                button = wrapper.querySelector('button');

            if (!button)
                button = wrapper.querySelector('span');

            if (!button) return;

            console.info('libraryyy', wrapper, button);
            button.classList.add('btn', 'view-item', 'glacier-library-button');

            let tooltips = wrapper.querySelectorAll('.user-library-controls-tooltip');
            tooltips.forEach((tooltip) => {
                tooltip.parentElement.removeChild(tooltip);
            });

            view_buttons.appendChild(wrapper);

            let action = button.getAttribute('data-analytics-action');
            if (action) {
                if (action == 'EditScrobbleOpen') {
                    button.textContent = trans_legacy.en.glacier.edit;
                } else if (action == 'UnloveTrack' || action == 'LoveTrack') {
                    //button.textContent = trans_legacy.en.glacier.love;

                    let listen_divider = document.createElement('div');
                    listen_divider.classList.add('listen-divider');
                    view_buttons.appendChild(listen_divider);


                    // we need to target the other button too lol
                    button = wrapper.querySelector('button:not(.btn)');
                    if (button)
                        button.classList.add('btn', 'view-item', 'glacier-library-button');
                }
            } else {
                // have to read classlist
                if (button.classList.contains('delete-icon')) {
                    button.textContent = tl(trans.delete);
                }
            }
        });

        if (wrappers.length > 0) {
            let listen_divider = document.createElement('div');
            listen_divider.classList.add('listen-divider');
            view_buttons.appendChild(listen_divider);
        }
    }



    if (page.subpage == 'library_artist_overview' && auth.pro) {
        let search = document.createElement('a');
        search.classList.add('btn', 'view-item', 'glacier-library-button', 'glacier-search-button');
        search.textContent = tl(trans.search);
        search.setAttribute('href', `${root}user/${page.name}/library/tracks/search?query=${sanitise(correct_artist(header_title))}`);

        tippy(search, {
            content: tl(trans.search_guest)
        });

        let divider = view_buttons.querySelector('.listen-divider');
        if (divider)
            view_buttons.insertBefore(search, divider);
    }

    let configure_button = document.createElement('button');
    configure_button.classList.add('btn', 'view-item', 'glacier-library-button', 'glacier-configure-button', 'panel-settings-button');
    configure_button.textContent = tl(trans.settings);

    tippy(configure_button, {
        content: tl(trans.settings)
    });

    tippy(configure_button, {
        theme: 'window',
        content: html.node`
            <div class="dialog-settings">
                <div class="setting" data-type="toggle" id="container-format_guest_features" onclick="_update_item('format_guest_features')">
                    <button class="btn reset" onclick="_reset_item('format_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.format_guest_features.name)}</h5>
                        <p>${tl(trans.format_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-format_guest_features" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting hide-if-format-guest-disabled" data-type="toggle" id="container-show_guest_features" onclick="_update_item('show_guest_features')">
                    <button class="btn reset" onclick="_reset_item('show_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.show_guest_features.name)}</h5>
                        <p>${tl(trans.show_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_guest_features" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="toggle" id="container-glacier_library_graphs" onclick="_update_item('glacier_library_graphs')">
                    <button class="btn reset" onclick="_reset_item('glacier_library_graphs')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.glacier_graphs.name)}</h5>
                        <p>${tl(trans.glacier_graphs.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-glacier_library_graphs" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
        `,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow(instance) {
            refresh_all(instance.popper);
        }
    });

    view_buttons.appendChild(configure_button);

    upper_wrap.appendChild(view_buttons);

    let lower_wrap = document.createElement('div');
    lower_wrap.classList.add('glacier-library-top-lower');

    let lower_metadata = document.createElement('div');
    lower_metadata.classList.add('glacier-library-metadata');

    let legacy_meta_wrap = page.structure.main.querySelector('.metadata-list');
    if (legacy_meta_wrap) {
        let metadatas = legacy_meta_wrap.querySelectorAll('.metadata-item:not(.library-header-ctas__wrapper)');

        metadatas.forEach((meta) => {
            let glacier_meta_item = document.createElement('div');
            glacier_meta_item.classList.add('glacier-library-metadata-item');
            glacier_meta_item.innerHTML = (`
                <div class="sub-text">${meta.querySelector('.metadata-title').textContent}</div>
                <div class="glacier-library-metadata-item-value">${meta.querySelector('.metadata-display').textContent}</div>
            `);

            lower_metadata.appendChild(glacier_meta_item);
        });
    }

    lower_wrap.appendChild(lower_metadata);

    header.appendChild(lower_wrap);

    page.structure.main.insertBefore(header, page.structure.main.firstElementChild);


    // move random overview header into their section below
    let overview_header = page.structure.main.querySelector(':scope > .library-overview-header');
    if (!overview_header) return;

    overview_header.nextElementSibling.insertBefore(overview_header, overview_header.nextElementSibling.firstElementChild);
}

export function bleh_glacier_library_bulk_edit() {
    // quick check to see if bulk edit is present
    let library_header = page.structure.main.querySelector('.library-header');

    let bulk_edit = library_header.querySelector('[href="javascript:void(0)"]');
    if (!bulk_edit) return;

    // move to new area
    let view_buttons = page.structure.main.querySelector('.glacier-library-buttons');
    if (!view_buttons) return;

    let edit_form = view_buttons.querySelector(':scope > .library-header-edit-form');
    let delete_button = view_buttons.querySelector(':scope > .delete-icon');
    if (!delete_button) return;

    bulk_edit.classList.add('btn', 'view-item', 'glacier-library-button', 'bulk-edit-button');
    bulk_edit.textContent = trans_legacy.en.glacier.bulk_edit;

    if (!edit_form)
        view_buttons.insertBefore(bulk_edit, delete_button);
    else
        view_buttons.insertBefore(bulk_edit, edit_form);
}
