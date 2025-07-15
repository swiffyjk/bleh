//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {register_activity} from "../activity";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {tl, trans, trans_legacy} from "../build/trans";
import {request_changelog} from "../news.js";
import {notify} from "../components/notify";
import {checkup_page_structure} from '../components/structure';
import {refresh_all} from "../config";
import {version} from "../main";
import {register_background, update_page} from '../page';
import {display_colour_presets, show_theme_change_in_settings, theme_bubbles} from "./bleh_config";
import {html, render} from "lighterhtml";
import {setting} from "../components/settings.js";

export function bleh_setup() {
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

    register_background(auth.avatar.replace('/avatar42s/', '/ar0/'));

    page.type = 'bleh_setup';
    page.subpage = '';

    log('status is', 'page', 'info', page);

    update_page();

    page.state.trans = 0;

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);

    page.structure.container.removeAttribute('data-beret');
    page.structure.container.removeAttribute('data-short');
    page.structure.content.classList.add('cards-view');

    let masthead = document.body.querySelector('.masthead');
    masthead.classList.add('in-setup');

    page.structure.main.innerHTML = (`
        <section class="setup">
            <div class="avatar">
                <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
            </div>
            <div class="info">
                <h1>${tl(trans.bleh_setup)}</h1>
                <div class="subtle">${tl(trans.logged_in_as).replace('{user}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)}</div>
            </div>
            <div class="sep"></div>
            <div class="setup-content"></div>
            <div class="setup-footer"></div>
        </section>
    `);

    page.structure.setup = page.structure.main.querySelector('.setup');
    page.structure.setup_content = page.structure.main.querySelector('.setup-content');
    page.structure.setup_footer = page.structure.main.querySelector('.setup-footer');

    bleh_setup_start();
}

unsafeWindow._setup = function() {
    bleh_setup_start();
}
function bleh_setup_start() {
    page.structure.setup.setAttribute('data-page', 'start');
    page.structure.setup.setAttribute('data-animating', 'true');
    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${{html: tl(trans.welcome_to_bleh)}}</p>
        `);
        page.structure.setup_footer.innerHTML = (`
            <a class="see-more cancel" href="${root}user/${auth.name}">
                ${tl(trans.skip)}
            </a>
            <div class="fill"></div>
            <button class="btn primary continue" onclick="_setup_accessibility()">
                ${tl(trans.next)}
            </button>
        `);
    }, page.state.trans);

    page.state.trans = 200;
}

unsafeWindow._setup_themes = function() {
    page.structure.setup.setAttribute('data-page', 'themes');
    page.structure.setup.setAttribute('data-animating', 'true');

    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${tl(trans.choose_a_theme)}</p>
            ${theme_bubbles}
        `);
        page.structure.setup_footer.innerHTML = (`
            <button class="see-more cancel" onclick="_setup_accessibility()">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <button class="btn primary continue" onclick="_setup_colours()">
                ${tl(trans.next)}
            </button>
        `);

        show_theme_change_in_settings();
        refresh_all(page.structure.setup_content);
    }, page.state.trans);
}

unsafeWindow._setup_accessibility = function() {
    page.structure.setup.setAttribute('data-page', 'accessibility');
    page.structure.setup.setAttribute('data-animating', 'true');
    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${tl(trans.accessibility_explain)}</p>
            <div class="settings">
                <div class="setting-group">
                    ${setting({id: 'reduced_motion'})}
                    ${setting({id: 'underline_links'})}
                </div>
            </div>
        `);
        page.structure.setup_footer.innerHTML = (`
            <button class="see-more cancel" onclick="_setup()">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <button class="btn primary continue" onclick="_setup_themes()">
                ${tl(trans.next)}
            </button>
        `);

        refresh_all(page.structure.setup_content);
    }, page.state.trans);
}

unsafeWindow._setup_colours = function() {
    page.structure.setup.setAttribute('data-page', 'colours');
    page.structure.setup.setAttribute('data-animating', 'true');
    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${tl(trans.colours_explain)}</p>
            <div class="view-buttons colour-buttons view-buttons-middle" id="colour_custom"></div>
            <div class="swatch-group">
                <div id="colour_red" class="palette options colours"></div>
                <div id="colour_orange" class="palette options colours"></div>
                <div id="colour_yellow" class="palette options colours"></div>
                <div id="colour_green" class="palette options colours"></div>
                <div id="colour_lime" class="palette options colours"></div>
                <div id="colour_aqua" class="palette options colours"></div>
                <div id="colour_blue" class="palette options colours"></div>
                <div id="colour_purple" class="palette options colours"></div>
                <div id="colour_pink" class="palette options colours"></div>
            </div>
        `);
        page.structure.setup_footer.innerHTML = (`
            <button class="see-more cancel" onclick="_setup_themes()">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <button class="btn primary continue" onclick="_setup_music()">
                ${tl(trans.next)}
            </button>
        `);

        display_colour_presets();
        refresh_all(page.structure.setup_content);
    }, page.state.trans);
}

