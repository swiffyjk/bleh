import { settings } from "./build/config";
import { log } from "./build/log";
import { page } from "./build/page";
import { trans } from "./build/trans";
import { load_chart_colours } from "./chart";
import { dialog, dialog_rm } from "./components/dialog";
import { bleh_music_page_charts } from "./components/music";
import { create_settings_template, invoke_reload } from "./config";
import { version } from "./main";
import { bleh_glacier_date_graph_generate, bleh_glacier_insights } from "./pages/glacier";

export function append_style() {
    document.documentElement.classList.add('bleh-supports-loading');
    for (var member in settings) delete settings[member];
    Object.assign(settings, JSON.parse(localStorage.getItem('bleh')) || create_settings_template());
    let cached_style = localStorage.getItem('bleh_cached_style') || '';

    let url = window.location.href;
    let url_split = url.split('/');
    let url_length = url_split.length - 1;

    // style is neither fetched or applied in these interfaces
    if (url_split[url_length] == 'playback' || url_split[url_length - 1] == 'labs')
        return;

    document.documentElement.setAttribute('data-bleh--theme', settings.theme);

    // while the style is not to be applied in dev mode,
    // we now fetch it to retrieve current version info
    if (settings.dev) {
        log('dev mode is on, will fetch for version only', 'style');
        check_style_info();

        return;
    }

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
    let style_cache = document.createElement('style');
    style_cache.setAttribute('id', 'bleh--cached-style');
    style_cache.textContent = cached_style;
    document.documentElement.appendChild(style_cache);

    log('loaded cache', 'style');
    setTimeout(function() {
        document.body.classList.add('bleh');
        theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', ''); // remove quotations
        log(`theme version reporting as ${theme_version}`, 'style');

        load_chart_colours();

        // trigger re-flow of chart
        if ((page.type == 'artist' || page.type == 'album' || page.type == 'track') && page.subpage == 'overview')
            bleh_music_page_charts();

        if (page.type == 'user' && page.subpage.startsWith('library')) {
            bleh_glacier_date_graph_generate();
            bleh_glacier_insights();
        }

        // now, analyse if we should fetch a new one
        log('checking timeout', 'style');
        check_if_style_cache_is_valid();
    }, 200);
}

function check_if_style_cache_is_valid() {
    let cached_style_timeout = new Date(localStorage.getItem('bleh_cached_style_timeout'));
    let current_time = new Date();

    // check if timeout has expired
    if (cached_style_timeout < current_time) {
        // in versions 2024.1019 and onwards, the css stores version itself
        // we can use this to compare if we should fetch a new one
        // as we don't want to fetch a new css while the js is out of date
        if (theme_version != version.build && theme_version != '') {
            // script is either out of date, or more in date (not gonna happen)
            log(`version mismatch! running ${version.build}, downloaded theme ${theme_version}`, 'update');

            prompt_for_update();
            return;
        }

        log('fetching new, expired timeout', 'style');
        fetch_new_style();
    } else {
        log(`timeout valid until ${cached_style_timeout}`, 'style');
    }
}

function check_style_info() {
    let cached_style_timeout = new Date(localStorage.getItem('bleh_cached_style_timeout'));
    let current_time = new Date();

    // check if timeout has expired
    if (cached_style_timeout < current_time) {
        fetch_style_info();
    }
}

