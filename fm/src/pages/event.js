import { patch_avatar } from "../avatar";
import { settings } from "../build/config";
import { log } from "../build/log";
import { auth, page, root } from "../build/page";
import { clean_number } from "../build/tools";
import { lang, trans_legacy, trans, tl } from "../build/trans";
import { correct_artist } from "../components/lotus";
import { checkup_page_structure } from "../components/structure";
import { refresh_all } from "../config";
import { register_background, update_page } from "../page";
import { bleh_home } from './home';

export function bleh_events() {
    if (page.subpage == 'overview') {
        // not an individual event
        bleh_events_home();
        return;
    }

    let is_subpage = page.subpage != 'event_overview';

    // without pro theres two containers
    if (auth.pro) {
        // pro

        page.structure.container = document.body.querySelector('.page-content');
    } else {
        // not pro

        if (!is_subpage)
            page.structure.container = document.body.querySelector('.page-content:not(header + .page-content)');
        else
            page.structure.container = document.body.querySelector('.page-content');
    }
    page.structure.row = page.structure.container.querySelector('.row');
    try {
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    let event_header = document.body.querySelector('header');

    checkup_page_structure(is_subpage, event_header);

    if (page.subpage.startsWith('event_edit')) {
        bleh_events_edit();
        return;
    } else if (page.subpage.startsWith('add')) {
        bleh_events_create();
        return;
    }

    page.name = '';
    page.sister = event_header.querySelector('.header-title').textContent.trim();


    let event_description = event_header.querySelector('.header-title-secondary');
    if (settings.corrections) {
        let links = event_description.querySelectorAll('a');
        links.forEach((link) => {
            link.textContent = correct_artist(link.textContent);
        });
    }

    let redesigned_event_header = document.createElement('section');
    redesigned_event_header.classList.add('redesigned-header', 'redesigned-event-header', 'no-background');
    redesigned_event_header.innerHTML = (`
        <div class="calendar-side">
            <div class="calendar">
                ${event_header.querySelector('.calendar-icon').innerHTML}
            </div>
        </div>
        <div class="info-side">
            <div class="sub-text">${trans_legacy[lang].event.name}</div>
            <h1>${page.sister}</h1>
            <p class="sub-info">${event_description.innerHTML}</p>
        </div>
    `);

    let background = document.body.querySelector('.header-background--has-image');
    if (background != null)
        register_background(background.style.getPropertyValue('background-image').replace('url("', '').replace('")', ''));

    page.structure.container.insertBefore(redesigned_event_header, page.structure.container.firstElementChild);
    document.body.querySelector('.header').classList.add('legacy-header');


    if (!is_subpage) {
        let header_meta = document.body.querySelector('.header-metadata');
        header_meta.classList.add('profile-header-metadata-legacy');

        // acquire info
        let metadata = header_meta.querySelectorAll('.header-metadata-display');

        let going = 0;
        let maybe = 0;

        metadata.forEach((item, index) => {
            let para = item.querySelector('p');
            if (index == 0) {
                going = clean_number(para.textContent.trim());
            } else if (index == 1) {
                maybe = clean_number(item.textContent.trim());
            }
        });


        // create new
        let event_top_header = document.createElement('div');
        event_top_header.classList.add('view-buttons', 'event-top-header');

        let form = document.body.querySelector('.attendance-control');
        let buttons = form.querySelectorAll('button');
        buttons.forEach((button) => {
            button.classList.add('btn', 'event-top-item', 'view-item');
        });

        event_top_header.appendChild(form);


        let main_panel = page.structure.main.querySelector('.event-summary-with-poster');
        if (main_panel == null)
            main_panel = page.structure.main.querySelector('.event-details');

        main_panel.insertBefore(event_top_header, main_panel.firstElementChild);
        console.info('event top header', event_top_header);




        // move poster
        let poster = main_panel.querySelector('.event-poster-preview');
        let poster_panel;
        if (poster != null) {
            poster_panel = document.createElement('section');
            poster_panel.classList.add('poster-panel', 'view-all-panel');

            poster_panel.innerHTML = (`${poster.outerHTML}<a onclick="_expand_avatar('${poster.getAttribute('src').replace('/arXL/', '/ar0/')}')" class="bleh--avatar-clickable-link"></a>`);

            page.structure.side.insertBefore(poster_panel, page.structure.side.firstElementChild);
        }




        // edit button
        let edit_button = main_panel.querySelector('.event-metadata + .event-metadata a');
        if (edit_button != null) {
            edit_button.classList.add('btn', 'view-all-button', 'back', 'edit-event-button');

            let edit_panel = document.createElement('section');
            edit_panel.classList.add('view-all-panel');

            edit_panel.appendChild(edit_button);
            if (poster != null)
                poster_panel.after(edit_panel);
            else
                page.structure.side.insertBefore(edit_panel, page.structure.side.firstElementChild);
        }




        // attendees
        let users = page.structure.main.querySelectorAll('.attendee-summary-user-inner-wrap');
        users.forEach((user) => {
            let avatar = user.querySelector('.attendee-summary-user-avatar');
            let name = user.querySelector('.attendee-summary-user-link').textContent;

            patch_avatar(avatar, name, 'event');
        });
    } else {
        if (page.subpage == 'event_attendance_going' || page.subpage == 'event_attendance_interested') {
            // view-related buttons
            let view_buttons = document.createElement('div');
            view_buttons.classList.add('view-buttons-wrapper');
            view_buttons.innerHTML = (`
                <div class="view-buttons">
                    <button class="btn view-item" id="toggle-list_view-1" data-toggle="list_view" data-toggle-value="1" onclick="_update_item('list_view', 1)">
                        ${trans_legacy[lang].glacier.view.grid}
                    </button>
                    <button class="btn view-item" id="toggle-list_view-0" data-toggle="list_view" data-toggle-value="0" onclick="_update_item('list_view', 0)">
                        ${trans_legacy[lang].glacier.view.list}
                    </button>
                </div>
            `);
            page.structure.row.classList.add('force-col-main-primary');
            page.structure.main.classList.add('primary-column');
            page.structure.main.insertBefore(view_buttons, page.structure.main.firstChild);

            refresh_all();


            // users
            let users = page.structure.main.querySelectorAll('.user-list-inner-wrap');
            users.forEach((user) => {
                let avatar = user.querySelector('.user-list-avatar');
                let name = user.querySelector('.user-list-link').textContent;

                let badge = patch_avatar(avatar, name, 'follow');

                if (badge.type == 'avatar-status-dot--staff')
                    user.classList.add('staff-user');
            });
        }
    }

    log('status is', 'page', 'info', page);
    update_page();
}

function bleh_events_manage() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    let content_top = document.body.querySelector('.content-top');
    let header_text = content_top.querySelector('.content-top-header').textContent;

    checkup_page_structure(false, content_top);
    log('status is', 'page', 'info', page);
    update_page();

    register_background(auth.avatar);

    page.structure.nav.classList.add('navlist--more');

    let edit_header = document.createElement('section');
    edit_header.classList.add('redesigned-header', 'event-manage-header', 'no-background');
    edit_header.innerHTML = (`
        <div class="tag-side">
            <div class="tag-icon event-icon"></div>
        </div>
        <div class="info-side">
            <div class="sub-text">${trans_legacy[lang].event.name}</div>
            <h1>${header_text}</h1>
        </div>
    `);

    page.structure.container.insertBefore(edit_header, page.structure.container.firstElementChild);
}

