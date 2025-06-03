import {html} from "lighterhtml";
import {settings, settings_store} from "../build/config.js";

export function setting(
    {
        id,
        title,
        body
    }
) {
    let value = settings[id];

    let type = settings_store[id].type || 'toggle';

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
    }
}

function update_toggle(id, toggle) {
    let value = settings[id];

    settings[id] = !value;
    toggle.setAttribute('aria-checked', !value);

    localStorage.setItem('bleh', JSON.stringify(settings));
}
