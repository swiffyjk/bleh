//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {html} from "lighterhtml";
import {log} from "./build/log";
import {auth, root} from "./build/page";
import {sponsor_list} from "./build/sponsor";
import {tl, trans} from "./build/trans";
import {load_badges} from "./components/badge";
import {dialog} from "./components/dialog";
import {share} from "./components/share.js";

export function patch_avatar(avatar, name, type = '', parent=null, side='right') {
    if (avatar.hasAttribute('data-bleh-avatar'))
        return;
    avatar.setAttribute('data-bleh-avatar', 'true');

    let avatar_img = avatar.querySelector('img');
    if (!avatar_img) return;

    // last.fm bug: it uses 64s instead of avatar70s for
    // event attendees - this causes it to center in the middle of the image
    // rather than the top
    avatar_img.setAttribute('src', avatar_img.getAttribute('src').replace('/64s/', '/avatar70s/'));

    let badges = load_badges(name, true);

    if (badges) {
        // remove pre-existing badge
        let pre_existing_badge = avatar.querySelector('.avatar-status-dot');
        if (pre_existing_badge)
            avatar.removeChild(pre_existing_badge);

        avatar.setAttribute('title','');

        let this_badge = sponsor_list.badges[name];
        if (!Array.isArray(sponsor_list.badges[name])) {
            // default
            log(`@${name} 1 badge:`, 'shout', 'info', sponsor_list.badges[name]);
        } else {
            // multiple
            log(`@${name} multiple badges:`, 'shout', 'info', sponsor_list.badges[name]);
            let badges_length = Object.keys(sponsor_list.badges[name]).length - 1;
            this_badge = sponsor_list.badges[name][badges_length];
            log(`@${name} using badge ${badges_length} as primary`, 'shout', 'info', this_badge);
        }

        // make new badge
        let badge = document.createElement('span');
        badge.classList.add('avatar-status-dot',`user-status--bleh-${this_badge.type}`,`user-status--bleh-user-${name}`);
        avatar.appendChild(badge);

        if (!parent)
            avatar.classList.add('avatar-can-hoverbox');
        else
            parent.classList.add('parent-can-hoverbox');
        tippy((parent) ? parent : avatar, {
            theme: 'user',
            content: (html.node`
                <div class="image-info">
                    <div class="inner-image">
                        ${html.node([avatar_img.outerHTML])}
                    </div>
                    <div class="info">
                        <h5 class="title">${name}</h5>
                        <p class="badge user-status--bleh-${this_badge.type} user-status--bleh-user-${name}" data-badge-type="${this_badge.type}" data-badge-user="${name}">${this_badge.name}</p>
                    </div>
                    <a href="${root}user/${name}" class="link-over"></a>
                </div>
                <div class="user-buttons view-buttons">
                    <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${tl(trans.library)}</a>
                    <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${tl(trans.shouts)}</a>
                </div>
            `),
            placement: side,
            interactive: true,
            delay: [200, 0]
        });

        return this_badge;
    } else {
        let pre_existing_badge = avatar.querySelector('.avatar-status-dot');
        if (!pre_existing_badge) {
            if (!parent)
                avatar.classList.add('avatar-can-hoverbox');
            else
                parent.classList.add('parent-can-hoverbox');
            tippy((parent) ? parent : avatar, {
                theme: 'user',
                content: (html.node`
                    <div class="image-info">
                        <div class="inner-image">
                            ${html.node([avatar_img.outerHTML])}
                        </div>
                        <div class="info">
                            <h5 class="title">${name}</h5>
                        </div>
                        <a href="${root}user/${name}" class="link-over"></a>
                    </div>
                    <div class="user-buttons view-buttons">
                        <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${tl(trans.library)}</a>
                        <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${tl(trans.shouts)}</a>
                    </div>
                `),
                placement: side,
                interactive: true,
                delay: [200, 0]
            });

            return {};
        } else {
            if (!parent)
                avatar.classList.add('avatar-can-hoverbox');
            else
                parent.classList.add('parent-can-hoverbox');
            tippy((parent) ? parent : avatar, {
                theme: 'user',
                content: (html.node`
                    <div class="image-info">
                        <div class="inner-image">
                            ${html.node([avatar_img.outerHTML])}
                        </div>
                        <div class="info">
                            <h5 class="title">${name}</h5>
                            <p class="badge ${pre_existing_badge.classList[1]}">${avatar.getAttribute('title')}</p>
                        </div>
                        <a href="${root}user/${name}" class="link-over"></a>
                    </div>
                    <div class="user-buttons view-buttons">
                        <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${tl(trans.library)}</a>
                        <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${tl(trans.shouts)}</a>
                    </div>
                `),
                placement: side,
                interactive: true,
                delay: [200, 0]
            });
            avatar.setAttribute('title', '');

            return {
                type: pre_existing_badge.classList[1]
            };
        }
    }
}

export function return_name_from_avatar(avatar) {
    if (!avatar)
        return;

    if (!avatar.hasAttribute('alt'))
        return;

    if (avatar.getAttribute('alt') == tl(trans.your_avatar))
        return auth;

    return avatar.getAttribute('alt').replace(tl(trans.avatar_for_user), '');
}

unsafeWindow._expand_avatar = function(src) {
    expand_avatar(src);
}
export function expand_avatar(src) {
    dialog({
        id: 'avatar',
        body: html.node`
            <div class="full-avatar-wrapper">
                <div class="full-avatar">
                    <img src="${src}">
                </div>
                <div class="modal-footer">
                    <div class="fill"></div>
                    <div class="button-group">
                        <button class="btn icon" data-type="share" onclick=${() => share(src)}>
                            ${tl(trans.share)}
                        </button>
                        <a class="btn primary open" href="${src}" target="_blank">
                            ${tl(trans.open_new_tab)}
                        </a>
                    </div>
                    <div class="fill"></div>
                </div>
            </div>
        `,
        type: 'avatar',
        has_overlays: false
    });
}
