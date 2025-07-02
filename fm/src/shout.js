//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {patch_avatar} from "./avatar";
import {settings} from "./build/config";
import {log} from "./build/log";
import {auth, page, root, shout_parse_queue} from "./build/page";
import {tl, trans, trans_legacy} from "./build/trans";
import {deliver_notif, notify} from "./components/notify";
import {html, render} from "lighterhtml";
import {setting} from "./components/settings.js";

export function patch_shouts() {
    if (!page.structure.main) return;

    let shout_controls = page.structure.main.querySelector('.shoutbox-controls-wrapper:not([data-shouts])');
    if (shout_controls) {
        shout_controls.setAttribute('data-shouts', 'true');
        let panel = shout_controls.parentElement;

        let select_btn = panel.querySelector('.dropdown-menu-clickable-button');
        let settings_btn;

        let header = panel.querySelector('h2');
        header.parentElement.removeChild(header);

        let link = window.location.href;
        let shoutbox_link = '+shoutbox';
        if (page.type == 'user' || 'event')
            shoutbox_link = 'shoutbox';

        if (!page.subpage.startsWith('shoutbox'))
            link += `/${shoutbox_link}`;

        panel.insertBefore(html.node`
            <div class="top-container">
                <h2>
                    <a class="text-colour-link" href=${link}>${tl(trans.shouts)}</a>
                </h2>
                <div class="accompany view-buttons blend blend-v2">
                    ${() => {
                        select_btn.classList.add('select-button', 'link-select', 'blend-v2-btn');
                        select_btn.classList.remove('section-control', 'dropdown-menu-clickable-button');
                        return shout_controls;
                    }}
                </div>
                <div class="view-buttons blend blend-v2">
                    <button class="left-icon blend-v2-btn" data-type="settings" ref=${el => settings_btn = el}>
                        ${tl(trans.settings)}
                    </button>
                </div>
            </div>
        `, panel.firstElementChild);

        tippy(settings_btn, {
            theme: 'window',
            content: html.node`
                <div class="dialog-settings">
                    ${setting({id: 'shout_markdown'})}
                    <div class="sep"></div>
                    ${setting({id: 'accessible_name_colours'})}
                    ${setting({id: 'underline_links'})}
                </div>
            `,
            placement: 'bottom',
            interactive: true,
            interactiveBorder: 10,
            trigger: 'click'
        });
    }

    let shouts = page.structure.main.querySelectorAll('.shout:not([data-kate-processed])');

    shouts.forEach((shout, index) => {
        try {
            shout.setAttribute('data-kate-processed', 'true');
            shout.style.setProperty('--delay', index * 0.04 + 's');

            let shout_name = shout.querySelector('.shout-user a');
            if (!shout_name) return;

            let shout_name_text = shout_name.textContent;

            let shout_avatar = shout.querySelector('.shout-user-avatar');

            let badge = patch_avatar(shout_avatar, shout_name_text, 'shout');

            if (badge.type) {
                if (badge.type == 'avatar-status-dot--staff')
                    shout.classList.add('staff-shout');

                shout_avatar.setAttribute('data-avatar-themed', 'true');
                shout_avatar.classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${shout_name_text}`);
                shout_name.classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${shout_name_text}`);
            }

            if (settings.shout_markdown) {
                let shout_body = shout.querySelector('.shout-body p');
                shout_parse_queue.push({element: shout_body});
            }


            // timestamp
            let shout_timestamp = shout.querySelector('.shout-timestamp time');
            if (shout_timestamp) {
                tippy(shout_timestamp, {
                    content: shout_timestamp.getAttribute('title')
                });

                shout_timestamp.removeAttribute('title');
            }


            let send_button = shout.querySelector('.form-group--submit');
            shout_send(send_button);
        } catch(e) {
            deliver_notif('a shout on this page failed to be modified :(');
            console.error('bleh - a shout failed to patch', e);
        }
    });

    if (settings.shout_markdown && shout_parse_queue.length > 0)
        parse_shout_queue();

    // enter a shout field
    let shout_forms = document.querySelectorAll('.shout-form:not([data-kate-processed])');
    shout_forms.forEach((shout_form) => {
        shout_form.setAttribute('data-kate-processed', 'true');
        let shout_avatar = shout_form.querySelector('.shout-user-avatar');

        patch_avatar(shout_avatar, auth.name);


        let send_button = shout_form.querySelector('.form-group--submit');
        shout_send(send_button);

        //let textarea = shout_form.querySelector('textarea');
        shout_form.addEventListener('keydown', (e) => {
            //console.info('key', e, e.keyCode, e.target, textarea, e.target == textarea);

            /*if (e.target != textarea)
                return;*/

            // CTRL + ENTER
            if (e.ctrlKey && e.keyCode == 13) {
                e.preventDefault();

                send_button.querySelector('.btn-post-shout').click();
                notify({
                    id: 'shout',
                    title: trans_legacy.en.shout.name,
                    body: trans_legacy.en.shout.sent,
                    icon: 'icon-16-send'
                });
            }
        });
    });
}

function shout_send(send_button) {
    if (!send_button) return;

    let button = send_button.querySelector('.btn-post-shout');
    if (!button) return;

    button.classList.add('btn-send-shout-generic');
    button.textContent = tl(trans.send);

    if (page.mobile) return;

    tippy(button, {
        content: tl(trans.send_quickly_with).replace('{kbd}', '<span class="keybind"><kbd>⌘</kbd><kbd>↵</kbd></span>'),
        delay: [500, 0],
        allowHTML: true
    });
}

export function parse_shout_queue() {
    if (shout_parse_queue.length === 0) return;

    const shout = shout_parse_queue.shift();

    const converter = new showdown.Converter({
        emoji: true,
        excludeTrailingPunctuationFromURLs: true,
        headerLevelStart: 5,
        noHeaderId: true,
        openLinksInNewWindow: true,
        requireSpaceBeforeHeadingText: true,
        simpleLineBreaks: true,
        simplifiedAutoLink: true,
        strikethrough: true,
        underline: true,
        ghCodeBlocks: false,
        smartIndentationFix: true
    });

    const raw = shout.element.textContent
        .replace(/([@])([a-zA-Z0-9_]+)/g, `[$1$2](${root}user/$2)`)
        .replace(/\[artist\]([a-zA-Z0-9]+)\[\/artist\]/g, `[$1](${root}music/$1)`)
        .replace(/\[album artist=([a-zA-Z0-9]+)\]([a-zA-Z0-9\s]+)\[\/album\]/g, `[$2](${root}music/$1/$2)`)
        .replace(/\[track artist=([a-zA-Z0-9]+)\]([a-zA-Z0-9\s]+)\[\/track\]/g, `[$2](${root}music/$1/_/$2)`)
        .replace(/https:\/\/open\.spotify\.com\/user\/([A-Za-z0-9]+)\?si=([A-Za-z0-9]+)/g, '[@$1](https://open.spotify.com/user/$1)')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    render(shout.element, html.node([converter.makeHtml(raw)]));

    log('parsed one shout', 'shout', 'log');

    if (shout_parse_queue.length > 0)
        setTimeout(parse_shout_queue, 50);
}

unsafeWindow._show_hidden_shout = function(shout_id) {
    document.getElementById(`bleh--shout-${shout_id}`).setAttribute('data-bleh--shout-expanded','true');
}
