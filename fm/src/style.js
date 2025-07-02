//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html} from "lighterhtml";
import {settings} from "./build/config";
import {log} from "./build/log";
import {tl, trans} from "./build/trans";
import {chart_reflow} from "./chart";
import {dialog, dialog_rm} from "./components/dialog";
import {create_settings_template, invoke_reload} from "./config";
import {theme_version} from "./main";
import {save_setting} from "./components/settings.js";

export function append_style() {
    document.documentElement.classList.add('bleh-supports-loading');

    for (var member in settings) delete settings[member];
    Object.assign(settings, JSON.parse(localStorage.getItem('bleh')) || create_settings_template());

    let cached_style = localStorage.getItem('bleh_cached_style') || '';

    let url = window.location.href;
    let url_split = url.split('/');
    let url_length = url_split.length - 1;

    // style is neither fetched nor applied in these interfaces
    if (url_split[url_length] == 'playback' || url_split[url_length - 1] == 'labs')
        return;

    document.documentElement.setAttribute('data-bleh--theme', settings.theme);

    if (settings.dev) return;

    if (cached_style == '') {
        // style has never been cached
        log('never cached, fetching', 'style');
        fetch_new_style();
    } else {
        // style is currently cached, load that first
        // ensures no flashing missing styles hopefully
        log('requesting cache', 'style');
        load_cached_style(cached_style);
    }
}

function load_cached_style(cached_style) {
    let style_cache = html.node`
        <style id="bleh--cached-style">${cached_style}</style>
    `;
    document.documentElement.appendChild(style_cache);

    style_cache.onload = () => {
        log('loaded cache', 'style');
        document.body.classList.add('bleh');

        chart_reflow();

        // now, analyse if we should fetch a new one
        log('checking timeout', 'style');
        check_if_style_cache_is_valid();
    }

    style_cache.onerror = () => {
        log('error loading cache', 'style', 'error');
        fetch_new_style();
    }
}

function check_if_style_cache_is_valid() {
    let cached_style_timeout = new Date(localStorage.getItem('bleh_cached_style_timeout'));
    let current_time = new Date();

    // check if timeout has expired
    if (cached_style_timeout < current_time) {
        log('fetching new, expired timeout', 'style');
        fetch_new_style();
    } else {
        log(`timeout valid until ${cached_style_timeout}`, 'style');
    }
}


function fetch_new_style(delete_old_style = false, reload_on_finish = false) {
    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/bleh/fm/bleh.css?${Math.random()}`;
    log(`making request ${url}`, 'style');
    xhr.open('GET', url, true);

    xhr.onload = function () {
        log(`style responded ${xhr.status}`, 'style');

        // create style element
        let style = html.node`
            <style>${this.response}</style>
        `;
        document.documentElement.appendChild(style);

        style.onload = () => {
            log('loaded', 'style');
            document.body.classList.add('bleh');

            chart_reflow();
        }

        style.onerror = () => {
            log('error loading', 'style', 'error');
        }

        // remove the old style, if needed
        if (delete_old_style)
            document.documentElement.removeChild(document.getElementById('bleh--cached-style'));

        // save to cache for next page load
        localStorage.setItem('bleh_cached_style', this.response);

        // set expire date
        let api_expire = new Date();
        api_expire.setHours(api_expire.getHours() + 1);
        localStorage.setItem('bleh_cached_style_timeout', api_expire);
        log(`cached until ${api_expire}`, 'style');

        if (reload_on_finish) invoke_reload();
    }

    xhr.send();
}

export function prompt_for_update() {
    // prompt the user
    dialog({
        id: 'bleh_update',
        title: tl(trans.update_to_version).replace('{v}', theme_version.state),
        body: html.node`
            <div class="forms">
                <div class="form">
                    <div class="form-group proceed">
                        <button class="btn primary icon" data-type="update" onclick=${() => start_update()}>${tl(trans.update_now)}</button>
                    </div>
                </div>
                <div class="form">
                    <div class="form-group deny">
                        <button class="btn icon" data-type="ignore" onclick=${() => ignore_update()}>${tl(trans.ignore_for_now)}</button>
                    </div>
                </div>
            </div>
        `,
        dismiss: false,
        type: 'update',
        replace_if_possible: true
    });
}

function ignore_update() {
    dialog_rm({
        id: 'bleh_update'
    });

    // set expire date
    let api_expire = new Date();
    api_expire.setHours(api_expire.getHours() + 1);
    localStorage.setItem('bleh_cached_style_timeout', api_expire);
    log(`cached until ${api_expire}`, 'style');
}

function start_update() {
    open(`https://github.com/katelyynn/bleh/raw/${settings.branch}/fm/bleh.user.js`);

    if (!settings.dev) {
        final_update();
    } else {
        dialog({
            id: 'bleh_update',
            title: tl(trans.update_to_version).replace('{v}', theme_version.state),
            body: html.node`
                <div class="forms">
                    <div class="form">
                        <div class="form-group proceed">
                            <button class="btn primary icon" data-type="update" onclick=${() => start_css_update()}>${tl(trans.update_styles)}</button>
                        </div>
                    </div>
                </div>
                <div class="sep" />
                <p class="subtle">${tl(trans.you_have_theme_loading_disabled)}</p>
            `,
            dismiss: false,
            type: 'update',
            replace_if_possible: true
        });
    }
}

function start_css_update() {
    if (settings.branch == '')
        save_setting('branch', 'uwu');

    open(`https://github.com/katelyynn/bleh/raw/${settings.branch}/fm/bleh.user.css`);

    final_update();
}

function final_update() {
    dialog({
        id: 'bleh_update',
        title: tl(trans.update_to_version).replace('{v}', theme_version.state),
        body: html.node`
            <div class="forms">
                <div class="form">
                    <div class="form-group proceed">
                        <button class="btn primary icon" data-type="finish" onclick=${() => finish_update()}>${tl(trans.finish)}</button>
                    </div>
                </div>
            </div>
        `,
        dismiss: false,
        type: 'update',
        replace_if_possible: true
    });
}

function finish_update() {
    if (!settings.dev) {
        dialog({
            id: 'bleh_wait',
            title: tl(trans.update_to_version).replace('{v}', theme_version.state),
            body: html.node`
                <div class="loading-data-container">
                    <div class="loading-data-text">${tl(trans.downloading_styles)}</div>
                </div>
            `,
            type: 'wait',
            dismiss: false,
            replace_if_possible: true
        });
        fetch_new_style(false, true);
    } else {
        // dev
        invoke_reload();
    }
}


unsafeWindow._force_refresh_theme = function() {
    localStorage.removeItem('bleh_cached_style');
    localStorage.removeItem('bleh_cached_style_timeout');

    window.setTimeout(invoke_reload, 400);
}
