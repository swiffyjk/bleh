import {dialog} from "./dialog.js";
import {tl, trans} from "../build/trans.js";
import {html} from "lighterhtml";
import {select} from "./select.js";
import {setting} from "./settings.js";
import {input} from "./input.js";
import {page} from "../build/page.js";
import {notify} from "./notify.js";

export function collage() {
    let width;
    let height;

    let timeframe;
    let type;

    let settings_btn;
    let submit;
    let body;

    let value = 5;
    let min = 2;
    let max = 10;

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
                    ${type = select([
                        {
                            value: 'artists',
                            text: tl(trans.artists),
                        },
                        {
                            value: 'albums',
                            text: tl(trans.albums),
                        },
                        {
                            value: 'tracks',
                            text: tl(trans.tracks),
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
                        }
                    ], 'LAST_90_DAYS')}
                    <button class="btn chibi icon" data-type="settings" ref=${el => settings_btn = el}>${tl(trans.settings)}</button>
                    <button class="btn primary icon" data-type="collage" ref=${el => submit = el} onclick=${() => make_collage()}>${tl(trans.generate)}</button>
                </div>
            </div>
            <div class="compare-body" data-filled="false">
                <div class="loading-data-container">
                    <div class="loading-data-text info">${tl(trans.choose_a_timeframe_above)}</div>
                </div>
            </div>
        `
    });

    let width_input = width.querySelector('input');
    let height_input = height.querySelector('input');

    tippy(settings_btn, {
        content: tl(trans.settings)
    });
    tippy(settings_btn, {
        theme: 'window',
        content: html.node`
            <div class="dialog-settings">
                ${setting({id: 'collage_title'})}
                ${setting({id: 'collage_grid_text'})}
                ${setting({id: 'collage_grid_plays'})}
                ${setting({id: 'collage_branding'})}
            </div>
        `,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',
    });

    function make_collage() {
        if (
            width_input.value == '' || height_input.value == '' ||
            width_input.value < min || width_input.value > max ||
            height_input.value < min || height_input.value > max
        ) {
            notify({
                id: 'collage_failed',
                title: tl(trans.name_failed).replace('{name}', tl(trans.collage)),
                body: tl(trans.your_settings_are_invalid),
                type: 'error'
            });
            return;
        }
    }
}
