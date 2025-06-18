import {html} from "lighterhtml";
import {tl, trans} from "../build/trans.js";
import {log} from "../build/log.js";

export function input({
    type = 'text',
    value,
    placeholder,
    min,
    max,
    maxlength,
    warn_if_empty = false,
    focus = false
}) {
    let input_box;
    let error_tooltip;

    let container = html.node`
        <div class="content-form input-container colourful" data-has-error="false">
            <input class="modern-input" autofocus=${focus} type=${type} value=${value} placeholder=${placeholder} min=${min} max=${max} maxlength=${maxlength} ref=${el => input_box = el} />
        </div>
    `;

    error_tooltip = tippy(input_box, {
        theme: 'error',
        placement: 'top',
        trigger: 'manual'
    });
    error_tooltip.disable();

    input_box.addEventListener('input', () => {
        container.setAttribute('data-has-error', 'false');
        error_tooltip.disable();

        if (type == 'number') {
            // is a number?
            if (input_box.value == '') {
                error_input(tl(trans.only_numbers_are_allowed), container, error_tooltip);
            } else if (parseInt(input_box.value) > max || parseInt(input_box.value) < min) {
                error_input(tl(trans.keep_within_the_range), container, error_tooltip);
            }
        }
    });

    return container;
}

function error_input(reason, input, tooltip) {
    log(reason, 'input', 'log');
    input.setAttribute('data-has-error', 'true');
    tooltip.setContent(reason);
    tooltip.enable();
    tooltip.show();
}
