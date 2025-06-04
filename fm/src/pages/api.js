//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {log} from '../build/log';
import {auth, page, root} from '../build/page';
import {tl, trans} from '../build/trans';
import {checkup_page_structure} from '../components/structure';
import {register_background, update_page} from '../page';
import {html, render} from "lighterhtml";

export function bleh_api() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    let content_top = document.body.querySelector('.content-top');

    checkup_page_structure(false, content_top);
    log('status is', 'page', 'info', page);
    update_page();

    register_background(auth.avatar.replace('/avatar42s/', '/ar0/'));


    let success = page.structure.container.querySelector('.alert-success');

    if (!success) {
        let old = page.structure.main.querySelector('section');
        // token expired
        if (!old) return;

        page.name = old.querySelector('.api-app-name').textContent;
        let description = old.querySelector('.api-app-description').textContent.trim();

        let token = old.querySelector('form [name="csrfmiddlewaretoken"]').value;
        let cancel = old.querySelector('.form-submit a').getAttribute('href');

        render(page.structure.main, html`
            <section class="api-connector">
                <div class="avatar">
                    <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
                </div>
                <div class="info">
                    <h1>${page.name}</h1>
                    <div class="sub-text no-margin">${tl(trans.app_would_like_to_connect)}</div>
                    <div class="subtle">
                        ${html.node([
                            tl(trans.logged_in_as).replace('{user}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)
                        ])}
                    </div>
                </div>
                <div class="sep"></div>
                <div class="description">${description}</div>
                <div class="small-label with-icon lock">${tl(trans.ensure_you_trust)}</div>
                <div class="connector-footer">
                    <a class="see-more cancel" href="${cancel}">
                        ${tl(trans.cancel)}
                    </a>
                    <form method="post" data-no-partial-refresh="">
                        <input type="hidden" name="csrfmiddlewaretoken" value="${token}">
                        <input type="hidden" name="confirmation" value="confirm">
                        <button class="btn primary icon connect" type="submit" name="confirm">
                            ${tl(trans.connect)}
                        </button>
                    </form>
                </div>
            </section>
        `);
    } else {
        page.name = success.querySelector('strong').textContent;

        page.structure.main.innerHTML = (`
            <section class="api-connector">
                <div class="avatar">
                    <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
                </div>
                <div class="info">
                    <h1>${page.name}</h1>
                    <div class="sub-text no-margin">${tl(trans.has_been_connected)}</div>
                </div>
                <div class="sep"></div>
                <div class="description">${tl(trans.you_can_now_close_this_tab)}</div>
                <div class="connector-footer">
                    <a class="see-more" href="${root}settings/applications">
                        ${tl(trans.manage_applications)}
                    </a>
                </div>
            </section>
        `);
    }
}
