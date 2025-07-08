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

    let colour_block;

    let container = html.node`
        <div class="content-form input-container colourful" data-type=${type} data-has-error="false">
            ${type == 'colour' ? html.node`<span class="colour-block" ref=${el => colour_block = el} />` : ''}
            <input class="modern-input" autofocus=${focus} type=${type} value=${value} placeholder=${placeholder} min=${min} max=${max} maxlength=${maxlength} ref=${el => input_box = el} />
        </div>
    `;

    error_tooltip = tippy(input_box, {
        theme: 'error',
        placement: 'top',
        trigger: 'manual'
    });
    error_tooltip.disable();

    update_input(true);
    input_box.addEventListener('input', () => {
        update_input();
    });

    return container;

    function update_input(skip_most = false) {
        container.setAttribute('data-has-error', 'false');
        error_tooltip.disable();

        if (type != 'number' && !skip_most) {
            if (input_box.value == '' && warn_if_empty) {
                error_input(tl(trans.this_field_is_required));
            } else if (input_box.value.length > maxlength) {
                error_input(tl(trans.keep_within_the_range));
            }
        }

        if (type == 'number' && !skip_most) {
            // is a number?
            if (input_box.value == '') {
                error_input(tl(trans.only_numbers_are_allowed));
            } else if (parseInt(input_box.value) > max || parseInt(input_box.value) < min) {
                error_input(tl(trans.keep_within_the_range));
            }
        } else if (type == 'colour') {
            if (!input_box.value.startsWith('#'))
                input_box.value = `#${input_box.value}`;

            colour_block.style.backgroundColor = input_box.value;
        }
    }

    function error_input(reason) {
        log(reason, 'input', 'log');
        container.setAttribute('data-has-error', 'true');
        error_tooltip.setContent(reason);
        error_tooltip.enable();
        error_tooltip.show();
    }
}
