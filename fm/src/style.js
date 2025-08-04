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
import {version} from "./main";
import {download_with_progress} from "./build/tools.js";
import cropper_css from 'cropperjs/dist/cropper.min.css';

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
    document.documentElement.appendChild(html.node`<style>${cropper_css}</style>`);

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


function fetch_new_style(delete_old_style = false, reload_on_finish = false, allow_incompatible = false) {
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
            let theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', '');

            if (!allow_incompatible && theme_version != version.build) {
                log('denied loading, incompatible version', 'style', 'info', {theme: theme_version, script: version.build});
                document.documentElement.removeChild(style);
                return;
            }

            // remove the old style, if needed
            if (delete_old_style)
                document.documentElement.removeChild(document.getElementById('bleh--cached-style'));

            log('loaded', 'style');
            document.body.classList.add('bleh');

            chart_reflow();

            if (reload_on_finish) invoke_reload();
        }

        style.onerror = () => {
            log('error loading', 'style', 'error');
        }

        // save to cache for next page load
        localStorage.setItem('bleh_cached_style', this.response);

        // set expire date
        let api_expire = new Date();
        api_expire.setHours(api_expire.getHours() + 1);
        localStorage.setItem('bleh_cached_style_timeout', api_expire);
        log(`cached until ${api_expire}`, 'style');
    }

    xhr.send();
}

function parse_version(v) {
    const parts = v.split('.').map(Number);

    // ensure [major, minor, patch]
    while (parts.length < 3) parts.push(0);
    return parts.slice(0, 3);
}

function compare_versions(a, b) {
    const [a_maj, a_min, a_patch] = parse_version(a);
    const [b_maj, b_min, b_patch] = parse_version(b);

    if (a_maj !== b_maj) return a_maj > b_maj ? 1 : -1;
    if (a_min !== b_min) return a_min > b_min ? 1 : -1;
    if (a_patch !== b_patch) return a_patch > b_patch ? 1 : -1;

    return 0;
}

export function update_comparison(current, latest) {
    return compare_versions(latest, current) === 1;
}

export function update_check(force = false, btn = null, func = null) {
    if (!force) {
        const last_checked = localStorage.getItem('bleh_update_checked') || null;
        const next_check = localStorage.getItem('bleh_update_next_check') || null;
        const current_time = new Date();

        if (last_checked && next_check && new Date(next_check) > current_time) {
            log('update check skipped', 'update', 'info', {next_in: next_check, current_time: current_time});
            if (func) func();

            return;
        }
    }

    if (btn) btn.setAttribute('disabled', '');

    let url = `https://katelyynn.github.io/bleh/fm/src/build/build.json?${Date.now()}`;

    /*let notification = notify({
        id: 'updater',
        title: 'Updater',
        body: 'Downloading update information',
        progress: true,
        icon: 'icon-16-update'
    });*/

    download_with_progress(url, (percent) => {
        //notification.set_body(`Downloading update information ${percent}%`);
        //notification.set(percent);
    }).then(async (blob) => {
        const text = await blob.text();

        if (btn) btn.removeAttribute('disabled');

        try {
            let data = JSON.parse(text);
            console.log(data);

            let update_required = update_comparison(version.build, data.build);
            localStorage.setItem('bleh_update_required', update_required.toString());
            localStorage.setItem('bleh_update_to', data.build);
            localStorage.setItem('bleh_update_checked', new Date().toString());

            let next = new Date();
            next.setHours(next.getHours() + 2);

            localStorage.setItem('bleh_update_next_check', next.toString());
            log('update check finished', 'update', 'info', {next_in: next, current_time: new Date()});

            if (func) func();
        } catch (e) {
            log('error parsing', 'update', 'error', {error: e});
        }
    });
}

export function prompt_for_update() {
    // prompt the user
    dialog({
        id: 'bleh_update',
        title: tl(trans.update_to_version).replace('{v}', localStorage.getItem('bleh_update_to') || 'unknown'),
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
}

export function start_update() {
    open(`https://github.com/katelyynn/bleh/raw/uwu/fm/bleh.user.js`);

    dialog({
        id: 'bleh_update',
        title: tl(trans.update_to_version).replace('{v}', localStorage.getItem('bleh_update_to') || 'unknown'),
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
    dialog({
        id: 'bleh_wait',
        title: tl(trans.update_to_version).replace('{v}', localStorage.getItem('bleh_update_to') || 'unknown'),
        body: html.node`
            <div class="loading-data-container">
                <div class="loading-data-text">${tl(trans.downloading_styles)}</div>
            </div>
        `,
        type: 'wait',
        dismiss: false,
        replace_if_possible: true
    });

    // reset update status
    localStorage.setItem('bleh_update_required', 'false');
    localStorage.setItem('bleh_update_checked', new Date().toString());

    fetch_new_style(false, true, true);
}


unsafeWindow._force_refresh_theme = function() {
    localStorage.removeItem('bleh_cached_style');
    localStorage.removeItem('bleh_cached_style_timeout');

    window.setTimeout(invoke_reload, 400);
}
