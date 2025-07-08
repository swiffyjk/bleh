import {html, render} from "lighterhtml";
import {tl, trans} from "../build/trans.js";
import {log} from "../build/log.js";

class bleh_input extends HTMLElement {
    static get observedAttributes() {
        // attributes to observe and reflect into this._props
        return [
            'type', 'value', 'placeholder', 'min', 'max',
            'maxlength', 'warn-if-empty', 'disabled', 'focus'
        ];
    }

    constructor() {
        super(); // must call super() before using `this`
        this._props = {}; // storage for all prop values
        this.attachShadow({mode: 'open'}); // create shadow root
        this._render(); // initial render of template
    }

    attributeChangedCallback(name, old_val, new_val) {
        const key = this._to_snake(name);

        const bools = ['warn_if_empty', 'disabled', 'focus'];
        if (bools.includes(key))
            this._props[key] = new_val !== null;
        else
            this._props[key] = new_val;

        this._render();
    }

    connectedCallback() {
        this._init_tooltip();
        if (this._props.focus) this._input.focus();
    }

    _init_tooltip() {
        this._error_tooltip = tippy(this._input, {
            theme:     'error',
            placement: 'top',
            trigger:   'manual'
        });
        this._error_tooltip.disable();
    }

    _render() {
        render(this.shadowRoot, html`
            <div class="content-form input-container colourful" data-type=${this._props.type} data-has-error="false">
                ${this._props.type == 'colour' ? html.node`<span class="colour-block" ref=${el => this._colour_block = el} />` : ''}
                <input
                    class="modern-input ${this._props.hasError ? 'error' : ''}"
                    type=${this._props.type || 'text'}
                    value=${this._props.value || ''}
                    placeholder=${this._props.placeholder || ''}
                    min=${this._props.min || null}
                    max=${this._props.max || null}
                    maxlength=${this._props.maxlength || null}
                    ?disabled=${this._props.disabled || false}
                    ref=${el => (this._input = el)}
                />
            </div>
        `,);

        if (!this._bound) {
            this._input.addEventListener('input', () => this._update());
            this._bound = true;
        }
    }

    _update() {
        this._props.hasError = false;
        this._error_tooltip.disable();

        const value = this._input.value;
        const type  = this._props.type;

        if (type !== 'number') {
            if (!value && this._props.warn_if_empty) {
                this._error(tl(trans.this_field_is_required));
            } else if (value.length > (this._props.maxlength || Infinity)) {
                this._error(tl(trans.keep_within_the_range));
            }
        } else {
            const num = parseInt(value, 10);
            if (!value || isNaN(num)) {
                this._error(tl(trans.only_numbers_are_allowed));
            } else if (num > this._props.max || num < this._props.min) {
                this._error(tl(trans.keep_within_the_range));
            }
        }

        if (type === 'colour') {
            if (!value.startsWith('#')) this._input.value = `#${value}`;
            this._colour_block.style.backgroundColor = this._input.value;
        }
    }

    _error(reason) {
        log(reason, 'input', 'log');
        this._props.hasError = true;
        this._error_tooltip.setContent(reason);
        this._error_tooltip.enable();
        this._error_tooltip.show();
    }

    get value() {
        return this._input.value;
    }
    set value(v) {
        this._input.value = v;
        this._update();
    }

    get disabled() {
        return this._props.disabled;
    }
    set disabled(v) {
        if (v) this.setAttribute('disabled', '');
        else   this.removeAttribute('disabled');
    }

    _to_snake(str) {
        return str.replace(/-/g, '_');
    }
}

// register the element so you can use <custom-input> in your HTML
customElements.define('bleh-input', bleh_input);

export function input({
    type = 'text',
    value,
    placeholder,
    min,
    max,
    maxlength,
    warn_if_empty = false,
    focus = false,
    disabled = false
}) {
    let input_box;
    let error_tooltip;

    let colour_block;

    let container = html.node`
        <div class="content-form input-container colourful" data-type=${type} data-has-error="false">
            ${type == 'colour' ? html.node`<span class="colour-block" ref=${el => colour_block = el} />` : ''}
            <input class="modern-input" disabled=${disabled} autofocus=${focus} type=${type} value=${value} placeholder=${placeholder} min=${min} max=${max} maxlength=${maxlength} ref=${el => input_box = el} />
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

    container.value = (val = null) => {
        if (val === null) return input_box.value;

        input_box.value = val;
        return val;
    }

    container.disabled = (state = null) => {
        if (state === null) return input_box.getAttribute('disabled') || false;

        if (state === true)
            input_box.setAttribute('disabled', 'true');
        else
            input_box.removeAttribute('disabled');

        return state;
    }

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
