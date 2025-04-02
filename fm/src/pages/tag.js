import { log } from "../build/log";
import { page } from "../build/page";
import { desanitise } from "../build/tools";
import { lang, trans } from "../build/trans";
import { patch_header_title } from "../components/lotus";
import { checkup_page_structure } from "../components/structure";
import { register_background, update_page } from "../page";
import { ff } from "../sku";

export function bleh_tags() {
    let tag_header = document.body.querySelector('.header--tag');

    if (tag_header == undefined)
        return;

    if (tag_header.hasAttribute('data-bwaa'))
        return;
    tag_header.setAttribute('data-bwaa', 'true');

    patch_header_title();

    page.name = tag_header.querySelector('.header-title').textContent.trim();

    let is_subpage = tag_header.classList.contains('header--sub-page');


    page.structure.container = document.body.querySelector('.page-content');
    page.structure.row = page.structure.container.querySelector('.row');
    try {
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure(is_subpage, tag_header);

    if (ff('refreshed_music_nav')) {
        let split = window.location.href.split('/');

        /* languages */
        let index = 4;
        if (split[3] != 'tag')
            index = 5;

        let title = desanitise(split[index]);

        let redesigned_tag_header = document.createElement('section');
        redesigned_tag_header.classList.add('redesigned-header', 'redesigned-tag-header', 'no-background');
        redesigned_tag_header.innerHTML = (`
            <div class="tag-side">
                <div class="tag-icon"></div>
            </div>
            <div class="info-side">
                <div class="sub-text">${trans[lang].tag.name}</div>
                <h1>${title}</h1>
            </div>
        `);

        let background = document.body.querySelector('.header-background--has-image');
        if (background != null)
            register_background(background.style.getPropertyValue('background-image').replace('url("', '').replace('")', ''));

        page.structure.container.insertBefore(redesigned_tag_header, page.structure.container.firstElementChild);
        tag_header.classList.add('legacy-header');
    }

    if (!is_subpage) {
        //
    } else {
        if (page.subpage == 'wiki_overview')
            bleh_wiki();
        else if (page.subpage == 'wiki_history')
            bleh_wiki_history();
        else if (page.subpage == 'wiki_edit')
            bleh_wiki_editor();
    }

    log('status is', 'page', 'info', page);
    update_page();
}


export function bleh_tags_mini() {
    let tag_user_avatar = page.structure.main.querySelector('.tags-user-avatar');

    if (!tag_user_avatar)
        return;

    let tags_list = tag_user_avatar.nextElementSibling;
    let tags = tags_list.querySelectorAll('.tag a');
    tags.forEach((tag) => {
        tag.classList.add('user-created-tag');
    });
}