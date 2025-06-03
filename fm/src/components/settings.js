//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html} from "lighterhtml";
import {settings, settings_store} from "../build/config.js";
import {tl, trans} from "../build/trans.js";
import {notify} from "./notify.js";
import {save_profile_shortcut} from "./profile_shortcut.js";

export function setting(id) {
    try {
        let value = settings[id];

        if (!settings_store[id])
            return setting_fail(id, {message: 'No settings store entry present'});

        let type = settings_store[id].type || 'toggle';
        let title = settings_store[id].title || id;
        let body = settings_store[id].body;

        if (type === 'toggle') {
            let toggle;

            return html.node`
                <div class="setting" data-type="toggle" onclick=${() => update_toggle(id, toggle)}>
                    <div class="heading">
                        <h5>${title} (v2)</h5>
                        ${(body) ? html.node`<p>${body}</p>` : ''}
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" ref=${el => toggle = el} aria-checked=${value}>
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'range') {
            let option;

            let min = settings_store[id].min || 0;
            let max = settings_store[id].max || 0;
            let step = settings_store[id].step || 0;

            if (min >= max || step === 0)
                return setting_fail(id, {message: 'A range type requires a min, max, and step defined in the settings store'});

            let track;
            let input;
            let marker;

            let working_max = settings_store[id].max - settings_store[id].min;

            return html.node`
                <div class="setting" data-type="range" ref=${el => option = el} data-modified=${value != settings_store[id].default}>
                    <button class="btn reset" onclick=${() => reset(id)}>${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${title} (v2)</h5>
                        ${(body) ? html.node`<p>${body}</p>` : ''}
                    </div>
                    <div class="range">
                        <div class="track" style="--percent: ${(value / working_max) * 100}%" ref=${el => track = el}>
                            <div class="fill" />
                            <div class="nub" />
                        </div>
                        <input type="range" min=${min} max=${max} step=${step} value=${value} ref=${el => input = el} oninput=${() => update_range(id, option, track, input.value, marker)} />
                        <p class="value-marker" ref=${el => marker = el}>${value}</p>
                    </div>
                </div>
            `;
        } else if (type === 'text') {
            let option;

            let max = settings_store[id].max || 0;

            if (max === 0)
                return setting_fail(id, {message: 'A text type requires a max defined in the settings store'});

            let reset_btn;
            let avatar;
            let input;
            let submit;

            let container = html.node`
                <div class="setting" data-type="text" ref=${el => option = el} data-modified=${value != settings_store[id].default}>
                    <button class="btn reset" ref=${el => reset_btn = el} onclick=${() => reset(id)}>${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${title} (v2)</h5>
                        ${(body) ? html.node`<p>${body}</p>` : ''}
                    </div>
                    ${(settings_store[id].avatar) ? html.node`
                    <div class="avatar-container">
                        <div class="avatar-inner" ref=${el => avatar = el}>
                            <img src=${localStorage.getItem(`bleh_${id}_avi`) || ''} alt=${value} />
                        </div>
                    </div>
                    ` : ''}
                    <div class="input-container content-form">
                        <input type="text" maxlength=${max} value=${value} style="--max: ${max}px" ref=${el => input = el} placeholder=${settings_store[id].placeholder} />
                        <button class="btn chibi icon primary submit" ref=${el => submit = el} onclick=${() => update_text(id, input, submit, option, reset_btn, avatar)}>${tl(trans.save)}</button>
                    </div>
                </div>
            `;

            input.addEventListener('keydown', (event) => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    submit.click();
                }
            });

            tippy(submit, {
                content: tl(trans.save)
            });

            return container;
        }
    } catch(e) {
        console.error(e);
        return setting_fail(id, e);
    }

    return setting_fail(id);
}

function setting_fail(id, e = null) {
    return html.node`
        <div class="alert alert-error">
            ${tl(trans.value_failed_to_load).replace('{v}', id)}
            ${(e) ? html`<br>${e.message}` : ''}
        </div>
    `;
}

function update_toggle(id, toggle) {
    let value = settings[id];

    toggle.setAttribute('aria-checked', !value);

    save_setting(id, value);
}
function update_range(id, option, track, value, marker) {
    let min = 0;
    let max = settings_store[id].max - settings_store[id].min;

    track.style.setProperty('--percent', `${(value / max) * 100}%`);
    marker.textContent = value;

    option.setAttribute('data-modified', value != settings_store[id].default);

    save_setting(id, value);
}

function update_text(id, input, submit, option, reset_btn, avatar) {
    let value = input.value;

    // wait on response to allow inputs
    if (settings_store[id].wait) {
        reset_btn.disabled = true;
        input.disabled = true;
        submit.disabled = true;
    }

    option.setAttribute('data-modified', value != settings_store[id].default);

    if (id === 'profile_shortcut') {
        save_profile_shortcut(input, submit, reset_btn, avatar);
        return;
    }

    save_setting(id, value);
    notify({
        id: 'saved_setting',
        title: 'Saved setting'
    });
}

export function save_setting(id, value) {
    settings[id] = value;
    document.documentElement.setAttribute(`data-bleh--${id}`, value);

    if (settings_store[id].css)
        document.body.style.setProperty(`--${settings_store[id].css}`, `${value}${settings_store[id].suffix || ''}`);

    localStorage.setItem('bleh', JSON.stringify(settings));
}

function reset(id) {
    notify({
        id: 'reset_setting',
        title: `Reset ${id} to default`
    });
}
