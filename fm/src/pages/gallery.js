import { expand_avatar } from "../avatar";
import { log } from "../build/log";
import { page, root } from "../build/page";
import { trans_legacy, trans, tl } from "../build/trans";
import { register_menu } from "../components/menu";
import { ff } from "../sku";

export function bleh_gallery() {
    if (page.subpage != 'image')
        return;

    log('focusing on image', 'gallery');

    let image_sidebar = page.structure.side.querySelector('.js-gallery-image-details > div');
    if (!image_sidebar) return;

    if (image_sidebar.hasAttribute('data-bleh-gallery'))
        return;
    image_sidebar.setAttribute('data-bleh-gallery', 'true');

    if (!ff('new_gallery_experience')) {
        patch_gallery_focused_image(image_sidebar, page.structure.container.querySelector('.gallery-image-buttons'));
        return;
    }

    // move image to its own spot above
    let image_details;
    let gallery_section;
    try {
        gallery_section = page.structure.main.querySelector('.gallery-section');
        if (gallery_section) {
            page.structure.nav.after(gallery_section);

            // move image details to main column
            image_details = document.createElement('section');
            image_details.classList.add('image-details');
        } else {
            image_details = page.structure.main.querySelector('.image-details');
            image_details.innerHTML = '';
        }
    } catch(e) {
        gallery_section = page.structure.container.querySelector('.gallery-section');

        image_details = page.structure.main.querySelector('.image-details');
        image_details.innerHTML = '';
    }
    image_details.appendChild(image_sidebar);

    // top title
    let image_title = image_details.querySelector('.gallery-image-title');
    let image_date = image_details.querySelector('.gallery-image-uploaded-by');

    if (image_title.textContent.trim() == '') {
        image_title.classList.add('gallery-image-title-empty');
        image_title.textContent = trans_legacy.en.gallery.empty.title;
    }

    let breadcrumbs = document.body.querySelector('.content-top-lower-row');
    let breadcrumb_root = breadcrumbs.querySelector('a');
    let breadcrumb_name = breadcrumbs.querySelector('.subpage-title');

    let image_title_container = document.createElement('div');
    image_title_container.classList.add('image-title-container');
    image_title_container.innerHTML = (`
        <div class="sub-text">
            <div class="breadcrumb">
                ${breadcrumb_root.outerHTML}
                <div class="breadcrumb-name">
                    ${breadcrumb_name.textContent}
                </div>
            </div>
            ${image_date.outerHTML}
        </div>
        <div class="title-layer">
            ${image_title.outerHTML}
            <div class="vote-number" data-side="pos">+0</div>
        </div>
    `);

    image_details.insertBefore(image_title_container, image_sidebar);
    breadcrumbs.style.setProperty('display', 'none');

    page.structure.main.insertBefore(image_details, page.structure.main.firstElementChild);

    let description = image_details.querySelector('.gallery-image-description');
    if (description == null) {
        description = document.createElement('p');
        description.classList.add('gallery-image-description', 'gallery-image-description-empty');
        description.textContent = trans_legacy.en.gallery.empty.description;

        image_details.querySelector('[data-image-url]').appendChild(description);
    }

    let buttons = image_details.querySelector('.gallery-image-buttons');

    // button container, to split into two
    let button_container = document.createElement('div');
    button_container.classList.add('button-container-wrapper');

    button_container.appendChild(buttons);

    // divider after vote btns
    let vote_buttons = buttons.querySelector('.gallery-image-vote-buttons');
    vote_buttons.after(create_divider());


    // determine current vote number
    let positive_btn = vote_buttons.querySelector(':is([data-ajax-form-state=""] .gallery-image-vote-up-off, [data-ajax-form-state="up-voted"] .gallery-image-vote-up-on, [data-ajax-form-state="down-voted"] .gallery-image-vote-up-off)').cloneNode(true);
    let negative_btn = vote_buttons.querySelector(':is([data-ajax-form-state=""] .gallery-image-vote-down-off, [data-ajax-form-state="up-voted"] .gallery-image-vote-down-off, [data-ajax-form-state="down-voted"] .gallery-image-vote-down-on)').cloneNode(true);

    let positive = parseInt(positive_btn.textContent.replace(trans_legacy.en.gallery.up, ''));
    let negative = parseInt(negative_btn.textContent.replace(trans_legacy.en.gallery.down, ''));

    let number = (positive - negative);
    let is_negative = (number < 0);

    console.info(positive_btn, positive, negative_btn, negative, number);

    let vote_badge = image_title_container.querySelector('.vote-number');
    vote_badge.textContent = `${(is_negative) ? '' : '+'}${number}`;
    vote_badge.setAttribute('data-side', (is_negative) ? 'neg' : 'pos');

    tippy(vote_badge, {
        content: trans_legacy.en.gallery.vote
    });


    // 2nd side
    let buttons_extra = document.createElement('div');
    buttons_extra.classList.add('gallery-image-buttons', 'gallery-image-buttons-extra');

    button_container.appendChild(buttons_extra);

    image_details.appendChild(button_container);

    // open in a new tab button
    let open_button = document.createElement('button');
    open_button.classList.add('image-open-button');
    tippy(open_button, {
        content: trans_legacy.en.gallery.open.tooltip
    });
    open_button.textContent = tl(trans.expand);

    open_button.setAttribute('onclick', `_expand_gallery_image()`);

    buttons_extra.appendChild(open_button);
    open_button.after(create_divider());

    // delete
    let delete_button = image_details.querySelector('.gallery-image-delete');
    if (delete_button)
        buttons_extra.appendChild(delete_button);

    // report
    let report_button = image_details.querySelector('.gallery-image-report-form');
    let report_text = report_button.querySelector('button');
    tippy(report_text, {
        content: report_text.textContent
    });
    report_text.textContent = trans_legacy.en.gallery.report.name;

    buttons_extra.appendChild(report_button);

    // star
    let star_buttons = image_details.querySelectorAll('.gallery-image-preferred-button :is(button, a)');
    star_buttons.forEach((star_button) => {
        star_button.removeAttribute('title');
        let text = star_button.querySelector('.gallery-image-preferred-states');

        /*tippy(star_button, {
            content: star_button.textContent
        });*/
        text.textContent = trans_legacy.en.gallery.prefer.name;
    });


    // view all artwork
    let view_all_container = page.structure.main.querySelector('.more-link-fullwidth-right-flush-top');
    if (view_all_container) {
        let side_actions = document.createElement('section');
        side_actions.classList.add('side-actions');

        if (!page.mobile)
            page.structure.side.appendChild(side_actions);
        else
            page.structure.main.appendChild(side_actions);

        let view_all = view_all_container.querySelector('a');
        view_all.classList.add('btn', 'side-action');
        view_all.setAttribute('data-type', 'gallery');

        side_actions.appendChild(view_all);

        page.structure.main.removeChild(view_all_container);


        // saved button
        if (page.type == 'artist' || ff('display_album_bookmark')) {
            let view_saved = document.createElement('a');
            view_saved.classList.add('btn', 'side-action');
            view_saved.setAttribute('href', `${view_all.getAttribute('href')}?tab=saved`);
            view_saved.setAttribute('data-type', 'gallery-saved');
            view_saved.textContent = trans_legacy.en.gallery.bookmarks.link;

            side_actions.appendChild(view_saved);
        }
    }


    // extra thumbnails for clarity
    // doesnt work :(
    /*let gallery_thumbnail_panel = document.createElement('section');
    gallery_thumbnail_panel.classList.add('gallery-thumbnail-panel');
    gallery_thumbnail_panel.innerHTML = page.structure.container.querySelector('.gallery-thumbnail-container').innerHTML;

    view_all_panel.after(gallery_thumbnail_panel);*/


    // bookmark-related info
    if (page.type == 'artist' || ff('display_album_bookmark'))
        patch_gallery_focused_image(image_sidebar, buttons);

    /*let gallery_slides = gallery_section.querySelectorAll('.gallery-slide');
    gallery_slides.forEach((slide) => {
        console.info(slide);
        let left = parseInt(slide.style.getPropertyValue('left').replace('%', ''));
        console.info(left);

        slide.style.setProperty('left', `${left / 10}%`)
    });*/
}

