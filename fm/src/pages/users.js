//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {render} from 'lighterhtml';
import {page} from '../build/page';
import {markdown} from '../components/markdown';
import {patch_avatar} from "../avatar.js";
import {correct_artist} from "../components/lotus.js";

export function bleh_users() {
    let users = page.structure.main.querySelectorAll('.user-list-item:not(.user-list-item-mobile-ad)');
    users.forEach((user) => {
        let avatar = user.querySelector('.user-list-avatar');
        let name = user.querySelector('.user-list-link').textContent;

        let badge = patch_avatar(avatar, name, 'follow');

        if (badge.type) {
            user.querySelector('.user-list-link').classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${name}`);
            user.classList.add('colourful', `user-status--bleh-${badge.type}`, `user-status--bleh-user-${name}`);
        }

        let artists = user.querySelectorAll('.user-list-shared-artists a');
        artists.forEach((artist) => {
            artist.textContent = correct_artist(artist.textContent);
        });

        let md = user.querySelector('.user-list-about-me');
        if (md) {
            render(md, markdown(md.textContent, {
                allow_headers: true,
                line_breaks: false
            }));
        }
    });
}
