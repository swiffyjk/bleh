//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {log} from "../build/log";
import {sponsor_list} from "../build/sponsor";
import {tl, trans} from "../build/trans";

export function load_badges(user, solo = false) {
    if (sponsor_list == null)
        return;

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
                badge.reason = 'requires_higher_bleh_version';
            }
        }

        if (badge.reason)
            return;

        if (badge.type == 'sponsor' || badge.type == 'contributor' || badge.type == 'translation')
            badge.reason = badge.type;
        else if (badge.type == 'cute' || badge.type == 'queen')
            badge.reason = 'cute';
        else
            badge.reason = 'reserved';
    });

    log('final badge list', 'sponsor', 'info', badges);
    return badges;
}
