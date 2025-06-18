import {page} from "../build/page.js";
import {dialog, dialog_rm} from "./dialog.js";
import {html, render} from "lighterhtml";
import {input} from "./input.js";
import {tl, trans} from "../build/trans.js";
import {notify} from "./notify.js";

export function register_rabbit() {
    page.state.cmd = false;
    let input_box;
    let selected = 0;
    let feed = 0;
    let rabbit_hole;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = true;

        /*notify({
            id: 'key',
            title: e.key
        });*/
        if (page.state.cmd && (e.key == 'k' || e.key == 'K' || e.key == ',') && !page.structure.dialogs.hasChildNodes()) {
            e.preventDefault();

            // ctrl + k
            rabbit();
        } else if (page.structure.dialogs.hasChildNodes() && page.structure.dialogs.querySelector(':scope > [data-modal-type="rabbit"]')) {
            if (e.key == 'Escape')
                dialog_rm({id: 'rabbit'});

            if (e.key == 'Tab') {
                e.preventDefault();
                rabbit_tab();
            }

            if (e.key == 'ArrowDown') {
                e.preventDefault();
                if (selected < (feed.length - 1))
                    selected++;
                else
                    selected = 0;

                rabbit_select();
            } else if (e.key == 'ArrowUp') {
                e.preventDefault();
                if (selected > 0)
                    selected--;
                else
                    selected = (feed.length - 1);

                rabbit_select();
            } else if (e.key == 'Enter') {
                rabbit_enter();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = false;
    });

    function rabbit() {
        page.state.rabbit_modal = dialog({
            id: 'rabbit',
            title: 'rabbit',
            body: html.node`
                ${() => {
                    input_box = input({
                        maxlength: 100,
                        placeholder: tl(trans.anything_you_can_imagine),
                        focus: true
                    });
    
                    return input_box;
                }}
                <div class="rabbit-hole" ref=${el => rabbit_hole = el} />
            `,
            type: 'rabbit',
            replace_if_possible: true
        });

        rabbit_search();
        rabbit_select();

        input_box.querySelector('input').addEventListener('input', (e) => {
            rabbit_search();
        });

        input_box.querySelector('input').focus();
    }

    function rabbit_tab() {
        input_box.querySelector('input').focus();
    }

    function rabbit_search() {
        selected = 0;
        feed = [
            {
                type: 'rabbit',
                text: 'Rabbit',
                body: 'something something',
                keywords: ['bunny'],
                action: () => notify({id: 'rabbit', title: 'rabbit!'})
            },
            {
                type: 'tree',
                text: 'Tree',
                body: 'ermm',
                keywords: ['plant', 'nature'],
                action: () => notify({id: 'rabbit', title: 'rabbit!'})
            },
            {
                type: 'red',
                text: 'Red',
                body: 'Red',
                keywords: ['blood', 'colour', 'color'],
                action: () => notify({id: 'rabbit', title: 'rabbit!'})
            },
            {
                type: 'blue',
                text: 'Blue',
                body: 'Blue',
                keywords: ['sky', 'water', 'colour', 'color'],
                action: () => notify({id: 'rabbit', title: 'rabbit!'})
            }
        ];

        let value = input_box.querySelector('input').value.trim().toLowerCase();
        let matches = [];

        feed.forEach(item => {
            let extended = `${item.text} ${item.body} ${item.keywords.join(' ')}`.toLowerCase();

            if (extended.includes(value))
                matches.push(item);
        });

        render(rabbit_hole, html`
            ${matches.map(item => html.node`
            <button class="dropdown-menu-clickable-item rabbit-hole-item" data-type=${item.type} onclick=${item.action}>
                <div class="info">
                    <div class="text">${item.text}</div>
                    <div class="body">${item.body}</div>
                </div>
            </button>
            `)}
        `);

        rabbit_select();
    }

    function rabbit_select(click = false) {
        /*notify({
            id: 'rabbit',
            title: selected
        });*/
        let buttons = rabbit_hole.querySelectorAll('button');
        buttons.forEach((button, index) => {
            if (index == selected) {
                button.setAttribute('aria-checked', 'true');

                if (click)
                    button.click();
            } else {
                button.setAttribute('aria-checked', 'false');
            }
        });

        input_box.querySelector('input').focus();
    }

    function rabbit_enter() {
        rabbit_select(true);
    }
}
