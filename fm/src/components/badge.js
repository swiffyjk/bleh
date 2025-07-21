//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {log} from "../build/log";
import {sponsor_list} from "../build/sponsor";
import {tl, trans} from "../build/trans";
import {html} from "lighterhtml";
import {page} from "../build/page.js";
import {sponsor} from "../sponsor.js";

export function load_badges(user, solo = false) {
    if (!sponsor_list || !sponsor_list.badges) return;

    if (!sponsor_list.badges.hasOwnProperty(user))
        return;

    let badges = [];

    if (!Array.isArray(sponsor_list.badges[user])) {
        log('1 badge found', 'sponsor', 'info', sponsor_list.badges[user]);
        badges.push(sponsor_list.badges[user]);
    } else {
        log('multiple badges found', 'sponsor', 'info', sponsor_list.badges[user]);

        if (solo)
            badges.push(sponsor_list.badges[user][Object.keys(sponsor_list.badges[user]).length - 1])
        else
            badges = sponsor_list.badges[user];
    }

    // now we run thru to add missing metadata
    badges.forEach((badge) => {
        if (!badge.name) {
            if (trans.badges[badge.type]) {
                badge.name = tl(trans.badges[badge.type].name);
            } else {
                badge.name = tl(trans.unavailable);
                badge.reason = tl(trans.requires_higher_bleh_version);
            }
        }

        // if there's a translation available, use it instead of defaulting
        if (trans.badges[badge.type] && trans.badges[badge.type].reason)
            badge.reason = tl(trans.badges[badge.type].reason);

        if (badge.reason)
            return;

        if (badge.type == 'sponsor' || badge.type == 'contributor')
            badge.reason = badge.type;
        else if (badge.type == 'cute' || badge.type == 'queen')
            badge.reason = tl(trans.badges.cute.reason);
        else
            badge.reason = tl(trans.badges.reserved.reason);
    });

    log('final badge list', 'sponsor', 'info', badges);
    return badges;
}

export function create_badge(badge={
    type: '',
    icon: '',
    reason: '',
    hue: 0,
    sat: 0,
    lit: 0,
    name: ''
}, name=page.name) {
    let elem = html.node`
        <span class="label no-hover">
            ${badge.name}
        </span>
    `;

    if (badge.icon != '' && badge.hue > 0 && badge.sat > 0 && badge.lit > 0) {
        // new style badge
        elem.style.setProperty('--mask', `url(${badge.icon})`);
        elem.style.setProperty('--hue-over', badge.hue);
        elem.style.setProperty('--sat-over', badge.sat);
        elem.style.setProperty('--lit-over', badge.lit);
    } else {
        elem.classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${name}`);
    }

    tippy(elem, {
        theme: 'badge',
        placement: 'bottom',
        content: html.node`
            <div class="badge-name">${badge.name}</div>
            <div class="badge-reason">${badge.reason}</div>
        `,
    });

    if (badge.type == 'sponsor')
        elem.onclick = sponsor;

    return elem;
}