unsafeWindow._expand_gallery_image = function() {
    expand_gallery_image();
}
function expand_gallery_image() {
    let image_src = page.structure.container.querySelector('.active-slide .js-gallery-image').getAttribute('src').replace('770x0', 'ar0');
    expand_avatar(image_src);
}

export function create_divider() {
    let divider = document.createElement('div');
    divider.classList.add('listen-divider');

    return divider;
}




export function bleh_gallery_upload() {
    let gallery_section = document.createElement('section');
    gallery_section.classList.add('gallery-section', 'gallery--initialised');

    let image_container = document.createElement('div');
    image_container.classList.add('gallery-image-container');

    let slides = document.createElement('div');
    slides.classList.add('gallery-slides');


    let image = document.createElement('div');
    image.classList.add('gallery-image', 'gallery-slide', 'image-preview', 'active-slide');
    image.innerHTML = (`
        <img class="image-preview-hook">
    `);


    slides.appendChild(image);
    image_container.appendChild(slides);
    gallery_section.appendChild(image_container);
    page.structure.nav.after(gallery_section);


    // remove content top
    let content_top = document.body.querySelector('.page-content');
    content_top.innerHTML = '';

    // apply card style to form
    let form = page.structure.main.querySelector('.form-horizontal');
    form.classList.add('panel-form');


    // upload rules
    let upload_rules_group = form.querySelector('.form-group--description + .form-group');
    let rules = upload_rules_group.querySelector('.gallery-upload-rules');

    let rules_panel = document.createElement('section');
    rules_panel.classList.add('rules-panel');
    rules_panel.innerHTML = rules.innerHTML;

    page.structure.side.appendChild(rules_panel);

    form.removeChild(upload_rules_group);
}

