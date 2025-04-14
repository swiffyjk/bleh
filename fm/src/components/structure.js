import { log } from "../build/log";
import { page } from "../build/page";
import { load_chart_colours } from "../chart";
import { ff } from "../sku";

export function basic_page_structure() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure();
}

// general health
export function checkup_page_structure(is_subpage = false, header = null) {
    if (document.body.style.getPropertyValue('--hue-album')) {
        document.body.style.removeProperty('--hue-album');
        document.body.style.removeProperty('--sat-album');
        load_chart_colours();
    }

    let params = new URLSearchParams(document.location.search);
    page.requested.tab = params.get('tab');
    page.requested.page = params.get('page');

    if (!page.structure.container || !document.body.contains(page.structure.container)) {
        log('page missing container, creating', 'page structure');
        page.structure.container = document.createElement('div');
        page.structure.container.classList.add('page-content', 'container');

        // listening report error
        let container_full_width = document.body.querySelector('.container--full-width');
        if (container_full_width)
            container_full_width.insertBefore(page.structure.container, container_full_width.firstElementChild);
        else
            document.body.querySelector('.adaptive-skin-container').appendChild(page.structure.container);
    }

    page.structure.container.setAttribute('data-assigned', 'true');

    let other_container = document.body.querySelector('.page-content.container:not([data-assigned])');
    if (other_container) other_container.style.setProperty('display', 'none');

    if (!page.structure.row || !document.body.contains(page.structure.row)) {
        log('page missing row, creating', 'page structure');
        page.structure.row = document.createElement('div');
        page.structure.row.classList.add('row');

        page.structure.container.insertBefore(page.structure.row, page.structure.container.firstElementChild);
    }
    if (page.structure.row.classList.contains('buffer-4'))
        page.structure.row.classList = 'row col-main-is-primary';

    if (!page.structure.main || !document.body.contains(page.structure.main)) {
        log('page missing main, creating', 'page structure');
        page.structure.main = document.createElement('div');
        page.structure.main.classList.add('col-main');

        page.structure.row.appendChild(page.structure.main);
    }

    page.structure.main.setAttribute('data-assigned', 'true');

    let other_main = page.structure.row.querySelector('.col-main.hidden-xs:not([data-assigned])');
    if (other_main) other_main.style.setProperty('display', 'none');

    if (!page.structure.side || !document.body.contains(page.structure.side)) {
        log('page missing side', 'page structure');
        // check first if another sidebar exists
        page.structure.side = page.structure.row.querySelector('.col-sidebar');

        if (!page.structure.side) {
            log('page missing side, creating', 'page structure');

            // otherwise, make anew
            page.structure.side = document.createElement('div');
            page.structure.side.classList.add('col-sidebar');

            page.structure.row.appendChild(page.structure.side);
        }
    }

    log('finished', 'page structure');

    if (ff('refreshed_music_nav') && header) {
        let navlist = header.querySelector('.navlist');

        if (navlist) {
            navlist.classList.add('redesigned-navigation');
            page.structure.container.insertBefore(navlist, page.structure.container.firstElementChild);
            page.structure.nav = navlist;
        }

        if (is_subpage) {
            let content_top = document.body.querySelector('.content-top');

            if (content_top) {
                content_top.classList.add('redesigned-content-top');
                page.structure.content_top = content_top;
                navlist.after(content_top);

                // should be covered by bleh
                if (content_top.querySelector('.content-top-back-link'))
                    content_top.style.setProperty('display', 'none');
            } else {
                let subpage_title = page.structure.main.querySelector(':scope > .subpage-title');
                if (!subpage_title)
                    subpage_title = page.structure.main.querySelector(':scope > .section-controls > .subpage-title');
                if (!subpage_title)
                    subpage_title = page.structure.main.querySelector(':scope > section:first-child .section-controls > .subpage-title');

                if (subpage_title) {
                    content_top = document.createElement('div');
                    content_top.classList.add('content-top', 'redesigned-content-top');

                    content_top.innerHTML = (`
                        <div class="content-top-inner-wrap">
                            <div class="container content-top-lower">
                                <h1 class="content-top-header">${subpage_title.textContent.trim()}</h1>
                            </div>
                        </div>
                    `);

                    page.structure.content_top = content_top;
                    navlist.after(content_top);

                    try {
                        page.structure.main.removeChild(subpage_title);
                    } catch(e) {}
                }

                // is there another navlist?
                navlist = page.structure.main.querySelector('.navlist');

                if (navlist) {
                    navlist.classList.add('redesigned-navigation');

                    if (page.structure.content_top)
                        page.structure.content_top.after(navlist);
                    else
                        page.structure.container.insertBefore(navlist, page.structure.row);
                }

                // is there a btn-add?
                let btn_add = page.structure.main.querySelector(':scope > .btn-add');
                if (!btn_add) btn_add = page.structure.main.querySelector(':scope > section:first-child .btn-add');

                if (btn_add) {
                    btn_add.classList = 'btn view-all-button back add-button';

                    let add_panel = document.createElement('section');
                    add_panel.classList.add('view-all-panel');

                    add_panel.appendChild(btn_add);
                    page.structure.side.insertBefore(add_panel, page.structure.side.firstElementChild);
                }


                // is there a playlink?
                let playlink = page.structure.main.querySelector(':scope > .section-controls > .section-playlink');

                if (playlink) {
                    playlink.classList.add('btn', 'view-all-button', 'back', 'play-button');

                    let playlink_panel = document.createElement('section');
                    playlink_panel.classList.add('view-all-panel');

                    playlink_panel.appendChild(playlink);
                    page.structure.side.insertBefore(playlink_panel, page.structure.side.firstElementChild);
                }
            }
        } else {
            let content_top = document.body.querySelector('.content-top');

            if (content_top) content_top.classList.add('legacy-content-top');
        }
    }
}