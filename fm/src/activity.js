//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "./build/config";
import {log} from "./build/log";
import {auth, page, recent_activity_list, root} from "./build/page";
import {sanitise, sanitise_text} from "./build/tools";
import {tl, trans} from './build/trans';
import {correct_artist, correct_item_by_artist, name_includes} from "./components/lotus";
import {html, render} from "lighterhtml";

export function render_activity_list() {
    load_activities();

    let activity_list = html.node`
        <div class="activity-list" />
    `;

    // we want to show in date order from latest to oldest down
    // but .reverse() is destructive, so we copy first
    let recent_activity_list_r = recent_activity_list;
    recent_activity_list_r.reverse();

    recent_activity_list_r.forEach((activity) => {
        // type: string,
        // involved: [{name: string, type: user | artist | album | track}, sister?: string],
        // context: string,
        // date: string

        let activity_item = document.createElement('a');
        activity_item.classList.add('activity-item', `activity--${activity.type}`);
        activity_item.setAttribute('href', activity.context);

        let involved_text = '';

        let tooltip_name;
        let tooltip_sister;

        activity.involved.forEach((involved) => {
            let involved_link;

            if (involved.type == 'user')
                involved_link = `${root}user/${involved.name}`;
            else if (involved.type == 'artist')
                involved_link = `${root}music/${sanitise(involved.name)}`;
            else if (involved.type == 'album')
                involved_link = `${root}music/${sanitise(involved.sister)}/${sanitise(involved.name)}`;
            else if (involved.type == 'track')
                involved_link = `${root}music/${sanitise(involved.sister)}/_/${sanitise(involved.name)}`;
            else if (involved.type == 'tag')
                involved_link = `${root}tag/${sanitise(involved.name)}`;
            else if (involved.type == 'bwaa')
                involved_link = `${root}bwaa`;
            else if (involved.type == 'bleh')
                involved_link = `${root}bleh`;

            let name = involved.name;
            let sister = involved.sister;

            // tooltip
            if (involved.type != 'artist' && involved.type != 'user' && involved.type != 'tag' && involved.type != 'bwaa' && involved.type != 'bleh') {
                tooltip_name = name;
                tooltip_sister = sister;
            }

            if (involved.type == 'track' && settings.format_guest_features) {
                let formatted_title = name_includes(name, sister);

                let song_title;
                let song_tags;
                if (formatted_title) {
                    song_title = formatted_title[0];
                    song_tags = formatted_title[1];
                    sister = formatted_title[2];
                    tooltip_name = song_title;
                    tooltip_sister = sister;
                }

                // combine
                name = html.node`
                    <div class="title">${sanitise_text(song_title).trim()}</div>
                    ${song_tags.map((tag) => html.node`
                        <div class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</div>
                    `)}
                `;
            } else if ((involved.type == 'album' || involved.type == 'track') && settings.corrections) {
                name = correct_item_by_artist(name, sister);
                tooltip_name = name;
                sister = correct_artist(sister);
                tooltip_sister = sister;
            } else if (involved.type == 'artist' && settings.corrections) {
                name = correct_artist(name);
            }

            if (involved_text != '')
                involved_text = html.node`${involved_text}, <a class="involved--${involved.type}" href="${involved_link}">${name}</a>`;
            else
                involved_text = html.node`${involved_text}<a class="involved--${involved.type}" href="${involved_link}">${name}</a>`;
        });

        render(activity_item, html`
            <div class="type">${tl(trans.activity.listing[activity.type])}<div class="date">${moment(activity.date).fromNow(true)}</div></div>
            <div class="name">${involved_text}</div>
        `);

        activity_list.appendChild(activity_item);

        if (tooltip_name)
            tippy(activity_item.querySelector('.name a'), {
                theme: 'name-sister-combo',
                content: html.node`
                    <span class="name">${tooltip_name}</span>
                    <span class="sister">${tooltip_sister}</span>
                `
            });
    });

    return activity_list;
}