unsafeWindow._setup_music = function() {
    page.structure.setup.setAttribute('data-page', 'music');
    page.structure.setup.setAttribute('data-animating', 'true');
    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${tl(trans.music_explain)}</p>
            <div class="settings">
                <div class="inner-preview pad flex">
                    <section class="redesigned-header mockup redesigned-track-header no-top-margin">
                        <div class="avatar-side">
                            <img src="https://lastfm.freetls.fastly.net/i/u/avatar170s/8bd696cbd4aa4d4eb6d35393232f55e4.jpg">
                        </div>
                        <div class="info-side">
                            <div class="sub-text">${tl(trans.track)}</div>
                            <div class="title-container">
                                <h1 class="bleh--name-with-features">
                                    <div class="title">California Love</div>
                                    <div class="feat" data-bleh--tag-type="ft." data-bleh--tag-group="guests">ft. Dr. Dre, Roger Troutman</div>
                                    <div class="feat" data-bleh--tag-type="- remix" data-bleh--tag-group="mixes">Remix</div>
                                </h1>
                                <h1 class="bleh--name-without-features">
                                    California Love (ft. Dr. Dre, Roger Troutman) - Remix
                                </h1>
                            </div>
                            <h2>
                                <a class="header-new-crumb">2Pac</a><span class="bleh--name-with-features">, </span>
                                <a class="header-new-crumb bleh--name-with-features">Dr. Dre</a><span class="bleh--name-with-features">, </span>
                                <a class="header-new-crumb bleh--name-with-features">Roger Troutman</a>
                            </h2>
                        </div>
                    </section>
                </div>
                <div class="setting-group">
                    ${setting({id: 'corrections'})}
                    ${setting({id: 'format_guest_features'})}
                    ${setting({id: 'stacked_chartlist_info'})}
                </div>
            </div>
        `);
        page.structure.setup_footer.innerHTML = (`
            <button class="see-more cancel" onclick="_setup_colours()">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <button class="btn primary continue" onclick="_setup_end()">
                ${tl(trans.next)}
            </button>
        `);

        display_colour_presets();
        refresh_all(page.structure.setup_content);
    }, page.state.trans);
}

unsafeWindow._setup_end = function() {
    page.structure.setup.setAttribute('data-page', 'end');
    page.structure.setup.setAttribute('data-animating', 'true');
    setTimeout(function() {
        page.structure.setup.setAttribute('data-animating', 'false');
        render(page.structure.setup_content, html`
            <p>${{html: tl(trans.setup_end).replace('{a}', `<a href="${root}bleh">`).replace('{/a}', '</a>')}}</p>
        `);
        page.structure.setup_footer.innerHTML = (`
            <button class="see-more cancel" onclick="_setup_music()">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <a class="btn primary continue" href="${root}user/${auth.name}">
                ${tl(trans.finish)}
            </a>
        `);
    }, page.state.trans);
}


/**
     * notify user if new update and stores in localStorage for next time
     * @returns if first-time installing, redirect to setup
     */
export function notify_if_new_update() {
    let last_version_used = localStorage.getItem('bleh_last_version_used') || '';

    // enter first-time setup
    if (last_version_used == '') {
        window.location.href = `${root}bleh/setup`;
        localStorage.setItem('bleh_last_version_used', version.build);
        register_activity('install_bleh', [], `${root}bleh`);
        return;
    }

    // otherwise, it's a usual update
    if (last_version_used != version.build) {
        notify({
            title: trans_legacy.en.messaging.update.replace('{v}', `${version.build}.${version.sku}`),
            persist: true,
            icon: 'icon-16-download'
        });
        register_activity('update_bleh', [{name: version.build, type: 'bleh'}], `${root}bleh`);
        localStorage.setItem('bleh_last_version_used', version.build);

        request_changelog();
    }
}