unsafeWindow._prompt_for_update = function() {
    prompt_for_update();
}
export function prompt_for_update() {
    // prompt the user
    dialog({
        id: 'bleh_update',
        title: trans[lang].settings.home.update.update_to_v.replace('{v}', theme_version),
        body: (`
            <div class="bleh--update-checker-container">
                <div class="form">
                    <div class="form-group">
                        <button class="big-btn ignore" onclick="_ignore_update()"></button>
                        ${trans[lang].settings.home.update.ignore}
                        <div class="small-alert red">${version.build}</div>
                    </div>
                </div>
                <div class="form">
                    <div class="form-group">
                        <button class="big-btn primary update" onclick="_start_update()"></button>
                        ${trans[lang].settings.home.update.update_now}
                        <div class="small-alert green">${theme_version}</div>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'update',
        replace_id: 'bleh_update',
        replace: true
    });
}

unsafeWindow._ignore_update = function() {
    dialog_rm({
        id: 'bleh_update'
    });

    // set expire date
    let api_expire = new Date();
    api_expire.setHours(api_expire.getHours() + 1);
    localStorage.setItem('bleh_cached_style_timeout',api_expire);
    log(`cached until ${api_expire}`, 'style');
}

unsafeWindow._start_update = function() {
    open('https://github.com/katelyynn/bleh/raw/uwu/fm/bleh.user.js');

    dialog_rm({
        id: 'bleh_update'
    });

    if (!settings.dev) {
        _final_update();
    } else {
        dialog({
            id: 'bleh_update',
            title: trans[lang].settings.home.update.update_to_v.replace('{v}', theme_version),
            body: (`
                <div class="bleh--update-checker-container">
                    <div class="form">
                        <div class="form-group">
                            <button class="big-btn primary update" onclick="_start_css_update()"></button>
                            ${trans[lang].settings.home.update.css}
                            <div class="small-alert green">${theme_version}</div>
                        </div>
                    </div>
                </div>
            `),
            dismiss: false,
            type: 'update'
        });
    }
}

unsafeWindow._start_css_update = function() {
    open('https://github.com/katelyynn/bleh/raw/uwu/fm/bleh.user.css');

    dialog_rm({
        id: 'bleh_update'
    });
    _final_update();
}

unsafeWindow._final_update = function() {
    dialog({
        id: 'bleh_update',
        title: trans[lang].settings.home.update.update_to_v.replace('{v}', theme_version),
        body: (`
            <div class="bleh--update-checker-container">
                <div class="form">
                    <div class="form-group">
                        <button class="big-btn primary finish" onclick="_finish_update()"></button>
                        ${trans[lang].settings.finish}
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'update'
    });
}

unsafeWindow._finish_update = function() {
    dialog_rm({
        id: 'bleh_update'
    });

    if (!settings.dev) {
        dialog({
            id: 'bleh_wait',
            title: trans[lang].settings.home.update.name,
            type: 'wait',
            dismiss: false
        });
        fetch_new_style(false, true);
    } else {
        // dev
        invoke_reload();
    }
}

function fetch_new_style(delete_old_style = false, reload_on_finish = false) {
    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/bleh/fm/bleh.css?${Math.random()}`;
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`style responded ${xhr.status}`, 'style');

        // create style element
        let style = document.createElement('style');
        style.textContent = this.response;
        document.documentElement.appendChild(style);

        // remove the old style, if needed
        if (delete_old_style)
            document.documentElement.removeChild(document.getElementById('bleh--cached-style'));

        // save to cache for next page load
        localStorage.setItem('bleh_cached_style',this.response);

        // set expire date
        let api_expire = new Date();
        api_expire.setHours(api_expire.getHours() + 1);
        localStorage.setItem('bleh_cached_style_timeout',api_expire);
        log(`cached until ${api_expire}`, 'style');

        if (reload_on_finish)
            invoke_reload();

        setTimeout(function() {
            document.body.classList.add('bleh');
            theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', ''); // remove quotations

            load_chart_colours();

            // trigger re-flow of chart
            if ((page.type == 'artist' || page.type == 'album' || page.type == 'track') && page.subpage == 'overview')
                bleh_music_page_charts();

            if (page.type == 'user' && page.subpage.startsWith('library')) {
                bleh_glacier_date_graph_generate();
                bleh_glacier_insights();
            }

            // in versions 2024.1019 and onwards, the css stores version itself
            // we can use this to compare if we should fetch a new one
            // as we don't want to fetch a new css while the js is out of date
            if (theme_version != version.build && theme_version != '') {
                // script is either out of date, or more in date (not gonna happen)
                log(`version mismatch! running ${version.build}, downloaded theme ${theme_version}`, 'update');

                prompt_for_update();
                return;
            }
        }, 200);
    }

    xhr.send();
}

function fetch_style_info(delete_old_style = false, reload_on_finish = false) {
    let xhr = new XMLHttpRequest();
    let url = 'https://katelyynn.github.io/bleh/fm/bleh.css';
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`style responded ${xhr.status}`, 'style');

        // create style element
        let style = document.createElement('style');
        style.textContent = this.response;
        document.documentElement.appendChild(style);

        // save to cache for next page load
        localStorage.setItem('bleh_cached_style',this.response);

        // set expire date
        let api_expire = new Date();
        api_expire.setHours(api_expire.getHours() + 1);
        localStorage.setItem('bleh_cached_style_timeout',api_expire);
        log(`cached until ${api_expire}`, 'style');

        // we will temporarily apply the style just for theme info, then remove it
        setTimeout(function() {
            theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', ''); // remove quotations

            document.documentElement.removeChild(style);

            // in versions 2024.1019 and onwards, the css stores version itself
            // we can use this to compare if we should fetch a new one
            // as we don't want to fetch a new css while the js is out of date
            if (theme_version != version.build && theme_version != '') {
                // script is either out of date, or more in date (not gonna happen)
                log(`version mismatch! running ${version.build}, downloaded theme ${theme_version}`, 'update');

                prompt_for_update();
                return;
            }
        }, 200);
    }

    xhr.send();
}


unsafeWindow._force_refresh_theme = function() {
    localStorage.removeItem('bleh_cached_style');
    localStorage.removeItem('bleh_cached_style_timeout');

    window.setTimeout(invoke_reload, 400);
}