export function bleh_gallery_upload_check() {
    if (page.subpage != 'images_image-upload')
        return;

    // update image preview
    let image_preview = page.structure.main.querySelector('.form-image-preview');
    if (!image_preview) return;

    let image_preview_container = page.structure.container.querySelector('.image-preview-hook');
    image_preview_container.setAttribute('src', image_preview.getAttribute('src'));
}


export function bleh_gallery_list() {
    let upload_btn = page.structure.main.querySelector('.btn-add');
    if (upload_btn) {
        upload_btn.classList = 'btn view-all-button back upload-button';

        let upload_panel = document.createElement('section');
        upload_panel.classList.add('view-all-panel', 'upload-panel');

        upload_panel.appendChild(upload_btn);
        page.structure.side.insertBefore(upload_panel, page.structure.side.firstElementChild)
    }

    if (page.type == 'artist')
        patch_gallery_image_listing();
}

// gallery main page
function patch_gallery_image_listing() {
    let bookmarked_images = JSON.parse(localStorage.getItem('bleh_bookmarked_images')) || {};

    if (page.requested.tab != 'saved' || page.requested.page != null)
        page.structure.container.setAttribute('data-bleh--gallery-tab', 'overview');
    else
    page.structure.container.setAttribute('data-bleh--gallery-tab', 'bookmarks');


    // create nav
    let bookmark_nav = document.createElement('div');
    bookmark_nav.classList.add('bleh--nav-wrap', 'bleh--nav-wrap--bookmarks');
    bookmark_nav.innerHTML = (`
        <nav class="navlist secondary-nav">
            <ul class="navlist-items">
                <li class="navlist-item secondary-nav-item secondary-nav-item--gallery-overview">
                    <a class="secondary-nav-item-link" onclick="_set_gallery_page('overview')">
                        ${trans_legacy.en.gallery.tabs.overview}
                    </a>
                </li>
                <li class="navlist-item secondary-nav-item secondary-nav-item--gallery-bookmarks">
                    <a class="secondary-nav-item-link" onclick="_set_gallery_page('bookmarks')">
                        ${trans_legacy.en.gallery.tabs.bookmarks}
                    </a>
                </li>
            </ul>
        </nav>
    `);

    page.structure.content_top.after(bookmark_nav);


    // content
    let bookmarks_content = document.createElement('div');
    bookmarks_content.classList.add('col-main', 'bleh--bookmarks', 'not-a-panel');
    bookmarks_content.innerHTML = (`
        <section class="bookmarks-panel">
            <ul class="image-list" id="bleh--bookmarked-images" data-kate-processed="true"></ul>
        </section>
    `);

    page.structure.main.classList.add('bleh--gallery');
    page.structure.main.after(bookmarks_content);


    let sort_button = page.structure.main.querySelector('.dropdown-menu-clickable-button');
    let sort_menu = page.structure.main.querySelector('.dropdown-menu-clickable');

    let sort_wrap = document.createElement('div');
    sort_wrap.classList.add('dropdown-top-wrap');

    sort_wrap.appendChild(sort_button);
    sort_wrap.appendChild(sort_menu);

    page.structure.main.insertBefore(sort_wrap, page.structure.main.firstElementChild);


    // append images
    if (bookmarked_images.hasOwnProperty(page.name)) {
        bookmarked_images[page.name].forEach((image) => {
            console.info(image);
            let image_element = document.createElement('li');
            image_element.classList.add('image-list-item-wrapper');
            image_element.setAttribute('data-image-id', image);
            // link has to open in new tab as sometimes last.fm breaks the rendering
            // of the gallery image, no clue..
            image_element.innerHTML = (`
                <a class="image-list-item" href="${root}music/+noredirect/${page.name}/+images/${image}">
                    <img src="https://lastfm.freetls.fastly.net/i/u/avatar170s/${image}" loading="lazy">
                </a>
            `);

            document.getElementById('bleh--bookmarked-images').appendChild(image_element);


            if (ff('remove_bookmark')) {
                let menu = tippy(image_element, {
                    theme: 'context-menu',
                    content: (`
                        <button class="dropdown-menu-clickable-item" onclick="_update_image_bookmark(this, '${image}', false)" data-menu-item="remove-bookmark" data-bleh--image-is-bookmarked="true">
                            ${trans_legacy.en.gallery.bookmarks.button.unbookmark_this_image.name}
                        </button>
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

                register_menu(image_element, menu);
            }
        });


        // mark images as bookmarked
        let image_list = page.structure.main.querySelectorAll('.image-list-item');
        image_list.forEach((image_list_item) => {
            let image_id_split = image_list_item.getAttribute('href').split('/');
            let image_id_length = image_id_split.length;
            let image_id = image_id_split[image_id_length - 1];

            if (bookmarked_images[page.name].includes(image_id)) {
                image_list_item.classList.add('image-list-item-bookmarked');
            }
        });
    } else {
        document.getElementById('bleh--bookmarked-images').outerHTML = (`
            <div class="no-data-message bleh--no-image-bookmarks">
                <p>${trans_legacy.en.gallery.bookmarks.no_data}</p>
            </div>
        `);
    }
}

unsafeWindow._set_gallery_page = function(id) {
    set_gallery_page(id);
}
function set_gallery_page(id) {
    page.structure.container.setAttribute('data-bleh--gallery-tab', id);

    // remove ?tab=saved
    /*if (page.requested.tab == 'saved') {
        let params = new URLSearchParams(document.location.search);
        params.delete('tab');
        // https://stackoverflow.com/a/43440356
        // location.hash preserves #
        history.replaceState(null, '', '?' + params + location.hash);
    }*/
}

// gallery focused image
function patch_gallery_focused_image(focused_image_details, gallery_interactions) {
    let focused_image_id_split = focused_image_details.getAttribute('data-image-url').split('/');
    let focused_image_id_length = focused_image_id_split.length - 1;

    let focused_image_id = focused_image_id_split[focused_image_id_length];

    let bookmarked_images = JSON.parse(localStorage.getItem('bleh_bookmarked_images')) || {};
    let image_is_bookmarked = false;
    if (bookmarked_images.hasOwnProperty(page.name)) {
        if (bookmarked_images[page.name].includes(focused_image_id)) {
            image_is_bookmarked = true;
            log('focused is bookmarked', 'gallery');
        }
    }

    // append a bookmark button
    let gallery_bookmark_button = document.createElement('button');
    gallery_bookmark_button.classList.add('bleh--gallery-bookmark-image-btn', 'btn--has-icon');
    gallery_bookmark_button.setAttribute('data-bleh--image-is-bookmarked', image_is_bookmarked);
    gallery_bookmark_button.setAttribute('onclick', `_update_image_bookmark(this, '${focused_image_id}')`)
    // true / false
    gallery_bookmark_button.textContent = trans_legacy.en.gallery.bookmarks.button.bookmark_this_image.name;

    unsafeWindow.bookmark_tooltip = tippy(gallery_bookmark_button, {
        content: (image_is_bookmarked)
        ? trans_legacy.en.gallery.bookmarks.button.unbookmark_this_image.bio
        : trans_legacy.en.gallery.bookmarks.button.bookmark_this_image.bio
    });

    gallery_interactions.appendChild(gallery_bookmark_button);
}

unsafeWindow._update_image_bookmark = function(button, id, tooltip = true) {
    update_image_bookmark(button, id, tooltip);
}
function update_image_bookmark(button, id, tooltip = true) {
    let bookmarked_images = JSON.parse(localStorage.getItem('bleh_bookmarked_images')) || {};
    let is_bookmarked = (button.getAttribute('data-bleh--image-is-bookmarked') === 'true');

    if (tooltip) {
        unsafeWindow.bookmark_tooltip.setContent(
            (!is_bookmarked)
            ? trans_legacy.en.gallery.bookmarks.button.unbookmark_this_image.bio
            : trans_legacy.en.gallery.bookmarks.button.bookmark_this_image.bio
        );
    } else {
        button = page.structure.container.querySelector(`[data-image-id="${id}"]`);
    }

    if (!bookmarked_images.hasOwnProperty(page.name))
        bookmarked_images[page.name] = [];

    if (is_bookmarked) {
        // remove from bookmarks

        button.setAttribute('data-bleh--image-is-bookmarked', 'false');

        let new_artist_bookmarks = [];
        for (let image in bookmarked_images[page.name]) {
            if (bookmarked_images[page.name][image] != id) {
                new_artist_bookmarks.push(bookmarked_images[page.name][image]);
            }
        }
        bookmarked_images[page.name] = new_artist_bookmarks;

        log(`image ${id} from ${page.name} removed from bookmarks`, 'gallery');
    } else {
        // add to bookmarks

        button.setAttribute('data-bleh--image-is-bookmarked', 'true');
        bookmarked_images[page.name].push(id);
        log(`image ${id} from ${page.name} added to bookmarks`, 'gallery');
    }

    localStorage.setItem('bleh_bookmarked_images', JSON.stringify(bookmarked_images));
}