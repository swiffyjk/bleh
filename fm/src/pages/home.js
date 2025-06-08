//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {render_activity_list} from "../activity"
import {settings} from "../build/config";
import {log} from "../build/log";
import {auth, page, root} from "../build/page";
import {tl, trans, trans_legacy} from "../build/trans";
import {checkup_page_structure} from "../components/structure";
import {register_background, update_page} from "../page";
import {bleh_charts} from "./chart";
import {bleh_native_settings} from './lastfm_settings';
import {html, render} from "lighterhtml";

export function bleh_home() {
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


    let banner = document.createElement('div');
    banner.classList.add('top-banner', 'home-banner', 'colourful');

    let hour = new Date().getHours();
    let time;
    if (hour >= 22 || hour <= 6)
        time = 'night';
    else if (hour >= 7 && hour <= 10)
        time = 'morning';
    else if (hour >= 11 && hour <= 18)
        time = 'afternoon';
    else
        time = 'evening';
    log(`hour ${hour} time ${time}`, 'time');

    banner.innerHTML = (`
        <div class="avatar">
            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
            ${(auth.sponsor) ? (`
            <span class="avatar-status-dot user-status--bleh-sponsor"></span>
            `) : ''}
        </div>
        <h1>${tl(trans[`good_${time}_user`]).replace('{user}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)}</h1>
    `);

    page.structure.container.insertBefore(banner, page.structure.container.firstElementChild);

    let nav = document.createElement('nav');
    nav.classList.add('navlist', 'secondary-nav', 'navlist--more', 'redesigned-navigation');
    nav.innerHTML = (`
        <ul class="navlist-items">
            <li class="navlist-item secondary-nav-item secondary-nav-item--home">
                <a href="${root}music" class="secondary-nav-item-link ${(page.subpage == 'music') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.home)}<div class="new-badge">${tl(trans.beta)}</div>
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--recommendations">
                <a href="${root}music/+recommended" class="secondary-nav-item-link ${(page.type == 'recommended') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.recommendations)}<div class="new-badge">${tl(trans.beta)}</div>
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--releases">
                <a href="${root}music/+releases/out-now" class="secondary-nav-item-link ${(page.type == 'releases') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.releases)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--events dont-rearrange">
                <a href="${root}events" class="secondary-nav-item-link ${(page.type == 'events') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.events)}<div class="new-badge">${tl(trans.beta)}</div>
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--bookmarks">
                <a href="${root}music/+bookmarks" class="secondary-nav-item-link ${(page.type == 'bookmarks') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.bookmarks)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--charts">
                <a href="${root}charts" class="secondary-nav-item-link ${(page.type == 'charts') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.charts)}
                </a>
            </li>
            <li class="fill"></li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--settings">
                <a href="${root}settings" class="secondary-nav-item-link ${(page.type == 'settings') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.settings)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--bleh">
                <a href="${root}bleh" class="secondary-nav-item-link ${(page.type == 'error') ? 'secondary-nav-item-link--active' : ''}">
                    ${tl(trans.settings)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item secondary-nav-item--more">
                <a class="secondary-nav-item-link no-text">
                    ${tl(trans.more)}
                </a>
            </li>
        </ul>
    `);

    page.structure.nav = nav;
    banner.after(nav);

    if (page.type == 'charts')
        bleh_charts();

    if (page.type == 'settings')
        bleh_native_settings();

    let menu_button = nav.querySelector('.secondary-nav-item--more a');
    tippy(menu_button, {
        theme: "menu",
        content: html.node`
            <button class="dropdown-menu-clickable-item update" onclick="_force_refresh_theme()">
                ${trans_legacy.en.settings.home.update.update_now}
            </button>
            ${(settings.dev ? html.node`
            <a class="dropdown-menu-clickable-item update" href="https://github.com/katelyynn/bleh/raw/uwu/fm/bleh.user.css">
                ${trans_legacy.en.settings.home.update.css}
            </a>
            ` : '')}
            <button class="dropdown-menu-clickable-item sponsor" onclick="_sponsor()">
                ${tl(trans.sponsor)}
            </button>
            <a class="dropdown-menu-clickable-item issues" href="https://github.com/katelyynn/bleh/issues" target="_blank">
                ${trans_legacy.en.settings.home.issues.name}
            </a>
        `,
        placement: "bottom",
        interactive: true,
        interactiveBorder: 10,
        trigger: "click",

        onShow(instance) {
            instance.popper.addEventListener('click', event => {
                instance.hide();
            });
        }
    });


    if (page.subpage == 'music') {
        // top panel
        let beret = html.node`
            <section class="beret-music bleh--panel">
                <div class="panel-side panel-side-main">
                    <h4>${tl(trans.recent_tracks)}</h4>
                    <div class="recent-listening-container">
                        <div class="loading-data-container">
                            <p class="loading-data-text">${tl(trans.finding_your_tracks)}</p>
                        </div>
                    </div>
                </div>
                <div class="panel-side panel-side-alt">
                    <h4>${tl(trans.activity)}</h4>
                    ${render_activity_list()}
                    <div class="more-link">
                        <a href="${root}bleh?tab=profiles&setting=activities">${tl(trans.activity_settings)}</a>
                    </div>
                </div>
            </section>
        `;

        let track_list = beret.querySelector('.recent-listening-container');

        fetch(`${root}user/${auth.name}/partial/recenttracks?ajax=1`)
        .then(function(response) {
            console.log('returned', response, response.text);

            return response.text();
        })
        .then(function(html) {
            let doc = new DOMParser().parseFromString(html, 'text/html');
            console.log('DOC', doc);

            let tracklist_panel = doc.querySelector('.chartlist');

            if (tracklist_panel)
                track_list.outerHTML = tracklist_panel.outerHTML;
        });

        page.structure.main.appendChild(beret);


        let music_sections = document.body.querySelectorAll('.music-section');
        music_sections.forEach((music_section) => {
            page.structure.main.appendChild(music_section);
        });
    } else if (page.type == 'releases') {
        let content = page.structure.main.querySelectorAll(':scope > *');
        let panel = html.node`
            <section class="releases-panel" />
        `;

        content.forEach((element) => {
            panel.appendChild(element);
        });

        render(page.structure.main, panel);
    }
}

export function bleh_home_legacy() {
    window.location.href = `${root}music`;
}
