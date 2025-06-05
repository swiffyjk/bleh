import {dialog} from "./dialog.js";
import {tl, trans} from "../build/trans.js";
import {html} from "lighterhtml";
import {select} from "./select.js";
import {setting} from "./settings.js";

export function chart_window() {
    let timeframe;
    let type;

    let settings_btn;

    dialog({
        id: 'chart_creator',
        title: tl(trans.charts),
        body: html.node`
            <div class="compare-header">
                <div class="compare-selection">
                    <input type="number" value="5" />
                    x
                    <input type="number" value="5" />
                    ${select([
                        {
                            value: 'albums',
                            text: tl(trans.albums),
                        },
                        {
                            value: 'tracks',
                            text: tl(trans.tracks),
                        }
                    ], type)}
                    ${select([
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
                    ], timeframe)}
                    <button class="btn chibi icon" data-type="settings" ref=${el => settings_btn = el}>${tl(trans.settings)}</button>
                </div>
            </div>
        `
    });

    tippy(settings_btn, {
        theme: 'window',
        content: html.node`
            <div class="dialog-settings">
                ${setting({id: ''})}
            </div>
        `,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',
    });
}
