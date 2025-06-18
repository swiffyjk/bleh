import {auth, page, root} from "../build/page.js";
import {dialog, dialog_rm} from "./dialog.js";
import {html, render} from "lighterhtml";
import {input} from "./input.js";
import {tl, trans} from "../build/trans.js";
import {save_setting} from "./settings.js";
import {sanitise} from "../build/tools.js";
import {compare} from "./compare.js";
import {collage} from "./collage.js";
import {settings} from "../build/config.js";
import {open_profile_shortcut_window} from "./profile_shortcut.js";

export function register_rabbit() {
    page.state.cmd = false;
    let input_box;
    let selected = 0;
    let feed = 0;
    let matches = [];
    let rabbit_hole;

    let tip;

    let depth = 0;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = true;

        if (e.shiftKey)
            page.state.shift = true;

        /*notify({
            id: 'key',
            title: e.key
        });*/
        if (page.state.cmd && (e.key == 'k' || e.key == 'K' || e.key == ',') && !page.structure.dialogs.hasChildNodes()) {
            e.preventDefault();

            depth = 0;

            if (page.state.shift) {
                // ctrl + shift + k
                rabbit();
                use_page_as_ctx();
            } else {
                // ctrl + k
                rabbit();
            }
        } else if (page.structure.dialogs.hasChildNodes() && page.structure.dialogs.querySelector(':scope > [data-modal-type="rabbit"]')) {
            if (e.key == 'Escape') {
                if (depth == 0 && input_box.querySelector('input').value == '') {
                    dialog_rm({id: 'rabbit'});
                } else {
                    input_box.querySelector('input').value = '';
                    depth = 0;
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

        if (page.state.cmd && (e.key == 's' || e.key == 'S')) {
            e.preventDefault();

            if (settings.profile_shortcut != '') {
                window.location.href = `${root}user/${settings.profile_shortcut}`;
            } else {
                open_profile_shortcut_window();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = false;

        if (e.shiftKey)
            page.state.shift = false;
    });

    function rabbit() {
        page.state.rabbit_modal = dialog({
            id: 'rabbit',
            title: 'rabbit',
            body: html.node`
                ${() => {
                    input_box = input({
                        maxlength: 100,
                        placeholder: tl(trans.switch_placeholder),
                        focus: true
                    });
                    
                    input_box.classList.add('rabbit-search');
    
                    return input_box;
                }}
                <div class="rabbit-hole" ref=${el => rabbit_hole = el} />
                <div class="tip" ref=${el => tip = el} />
            `,
            type: 'rabbit',
            replace_if_possible: true,
            handle_escape_manually: true
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
        if (!pre_matches && depth == 0) {
            feed = [
                {
                    type: 'on_this_page',
                    text: tl(trans.on_this_page),
                    body: tl(trans.use_current_page_as_context),
                    keywords: ['ctx', 'context'],
                    action: () => use_page_as_ctx(),
                    keybind: ['⌘', '⇧', 'K']
                },
                {
                    type: 'theme',
                    text: tl(trans.themes.name),
                    body: tl(trans.opens_the_value).replace('{v}', tl(trans.theme_picker)),
                    keywords: ['themes', 'light', 'dark', 'ash', 'darker', 'oled', 'amoled', 'midnight', 'void', 'abyss', 'dark reader'],
                    action: () => bleh_theme_picker()
                },
                {
                    type: 'profile_shortcut',
                    text: settings.profile_shortcut,
                    body: tl(trans.opens_your_profile_shortcut),
                    keywords: ['profile', 'user', 'shortcut', 'friends'],
                    action: () => window.location.href = `${root}user/${settings.profile_shortcut}`,
                    hide: (settings.profile_shortcut == ''),
                    keybind: ['⌘', 'S']
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
        } else if (pre_matches) {
            feed = pre_matches;
        }

        let value = '';
        if (value == '')
            value = input_box.querySelector('input').value.trim().toLowerCase();

        matches = [];

        feed.forEach(item => {
            let extended = `${item.text} ${item.body} ${item.keywords.join(' ')}`.toLowerCase();

            let words = value.split(' ');
            let match = false;
            words.forEach(word => {
                if (extended.includes(word)) {
                    match = true;
                }
            });

            if (item.hide)
                match = false;

            if (match)
                matches.push(item);
        });

        render(rabbit_hole, html`
            ${matches.length > 0 ? matches.map((item, index) => () => {
                let button = html.node`
                    <button class="dropdown-menu-clickable-item rabbit-hole-item" data-type=${item.type} onclick=${item.action}>
                        <div class="info">
                            <div class="text">${item.text}</div>
                        </div>
                        ${item.keybind ? html.node`
                        <div class="keybind">
                            ${item.keybind.map(key => html.node`<kbd>${key}</kbd>`)}
                        </div>
                        ` : ''}
                    </button>
                `;
                
                button.addEventListener('mouseover', () => {
                    selected = index;
                    rabbit_select(false, true);
                });
                
                return button;
            }) : html.node`
                <div class="loading-data-container">
                    <div class="loading-data-text failed">${tl(trans.nothing_matches_your_search)}</div>
                </div>
            `}
        `);

        rabbit_select();
    }

    function rabbit_select(click = false, with_mouse = false) {
        tip.textContent = tl(trans.select_an_option);

        let buttons = rabbit_hole.querySelectorAll('button');
        buttons.forEach((button, index) => {
            if (index == selected) {
                button.setAttribute('aria-selected', 'true');
                if (!with_mouse) {
                    button.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }

                if (click) {
                    //input_box.querySelector('input').value = matches[index].text;
                    input_box.querySelector('input').value = '';
                    button.click();
                }

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
        depth = 1;
        rabbit_search('internal:theme_picker', [
            {
                type: 'theme_light',
                text: tl(trans.themes.light),
                body: tl(trans.changes_your_theme),
                keywords: ['sun', 'day'],
                action: () => save_setting('theme', 'light')
            },
            {
                type: 'theme_ink',
                text: tl(trans.themes.ink),
                body: tl(trans.changes_your_theme),
                keywords: ['sun', 'day', 'light', 'e-ink'],
                action: () => save_setting('theme', 'ink')
            },
            {
                type: 'theme_ash',
                text: tl(trans.themes.dark),
                body: tl(trans.changes_your_theme),
                keywords: ['dark', 'night', 'grey', 'gray'],
                action: () => save_setting('theme', 'dark')
            },
            {
                type: 'theme_dark',
                text: tl(trans.themes.darker),
                body: tl(trans.changes_your_theme),
                keywords: ['dark', 'night', 'grey', 'gray'],
                action: () => save_setting('theme', 'darker')
            },
            {
                type: 'theme_void',
                text: tl(trans.themes.oled),
                body: tl(trans.changes_your_theme),
                keywords: ['dark', 'night', 'black'],
                action: () => save_setting('theme', 'oled')
            }
        ]);
    }

    function use_page_as_ctx() {
        const allowed_pages = [
            'user',
            'artist',
            'album',
            'track'
        ];

        if (!allowed_pages.includes(page.type))
            return;

        depth = 1;

        let url_start = root;

        if (page.type == 'user')
            url_start += 'user/';
        else if (page.type == 'album' || page.type == 'artist' || page.type == 'track')
            url_start += 'music/';

        if (page.type == 'album')
            url_start += `${sanitise(page.sister)}/${sanitise(page.name)}`;
        else if (page.type == 'track')
            url_start += `${sanitise(page.sister)}/_/${sanitise(page.name)}`;
        else
            url_start += sanitise(page.name);

        // custom control
        if (page.type == 'user') {
            rabbit_search('internal:ctx', [
                {
                    type: 'overview',
                    text: tl(trans.overview),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.overview)).replace('{t}', page.name),
                    keywords: ['home'],
                    action: () => window.location.href = url_start
                },
                {
                    type: 'reports',
                    text: tl(trans.reports),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.reports)).replace('{t}', page.name),
                    keywords: ['listening report', 'reports', 'wrapped', 'playback', 'spotify'],
                    action: () => window.location.href = url_start + '/listening-report'
                },
                {
                    type: 'library',
                    text: tl(trans.library),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.library)).replace('{t}', page.name),
                    keywords: ['library', 'music', 'artists', 'albums', 'tracks', 'scrobbles', 'history'],
                    action: () => window.location.href = url_start + '/library'
                },
                {
                    type: 'friends',
                    text: tl(trans.friends),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.friends)).replace('{t}', page.name),
                    keywords: ['friends', 'following', 'followers', 'neighbours', 'similar'],
                    action: () => window.location.href = url_start + '/following'
                },
                {
                    type: 'following',
                    text: tl(trans.following),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.following)).replace('{t}', page.name),
                    keywords: ['friends', 'following'],
                    action: () => window.location.href = url_start + '/following'
                },
                {
                    type: 'followers',
                    text: tl(trans.followers),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.followers)).replace('{t}', page.name),
                    keywords: ['friends', 'followers'],
                    action: () => window.location.href = url_start + '/followers'
                },
                {
                    type: 'neighbours',
                    text: tl(trans.neighbours),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.neighbours)).replace('{t}', page.name),
                    keywords: ['friends', 'neighbours', 'similar'],
                    action: () => window.location.href = url_start + '/neighbours'
                },
                {
                    type: 'shouts',
                    text: tl(trans.shouts),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.shouts)).replace('{t}', page.name),
                    keywords: ['shout', 'shoutbox', 'shouts', 'comments'],
                    action: () => window.location.href = url_start + '/shoutbox'
                },
                {
                    type: 'loved',
                    text: tl(trans.loved),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.loved)).replace('{t}', page.name),
                    keywords: ['loved', 'hearted', 'favourites', 'favorites', 'luved'],
                    action: () => window.location.href = url_start + '/loved'
                },
                {
                    type: 'obsessions',
                    text: tl(trans.obsessions),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.obsessions)).replace('{t}', page.name),
                    keywords: ['loved', 'hearted', 'favourites', 'favorites', 'obsessions', 'looping'],
                    action: () => window.location.href = url_start + '/obsessions'
                },
                {
                    type: 'events',
                    text: tl(trans.events),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.events)).replace('{t}', page.name),
                    keywords: ['events', 'festivals', 'tour', 'live'],
                    action: () => window.location.href = url_start + '/events'
                },
                {
                    type: 'playlists',
                    text: tl(trans.playlists),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.playlists)).replace('{t}', page.name),
                    keywords: ['playlists', 'folders'],
                    action: () => window.location.href = url_start + '/playlists'
                },
                {
                    type: 'tags',
                    text: tl(trans.tags),
                    body: tl(trans.opens_the_value_for_type).replace('{v}', tl(trans.tags)).replace('{t}', page.name),
                    keywords: ['tags', 'tagged', 'related', 'groups', 'grouped'],
                    action: () => window.location.href = url_start + '/tags'
                },
                {
                    type: 'compare',
                    text: tl(trans.compare),
                    body: tl(trans.compares_your_taste).replace('{v}', page.name),
                    keywords: ['similar', 'taste', 'music', 'shared'],
                    action: () => compare(),
                    hide: (page.name == auth.name)
                },
                {
                    type: 'collage',
                    text: tl(trans.collage),
                    body: tl(trans.create_a_collage),
                    keywords: ['similar', 'taste', 'music', 'shared'],
                    action: () => collage()
                }
            ]);
        }
    }
}
