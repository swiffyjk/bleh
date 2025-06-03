//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {render} from 'lighterhtml';
import {page} from '../build/page';
import {markdown} from '../components/markdown';

export function bleh_users() {
    let users = page.structure.main.querySelectorAll('.user-list-about-me');
    users.forEach((user) => {
        render(user, markdown(user.textContent, {
            allow_headers: true,
            line_breaks: false
        }));
    });
}