function bleh_events_create() {
    bleh_events_manage();
}

function bleh_events_edit() {
    bleh_events_manage();

    let back = document.body.querySelector('.content-top-back-link a');

    let nav = page.structure.nav.querySelector('ul');
    let back_nav = document.createElement('li');
    back_nav.classList.add('navlist-item', 'secondary-nav-item', 'secondary-nav-item--back');
    back_nav.innerHTML = (`
        <a class="secondary-nav-item-link" href="${back.getAttribute('href')}">
            ${trans_legacy[lang].settings.back}
        </a>
    `);

    nav.insertBefore(back_nav, nav.firstElementChild);
}

function bleh_events_home() {
    page.subpage = 'home';

    bleh_home();

    let filters = page.structure.container.querySelector('.events-filters');
    let panel = page.structure.main.querySelector('section');

    filters.classList = 'view-buttons';

    let buttons = filters.querySelectorAll('.events-filter > button');
    buttons.forEach((button) => {
        button.classList.add('btn', 'view-item');

        if (button.classList.contains('disclose-trigger')) {
            button.classList.remove('disclose-trigger');
            button.classList.add('select-button');
        }
    });

    panel.insertBefore(filters, panel.firstElementChild);

    page.structure.side.innerHTML = (`
        <section class="view-all-panel">
            <a class="btn view-all-button add-button" href="${root}events/add?reset=true">
                ${tl(trans.create_new_event)}
            </a>
        </section>
    `);
}