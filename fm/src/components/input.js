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
    focus = false,
    disabled,
    show_time = true,
    name
}) {
    if (type == 'date') {
        let now = new Date();
        if (value != null) now = new Date(value);

        const min_date = min != null
            ? new Date(min)
            : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        min_date.setHours(0, 0, 0, 0);

        const max_date = max != null
            ? new Date(max)
            : new Date();
        max_date.setHours(23, 59, 59, 999);

        let last_action;
        const state = {
            year:  now.getFullYear(),
            month: now.getMonth() + 1,
            day:   now.getDate(),
            hours: now.getHours(),
            mins:  now.getMinutes(),
            secs:  now.getSeconds()
        };
        let view = {
            year:  state.year,
            month: state.month
        };

        let legacy_date;
        let date_display;
        let time_input;
        let popup_inner = html.node`<div class="calendar" />`;

        const locale = undefined;
        const months = Array.from({length: 12}, (_, i) =>
            new Intl.DateTimeFormat(locale, {month: 'short'})
                .format(new Date(2000, i, 1))
            );
        const raw_weekdays = Array.from({length: 7}, (_, i) =>
            new Intl.DateTimeFormat(locale, {weekday: 'short'})
                .format(new Date(1970, 0, 4 + i))
            );
        const weekdays = raw_weekdays
            .slice(1)
            .concat(raw_weekdays[0]);

        const container = html.node`
            <div class="input-group">
                <div class="content-form input-container" data-type="date">
                    <input class="legacy-input" type="date" ref=${el => legacy_date = el} name=${name} value="${state.year}-${pad2(state.month)}-${pad2(state.day)}">
                    <div class="date-input modern-input" ref=${el => date_display = el} disabled=${disabled}>${format_date(state)}</div>
                </div>
                ${show_time ? html.node`
                <div class="content-form input-container" data-type="time">
                    <input class="modern-input" type="time" step="1" ref=${el => time_input = el} disabled=${disabled} value="${pad2(state.hours)}:${pad2(state.mins)}:${pad2(state.secs)}">
                </div>
                ` : ''}
            </div>
        `;

        if (time_input) {
            time_input.addEventListener('input', () => {
                const parts = time_input.value.split(':')
                    .map(n => parseInt(n, 10));
                state.hours = parts[0] || 0;
                state.mins = parts[1] || 0;
                state.secs = parts[2] || 0;
                emit();
            });
        }

        function can_prev() {
            const py = view.month === 1 ? view.year - 1 : view.year;
            const pm = view.month === 1 ? 12 : view.month - 1;
            return (
                py > min_date.getFullYear() ||
                (py === min_date.getFullYear() &&
                pm >= min_date.getMonth() + 1)
            );
        }

        function can_next() {
            const ny = view.month === 12 ? view.year + 1 : view.year;
            const nm = view.month === 12 ? 1 : view.month + 1;
            return (
                ny < max_date.getFullYear() ||
                (ny === max_date.getFullYear() &&
                nm <= max_date.getMonth() + 1)
            );
        }

        let tooltip = tippy(date_display, {
            theme: 'window',
            content: '',
            placement: 'bottom',
            interactive: true,
            interactiveBorder: 10,
            trigger: 'click',

            onShow() {
                last_action = '';
                render_popup();
            }
        });

        function render_popup() {
            tooltip.setContent(html.node`
                <div class="calendar">
                    <div class="calendar-header">
                        <button class="month-year" type="button">
                            ${months[view.month - 1]} ${view.year}
                        </button>
                        <div class="fill" />
                        <button class="chibi icon" data-type="up" disabled=${!can_prev()} type="button" onclick=${() => {
                            if (!can_prev()) return;

                            view.month--;

                            if (view.month < 1) {
                                view.month = 12;
                                view.year--;
                            }

                            last_action = 'prev';
                            render_popup();
                        }}>
                            ${tl(trans.back)}
                        </button>
                        <button class="chibi icon" data-type="down" disabled=${!can_next()} type="button" onclick=${() => {
                            if (!can_next()) return;

                            view.month++;

                            if (view.month > 12) {
                                view.month = 1;
                                view.year++;
                            }

                            last_action = 'next';
                            render_popup();
                        }}>
                            ${tl(trans.next)}
                        </button>
                    </div>
                    <div class="date-header">
                        ${weekdays.map(day => html.node`<div class="date">${day}</div>`)}
                    </div>
                    <div class="days" data-last-action=${last_action}>
                        ${days(view.year, view.month).map(cell =>
                            cell.type == 'empty'
                                ? html.node`<button class="day empty" type="button" disabled />`
                                : html.node`
                                    <button class="day" type="button" aria-selected=${cell.day == state.day && cell.date > min_date && cell.date < max_date && cell.month == view.month ? 'true' : 'false'} disabled=${cell.date < min_date || cell.date > max_date} onclick=${() => {
                                        state.day = cell.day;
                                        state.year = view.year;
                                        state.month = view.month;
                                        update_display();
                                        emit();
                                        last_action = '';
                                        render_popup();
                                    }}>${cell.day}</button>
                                `
                        )}
                    </div>
                </div>
            `);
        }

        function days(year, month) {
            const raw_first = new Date(
                year,
                month - 1,
                1
            ).getDay();
            const offset = (raw_first + 6) % 7; // monday comes first
            const days_in_month = new Date(
                year,
                month,
                0
            ).getDate();

            const cells = [];
            for (let i = 0; i < offset; i++) cells.push({type: 'empty'});
            for (let day = 1; day <= days_in_month; day++) {
                cells.push({
                    type: 'day',
                    day,
                    month: state.month,
                    date: new Date(
                        year,
                        month - 1,
                        day
                    )
                });
            }

            const rem = (7 - (cells.length % 7)) % 7;
            for (let i = 0; i < rem; i++) cells.push({type: 'empty'});
            console.info('cells', cells, state.month, view.month);

            return cells;
        }

        function update_display() {
            date_display.textContent = format_date(state);
        }

        function emit() {
            const date_object = new Date(
                state.year,
                state.month - 1,
                state.day,
                state.hours,
                state.mins,
                state.secs
            );
            legacy_date.value = `${state.year}-${pad2(state.month)}-${pad2(state.day)}`;
            container.dispatchEvent(new CustomEvent('change'), {detail: date_object});
        }

        function pad2(num) {
            return String(num).padStart(2, '0');
        }

        function format_date({year, month, day}) {
            const date_object = new Date(
                year,
                month - 1,
                day
            );
            return date_object.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        container.value = (val = null) => {
            if (val === null) {
                return new Date(
                    state.year,
                    state.month - 1,
                    state.day,
                    state.hours,
                    state.mins,
                    state.secs
                );
            }

            const date_object = new Date(val);
            state.year = date_object.getFullYear();
            state.month = date_object.getMonth() + 1;
            state.day = date_object.getDate();
            state.hours = date_object.getHours();
            state.mins = date_object.getMinutes();
            state.secs = date_object.getSeconds();

            view.year = state.year;
            view.month = state.month;

            render_popup();
            update_display();

            if (time_input) time_input.value = `${pad2(state.hours)}:${pad2(state.mins)}:${pad2(state.secs)}`;
            return date_object;
        };

        container.disabled = (val = null) => {
            if (val === null) return time_input.disabled;

            if (!val)
                date_display.removeAttribute('disabled');
            else
                date_display.setAttribute('disabled', 'true');

            if (time_input) time_input.disabled = val;
            return val;
        };

        return container;
    }

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
