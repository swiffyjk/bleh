//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings} from "../build/config";
import {log} from "../build/log";
import {page} from "../build/page";
import {correct_artist, correct_item_by_artist} from "../components/lotus";
import {checkup_page_structure} from "../components/structure";
import {patch_titles} from "../components/track";
import {update_page} from "../page";

export function bleh_search() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    let content_top = document.body.querySelector('.content-top');


    let search_form = page.structure.main.querySelector('.search-form');
    let search = search_form.querySelector('#site-search');
    let value = search.getAttribute('value');

    let site_search = document.body.querySelector('#masthead-search-field');
    site_search.setAttribute('value', value);
    site_search.focus();
    page.structure.main.removeChild(search_form);

    page.name = (value != '') ? value : 'empty..';


    checkup_page_structure(false, content_top);
    log('status is', 'page', 'info', page);
    update_page();


    if (page.subpage != 'overview') {
        let new_panel = document.createElement('section');
        new_panel.classList.add('search-results-panel');

        let elements = page.structure.main.querySelectorAll(':scope > *:not(form)');
        elements.forEach((element) => {
            new_panel.appendChild(element);
        });

        page.structure.main.appendChild(new_panel);
    }

    if (page.subpage == 'overview' || page.subpage == 'tracks') {
        patch_titles();
    }

    if (page.subpage == 'artists' && settings.corrections) {
        let artists = page.structure.main.querySelectorAll('.artist-result-heading a');
        artists.forEach((artist) => {
            artist.textContent = correct_artist(artist.textContent);
        });
    }

    if (page.subpage == 'albums') {
        let results = page.structure.main.querySelectorAll('.album-result-inner');
        results.forEach((result) => {
            let heading = result.querySelector('.album-result-heading a');
            let artist_parent = result.querySelector('.album-result-artist');
            let artist = artist_parent.querySelector('a');

            artist.textContent = correct_artist(artist.textContent);

            heading.textContent = correct_item_by_artist(heading.textContent, artist.textContent);

            // match artists
            let image = result.querySelector('.album-result-image');
            let image_parent = document.createElement('span');
            image_parent.classList.add('avatar', 'album-result-image');
            image_parent.appendChild(image);

            image.classList = [];

            artist_parent.after(image_parent);
        });
    }
}
