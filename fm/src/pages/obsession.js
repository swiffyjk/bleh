import { patch_avatar } from "../avatar";
import { settings } from '../build/config';
import { log } from '../build/log';
import { artist_corrections } from '../build/music';
import { auth, page, root } from '../build/page';
import { clamp_sat, rgb_to_hsl, sanitise, sanitise_text } from '../build/tools';
import { lang, tl, trans, trans_legacy } from '../build/trans';
import { correct_item_by_artist, name_includes } from '../components/lotus';
import { register_menu } from '../components/menu';
import { checkup_page_structure } from '../components/structure';
import { register_background, update_page } from '../page';

export function patch_obsession_view() {
    let obsession_container = document.querySelector('.obsession-container');
    if (!obsession_container) return;

    page.structure.container = document.body.querySelector('.page-content:not(.obsession-container .page-content)');
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


    let background = obsession_container.querySelector('.obsession-background-inner');
    background = background.style.getPropertyValue('background-image').replace('url("', '').replace('")', '');

    if (!background.endsWith('/4128a6eb29f94943c9d206c08e625904.jpg')) {
        register_background(background);

        try {
            let bg = obsession_container.style.getPropertyValue('background').replace('rgb(', '').replace(')', '').split(', ');
            let hsl = rgb_to_hsl(parseInt(bg[0]), parseInt(bg[1]), parseInt(bg[2]));
            document.body.style.setProperty('--hue-album', hsl.h);
            document.body.style.setProperty('--sat-album', clamp_sat((hsl.s / 100) * 3));
            document.body.style.setProperty('--lit-album', (hsl.l / 100) + 0.35);

            log(`sourced hsl of (${hsl.h}, ${hsl.s}, ${hsl.l}) - using final value of (${hsl.h}, ${clamp_sat((hsl.s / 100) * 3)}, ${(hsl.l / 100) + 0.35})`, 'hue from album');
        } catch(e) {
            console.error(e);
            log('no cover present', 'hue from album');
        }
    } else {
        register_background('');
    }


    let track_title = obsession_container.querySelector('.obsession-meta-track');
    let track_artist = obsession_container.querySelector('.obsession-meta-artist');
    let scrobbles = obsession_container.querySelector('.obsession-meta-scrobbles');

    let link = track_title.querySelector('a').getAttribute('href');

    let by = track_artist.querySelector('.obsession-meta-artist-by');
    track_artist.removeChild(by);

    // correct artist
    let artist_name = track_artist.querySelector('a');
    if (artist_corrections.hasOwnProperty(artist_name.textContent)) {
        let corrected_artist = artist_corrections[artist_name.textContent];
        log(`corrected ${artist_name.textContent} as ${corrected_artist}`, 'lotus');
        artist_name.textContent = corrected_artist;
    }

    artist_name.classList.add('header-new-crumb');

    if (settings.format_guest_features) {
        let formatted_title = name_includes(track_title.textContent.trim(), artist_name.textContent);
        let song_title = formatted_title[0];
        let song_tags = formatted_title[1];

        page.corrected = formatted_title[4];

        // parse tags into text
        let song_tags_text = '';
        for (let song_tag in song_tags) {
            song_tags_text = `${song_tags_text}<div class="feat" data-bleh--tag-type="${song_tags[song_tag].type}" data-bleh--tag-group="${song_tags[song_tag].group}">${song_tags[song_tag].text}</div>`;
        }

        // combine
        track_title.innerHTML = `<div class="title">${sanitise_text(song_title).trim()}</div>${song_tags_text}`;

        let song_guests = formatted_title[3];
        page.sister_others = formatted_title[3];
        for (let guest in song_guests) {
            // &
            track_artist.innerHTML = `${track_artist.innerHTML},`;

            let guest_element = document.createElement('a');
            guest_element.classList.add('header-new-crumb');
            guest_element.setAttribute('href', `${root}music/${sanitise(song_guests[guest])}`);
            guest_element.textContent = song_guests[guest];

            track_artist.appendChild(guest_element);
        }
    } else {
        if (!track_title.hasAttribute('data-kate-processed')) {
            track_title.setAttribute('data-kate-processed','true');

            let corrected_title = correct_item_by_artist(track_title.textContent.trim(), artist_name.textContent);
            log(`corrected ${track_title.textContent} by ${artist_name.textContent} as ${corrected_title}`, 'lotus');

            if (corrected_title != track_title.textContent)
                page.corrected = true;

            track_title.textContent = corrected_title;
        }
    }

    let redesigned_track_header = document.createElement('section');
    redesigned_track_header.classList.add('redesigned-header', 'redesigned-track-header', 'no-background', 'obsession-track-header');
    redesigned_track_header.innerHTML = (`
        <!--<div class="avatar-side">
            <img src="${background.replace('/ar0/', '/avatar170s/')}">
            <a class="bleh--avatar-clickable-link"></a>
        </div>-->
        <div class="info-side">
            <div class="sub-text">${tl(trans.obsession)}</div>
            <div class="title-container">
                <h1><a href="${link}">${track_title.innerHTML}</a></h1>
            </div>
            <h2>${track_artist.innerHTML}</h2>
        </div>
    `);

    page.structure.container.insertBefore(redesigned_track_header, page.structure.container.firstElementChild);

    let video = obsession_container.querySelector('.obsession-video-container');
    if (video)
        redesigned_track_header.after(video);


    /*let avatar_side = redesigned_track_header.querySelector('.avatar-side');
    let avatar_link = avatar_side.querySelector('a');

    let expand_link = `_expand_avatar('${background}')`;
    avatar_link.setAttribute('onclick', expand_link);

    let menu = tippy(avatar_side, {
        theme: 'context-menu',
        content: (`
            <button class="dropdown-menu-clickable-item" onclick="${expand_link}" data-menu-item="expand">
                ${trans_legacy[lang].gallery.open.name}
            </button>
            <div class="sep"></div>
            <a class="dropdown-menu-clickable-item" href="${root}bleh?tab=customise" data-menu-item="settings">
                ${trans_legacy[lang].settings.configure}
            </a>
        `),
        allowHTML: true,
        placement: 'right-start',
        trigger: 'manual',
        interactive: true,
        interactiveBorder: 10,
        offset: [0, 0],

        onShow(instance) {
            instance.popper.addEventListener('click', event => {
                instance.hide();
            });
        }
    });

    register_menu(avatar_side, menu);*/


    let quote = document.createElement('section');
    quote.classList.add('obsession-quote');

    // remove quotations
    let obsession_reason = obsession_container.querySelector('.obsession-reason');
    if (obsession_reason) {
        let obsession_reason_text = obsession_reason.textContent;
        obsession_reason.textContent = obsession_reason_text.trim().substr(1).slice(0, -1);
    }

    let obsession_author = document.querySelector('.obsession-details-intro a').textContent;
    let obsession_avatar = document.querySelector('.obsession-details-intro-avatar-wrap .avatar');

    page.name = obsession_author;

    let date = obsession_container.querySelector('.obsession-details-date-short')

    quote.innerHTML = (`
        ${(obsession_reason) ? (`
        <div class="quote">
            ${obsession_reason.textContent}
        </div>
        `) : (`
        <div class="quote no-quote">
            ${tl(trans.no_quote)}
        </div>
        `)}
        <div class="sub-text">
            <div class="obsession-author">
                ${obsession_avatar.outerHTML}
                <strong class="name">${obsession_author}</strong>
                <a class="link-block-cover-link" href="${root}user/${obsession_author}"></a>
            </div>
            ${(scrobbles) ? (`
            <div class="obsession-listens">
                ${scrobbles.innerHTML}
            </div>
            `) : ''}
            <div class="obsession-date">
                ${date.textContent}
            </div>
        </div>
    `);

    let manage = obsession_container.querySelector('form');
    if (manage) {
        quote.appendChild(manage);
        quote.querySelector('button').textContent = tl(trans.delete);
    }

    page.structure.main.insertBefore(quote, page.structure.main.firstElementChild);

    let author = quote.querySelector('.obsession-author');
    let badge = patch_avatar(obsession_avatar, obsession_author, '', author, 'bottom');

    if (badge.type) {
        author.classList.add('colourful');
        author.classList.add(`user-status--bleh-${badge.type}`, `user-status--bleh-user-${obsession_author}`);
    }

    let related = document.createElement('section');
    related.classList.add('obsession-related');

    let other_tracks = document.body.querySelector('.other-obsessions');

    if (other_tracks) {
        let header = document.createElement('h2');
        header.textContent = tl(trans.others_from_profile).replace('{user}', obsession_author);
        related.appendChild(header);

        let see_more = other_tracks.nextElementSibling;

        related.appendChild(other_tracks);

        if (see_more) {
            let more = document.createElement('div');
            more.classList.add('more-link-fullwidth-right');
            more.appendChild(see_more.querySelector('a'));
            related.appendChild(more);
        }
    }

    let shared_users = document.body.querySelector('.fellow-obsessors');

    if (shared_users) {
        if (other_tracks) {
            let sep = document.createElement('div');
            sep.classList.add('sep');
            related.appendChild(sep);
        }

        let header = document.createElement('h2');
        header.textContent = tl(trans.shared_with_others);
        related.appendChild(header);

        let users = shared_users.querySelectorAll('.avatar');
        users.forEach((user) => {
            let name = user.querySelector('img').getAttribute('alt');
            patch_avatar(user, name);
        });

        related.appendChild(shared_users);
    }

    quote.after(related);


    let pages = obsession_container.querySelector('.obsession-pagination');
    if (pages)
        page.structure.container.appendChild(pages);
}