export function subscribe_to_events() {
    if (!settings.activities)
        return;

    let love_track = document.body.querySelectorAll(`form[action$="${auth.name}/loved"]:not([data-bleh-subscribed])`);
    love_track.forEach((form) => {
        form.setAttribute('data-bleh-subscribed', 'true');

        let track = form.querySelector('[name="track"]').getAttribute('value');
        let artist = form.querySelector('[name="artist"]').getAttribute('value');

        artist = correct_artist(artist);
        track = correct_item_by_artist(track, artist);

        let btn = form.querySelector('button');

        btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            let action = btn.getAttribute('data-analytics-action');

            if (btn.getAttribute('data-type') == 'love') {
                setTimeout(function() {
                    if (!btn.querySelector('span')) {
                        let new_text = document.createElement('span');
                        new_text.textContent = tl(trans.love);
                        btn.appendChild(new_text);
                    }
                }, 1);
            }

            register_activity((action == 'LoveTrack') ? 'love' : 'unlove', [{name: track, type: 'track', sister: artist}], `${root}music/${sanitise(artist)}/_/${sanitise(track)}`);
        }, false);
    });


    let bookmark_item = document.body.querySelectorAll(`form[action="/music/+bookmarks"]:not([data-bleh-subscribed])`);
    bookmark_item.forEach((form) => {
        form.setAttribute('data-bleh-subscribed', 'true');

        let btn = form.querySelector('button');

        btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            let action = btn.getAttribute('data-analytics-action');

            register_activity((action.startsWith('Bookmark')) ? 'bookmark' : 'unbookmark', [{name: page.name, type: page.type, sister: page.sister}], window.location.href);
        }, false);
    });


    let obsess = document.body.querySelectorAll(`.modal-body form[action$="${auth.name}/obsessions"]:not([data-bleh-subscribed])`);
    obsess.forEach((form) => {
        form.setAttribute('data-bleh-subscribed', 'true');

        let track = form.querySelector('[name="name"]').getAttribute('value');
        let artist = form.querySelector('[name="artist_name"]').getAttribute('value');

        artist = correct_artist(artist);
        track = correct_item_by_artist(track, artist);

        let btn = form.querySelector('button');

        btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            register_activity('obsess', [{name: track, type: 'track', sister: artist}], window.location.href);
        }, false);
    });


    let post_shouts_btn = document.body.querySelector('.btn-post-shout:not([data-bleh-subscribed])');
    if (post_shouts_btn != null) {
        post_shouts_btn.setAttribute('data-bleh-subscribed', 'true');

        post_shouts_btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            // wait 0.15s
            window.setTimeout(function() {
                let actual_btn = event.target.parentElement;

                let is_loading = actual_btn.classList.contains('btn--loading');
                console.log('is button loading', is_loading, actual_btn, event.target);

                if (!is_loading) return;

                register_activity('shout', [{name: page.name, type: page.type, sister: page.sister}], window.location.href);
            }, 150);
        }, false);
    }


    let save_wiki_form = document.body.querySelector('.wiki-edit-form:not([data-bleh-subscribed])');
    if (save_wiki_form != null) {
        save_wiki_form.setAttribute('data-bleh-subscribed', 'true');

        let btn = save_wiki_form.querySelector('.form-submit button');

        btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            register_activity('wiki', [{name: page.name, type: page.type, sister: page.sister}], window.location.href);
        }, false);
    }


    let upload_img_form = document.body.querySelector('form[action$="/+images/upload"]:not([data-bleh-subscribed])');
    if (upload_img_form != null) {
        upload_img_form.setAttribute('data-bleh-subscribed', 'true');

        let btn = upload_img_form.querySelector('.form-submit button');

        btn.addEventListener('click', (event) => {
            log('heard', 'event', 'info', event);

            register_activity('image_upload', [{name: page.name, type: page.type, sister: page.sister}], window.location.href);
        }, false);
    }
}


export function load_activities() {
    if (!settings.activities)
        return;
    recent_activity_list.length = 0
    recent_activity_list.push(...(JSON.parse(localStorage.getItem('bwaa_recent_activity')) || []));
    log('loaded', 'activity', 'info', recent_activity_list);

    // check if over 10
    check_activities_length();

    log('saved', 'activity', 'info', recent_activity_list);
    localStorage.setItem('bwaa_recent_activity', JSON.stringify(recent_activity_list));
}

function check_activities_length() {
    if (recent_activity_list.length > 10) {
        let to_delete = recent_activity_list.length - 10;

        recent_activity_list.splice(0, to_delete);
        log(`reached maximum of 10, removed leftovers`, 'activity');
    }

    return recent_activity_list;
}

export function register_activity(type, involved, context, date=new Date()) {
    if (!settings.activities)
        return;

    if (type == 'shout') {
        if (!settings.activity_shout) return;
    } else if (type == 'image_upload' || type == 'image_star') {
        if (!settings.activity_image) return;
    } else if (type == 'obsess' || type == 'unobsess') {
        if (!settings.activity_obsess) return;
    } else if (type == 'love' || type == 'unlove') {
        if (!settings.activity_love) return;
    } else if (type == 'bookmark' || type == 'unbookmark') {
        if (!settings.activity_bookmark) return;
    } else if (type == 'install_bwaa' || type == 'update_bwaa' || type == 'install_bleh' || type == 'update_bleh') {
        if (!settings.activity_install) return;
    } else if (type == 'wiki') {
        if (!settings.wiki) return;
    }

    recent_activity_list.length = 0
    recent_activity_list.push(...(JSON.parse(localStorage.getItem('bwaa_recent_activity')) || []));

    log('loaded', 'activity', 'info', recent_activity_list);

    recent_activity_list.push({
        type: type,
        involved: involved,
        context: context,
        date: date
    });

    log('registered new', 'activity', 'info', {
        type: type,
        involved: involved,
        context: context,
        date: date
    });

    // check if over 10
    check_activities_length();

    log('saved', 'activity', 'info', recent_activity_list);
    localStorage.setItem('bwaa_recent_activity', JSON.stringify(recent_activity_list));
}

