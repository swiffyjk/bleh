import {page, root} from "../build/page.js";
import {dialog, dialog_rm} from "./dialog.js";
import {html, render} from "lighterhtml";
import {input} from "./input.js";
import {tl, trans} from "../build/trans.js";
import {notify} from "./notify.js";
import {save_setting} from "./settings.js";

export function register_rabbit() {
    page.state.cmd = false;
    let input_box;
    let selected = 0;
    let feed = 0;
    let matches = [];
    let rabbit_hole;

    let tip;

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
            if (e.key == 'Escape') {
                if (input_box.querySelector('input').value == '') {
                    dialog_rm({id: 'rabbit'});
                } else {
                    input_box.querySelector('input').value = '';
                    rabbit_search();
                }
            }

            if (e.key == 'Tab') {
                e.preventDefault();
                rabbit_tab();
            }

            if (e.key == 'ArrowDown') {
                e.preventDefault();
                if (selected < (matches.length - 1))
                    selected++;
                else
                    selected = 0;

                rabbit_select();
            } else if (e.key == 'ArrowUp') {
                e.preventDefault();
                if (selected > 0)
                    selected--;
                else
                    selected = (matches.length - 1);

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
                    
                    input_box.classList.add('rabbit-search');
    
                    return input_box;
                }}
                <div class="rabbit-hole" ref=${el => rabbit_hole = el} />
                <div class="tip" ref=${el => tip = el} />
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

    function rabbit_search(pre_selected = '', pre_matches = null) {
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
            },
            {
                type: 'theme',
                text: tl(trans.themes.name),
                body: tl(trans.opens_the_value).replace('{v}', tl(trans.theme_picker)),
                keywords: ['themes', 'light', 'dark', 'ash', 'darker', 'oled', 'amoled', 'midnight', 'void', 'abyss', 'dark reader'],
                action: () => bleh_theme_picker()
            },
            {
                type: 'settings',
                text: tl(trans.settings),
                body: tl(trans.opens_your_value_settings).replace('{v}', tl(trans.profile)),
                keywords: ['profile', 'user', 'pfp', 'avi', 'avatar', 'config', 'configuration', 'configure', 'picture', 'photo'],
                action: () => window.location.href = `${root}settings`
            },
            {
                type: 'bleh_settings',
                text: tl(trans.settings),
                body: tl(trans.opens_the_value).replace('{v}', tl(trans.bleh_settings)),
                keywords: ['bleh', 'extension', 'config', 'configuration', 'configure'],
                action: () => window.location.href = `${root}bleh`
            }
        ];

        let value = pre_selected;
        if (value == '')
            value = input_box.querySelector('input').value.trim().toLowerCase();

        if (!pre_matches) {
            matches = [];

            feed.forEach(item => {
                let extended = `${item.text} ${item.body} ${item.keywords.join(' ')}`.toLowerCase();

                if (extended.includes(value))
                    matches.push(item);
            });
        } else {
            matches = pre_matches;
        }

        render(rabbit_hole, html`
            ${matches.map((item, index) => () => {
                let button = html.node`
                    <button class="dropdown-menu-clickable-item rabbit-hole-item" data-type=${item.type} onclick=${item.action}>
                        <div class="info">
                            <div class="text">${item.text}</div>
                        </div>
                    </button>
                `;
                
                button.addEventListener('mouseover', () => {
                    selected = index;
                    rabbit_select();
                });
                
                return button;
            })}
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
                button.setAttribute('aria-selected', 'true');

                if (click)
                    button.click();

                tip.textContent = matches[index].body;
            } else {
                button.setAttribute('aria-selected', 'false');
            }
        });

        input_box.querySelector('input').focus();
    }

    function rabbit_enter() {
        rabbit_select(true);
    }

    function bleh_theme_picker() {
        // custom control
        rabbit_search('internal:theme_picker', [
            {
                type: 'theme_light',
                text: tl(trans.themes.light),
                body: tl(trans.changes_your_theme),
                keywords: [],
                action: () => save_setting('theme', 'light')
            },
            {
                type: 'theme_ink',
                text: tl(trans.themes.ink),
                body: tl(trans.changes_your_theme),
                keywords: [],
                action: () => save_setting('theme', 'ink')
            },
            {
                type: 'theme_ash',
                text: tl(trans.themes.dark),
                body: tl(trans.changes_your_theme),
                keywords: [],
                action: () => save_setting('theme', 'dark')
            },
            {
                type: 'theme_dark',
                text: tl(trans.themes.darker),
                body: tl(trans.changes_your_theme),
                keywords: [],
                action: () => save_setting('theme', 'darker')
            },
            {
                type: 'theme_void',
                text: tl(trans.themes.oled),
                body: tl(trans.changes_your_theme),
                keywords: [],
                action: () => save_setting('theme', 'oled')
            }
        ]);
    }
}
