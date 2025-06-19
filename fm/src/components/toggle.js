import {html} from "lighterhtml";

export function toggle({
    value = false,
    type = 'toggle',
    name = '',
    title = '',
    body = ''
}) {
    let checkbox;
    let state;

    return html.node`
        <div class="setting" data-type="${type}" onclick=${() => {
            let current = checkbox.checked;
    
            checkbox.checked = !current;
            state.setAttribute('aria-checked', !current);
        }}>
            <div class="heading">
                <h5>${title}</h5>
                ${(body != '') ? html.node`<p>${body}</p>` : ''}
            </div>
            ${type == 'toggle' ? html.node`
            <div class="toggle-wrap">
                <input type="checkbox" ref=${el => checkbox = el} name=${name} checked=${value} />
                <button class="toggle" ref=${el => state = el} aria-checked=${value}>
                    <div class="dot" />
                </button>
            </div>
            ` : html.node`
            <div class="check">
                <input type="checkbox" ref=${el => checkbox = el} name=${name} checked=${value} />
                <div class="box" ref=${el => state = el} aria-checked=${value}>
                    <div class="bleh-icon" />
                </div>
            </div>
            `}
        </div>
    `;
}
