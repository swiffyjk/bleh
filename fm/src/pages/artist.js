function bleh_artists() {
    let artist_header = document.body.querySelector('.header-new--artist');

    if (artist_header == undefined)
        return;

    if (artist_header.hasAttribute('data-bwaa'))
        return;
    artist_header.setAttribute('data-bwaa', 'true');

    artist_title();

    page.name = artist_header.querySelector('.header-new-title').textContent;
    page.sister = '';

    let is_subpage = artist_header.classList.contains('header-new--subpage');


    // without pro theres two containers
    if (auth.pro) {
        // pro

        page.structure.container = document.body.querySelector('.page-content:not(.visible-xs, :has(.content-top-lower-row, a + .js-gallery-heading))');
    } else {
        // not pro

        if (!is_subpage) {
            // normal, is there an ad then a container?
            page.structure.container = document.body.querySelector('.full-bleed-ad-container + .page-content:not(.visible-xs)');

            // death grips for some reason
            if (!page.structure.container)
                page.structure.container = document.body.querySelector('.page-content');
        } else {
            page.structure.container = document.body.querySelector('.page-content:not(.visible-xs, :has(.content-top-lower-row, a + .js-gallery-heading))');
        }
    }
    try {
        page.structure.row = page.structure.container.querySelector('.row');

        if (!is_subpage)
            page.structure.main = page.structure.row.querySelector('.col-main.buffer-standard');
        else
            page.structure.main = page.structure.row.querySelector('.col-main');

        if (auth.pro) {
            page.structure.side = page.structure.row.querySelector('.col-sidebar:not(.masonry-right)');
        } else {
            page.structure.side = page.structure.row.querySelector('.col-sidebar:not(.section-with-separator--col)');
        }
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure(is_subpage, artist_header);

    let katsune = ff('katsune');
    let featured_items = artist_header.querySelector('.artist-header-featured-items');

    if (ff('refreshed_music_nav')) {
        let avatar = artist_header.querySelector('.header-new-background-image');
        let title = artist_header.querySelector('.header-new-title');
        let on_tour = artist_header.querySelector('.header-new-on-tour');
        let position = artist_header.querySelector('.header-new-chart-position-number');

        let redesigned_artist_header = document.createElement('section');
        redesigned_artist_header.classList.add('redesigned-header', 'redesigned-artist-header', 'no-background');
        redesigned_artist_header.innerHTML = (`
            <div class="avatar-side">
                ${(avatar != null) ? (`
                <img src="${avatar.getAttribute('content').replace('/ar0/', '/avatar300s/')}">
                <a class="bleh--avatar-clickable-link"></a>
                `) : '<img class="missing-artist">'}
            </div>
            <div class="info-side">
                ${(page.multi) ? (`
                <div class="sub-text">${trans[lang].artist.plural}<div class="info-tip"><div class="bleh-icon bleh-info-icon"></div></div></div>
                `) : (`
                <div class="sub-text">${trans[lang].artist.name}</div>
                `)}
                <div class="title-container" data-multi="${page.multi}">
                    <h1>${title.innerHTML}</h1>
                    ${(position != null) ? position.outerHTML : ''}
                    ${(on_tour != null) ? on_tour.outerHTML : ''}
                </div>
                ${(featured_items != null && !katsune) ? featured_items.outerHTML : ''}
            </div>
            ${(!is_subpage && !katsune) ? (`
            <div class="gallery-side">
                <section class="view-all-panel">
                    ${(settings.quick_artist_button == 'gallery') ? (`
                    <a class="btn view-all-button back top-gallery-button" href="${window.location.href}/+images">
                        ${trans[lang].gallery.view}
                    </a>
                    `) : (settings.quick_artist_button == 'shouts') ? (`
                    <a class="btn view-all-button back top-shout-button" href="${window.location.href}/+shoutbox">
                        ${trans[lang].settings.layout.quick_artist_button.shouts}
                    </a>
                    `) : (settings.quick_artist_button == 'wiki') ? (`
                    <a class="btn view-all-button back top-wiki-button" href="${window.location.href}/+wiki">
                        ${trans[lang].settings.layout.quick_artist_button.wiki}
                    </a>
                    `) : (settings.quick_artist_button == 'listens') ? (`
                    <a class="btn view-all-button back top-listens-button" href="${window.location.href}/+listeners/you-know">
                        ${trans[lang].settings.layout.quick_artist_button.listens}
                    </a>
                    `) : ''}
                </section>
            </div>
            `) : ''}
        `);

        let multi_info_box = redesigned_artist_header.querySelector('.info-tip');
        if (multi_info_box) {
            tippy(multi_info_box, {
                content: trans[lang].artist.tooltip
            });
        }

        position = redesigned_artist_header.querySelector('.header-new-chart-position-number');
        if (position != null) {
            tippy(position, {
                content: trans[lang].charts.view
            });
        }

        let bg;

        if (avatar)
            bg = register_background(avatar.getAttribute('content'));
        else
            bg = register_background(null);

        if (ff('katsune')) {
            redesigned_artist_header.setAttribute('data-bleh--theme', 'oled');
            bg.appendChild(redesigned_artist_header);
        } else {
            page.structure.container.insertBefore(redesigned_artist_header, page.structure.container.firstElementChild);
        }
        artist_header.classList.add('legacy-header');


        let avatar_side = redesigned_artist_header.querySelector('.avatar-side');
        let avatar_link = avatar_side.querySelector('a');

        if (avatar != null && avatar_link != null) {
            let expand_link;
            if (avatar != null)
                expand_link = `_expand_avatar('${avatar.getAttribute('content')}')`;

            if (settings.default_avatar_action == 'expand' && avatar != null)
                avatar_link.setAttribute('onclick', expand_link);
            else if (settings.default_avatar_action == 'gallery')
                avatar_link.href = `${root}music/${sanitise(page.name)}/+images`;

            let menu = tippy(avatar_side, {
                theme: 'context-menu',
                content: (`
                    ${(avatar != null) ? (`
                    <button class="dropdown-menu-clickable-item" onclick="${expand_link}" data-menu-item="expand">
                        ${trans[lang].gallery.open.name}
                    </button>
                    `) : ''}
                    <a class="dropdown-menu-clickable-item" href="${root}music/${sanitise(page.name)}/+images" data-menu-item="gallery">
                        ${trans[lang].gallery.view}
                    </a>
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}bleh?tab=customise" data-menu-item="settings">
                        ${trans[lang].settings.configure}
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

            register_menu(avatar_side, menu);
        }

        if (!is_subpage) {
            let view_button = redesigned_artist_header.querySelector('.view-all-button');

            if (view_button) {
                let view_menu = tippy(view_button, {
                    theme: 'context-menu',
                    content: (`
                        <a class="dropdown-menu-clickable-item" href="${root}bleh?tab=customise" data-menu-item="settings">
                            ${trans[lang].settings.configure}
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

                register_menu(view_button, view_menu);
            }
        }
    }

    if (!is_subpage) {
        show_your_scrobbles();

        bleh_music_page_charts();

        bleh_tags_mini();


        if (katsune && featured_items) {
            let featured_panel = document.createElement('section');
            featured_panel.classList.add('featured-items-panel');

            featured_panel.innerHTML = featured_items.innerHTML;

            let listen_panel = page.structure.side.querySelector('.listen-panel');
            if (listen_panel)
                listen_panel.after(featured_panel);
            else
                page.structure.side.insertBefore(featured_panel, page.structure.side.firstElementChild);
        }
    } else {
        let btn_add = page.structure.side.querySelector('.add-button');
        if (btn_add != null)
            btn_add.setAttribute('data-page-subpage', page.subpage);

        if (page.subpage == 'images_image-upload')
            bleh_gallery_upload();
        else if (page.subpage == 'images_overview')
            bleh_gallery_list();
        else if (page.subpage == 'wiki_overview')
            bleh_wiki();
        else if (page.subpage == 'wiki_history')
            bleh_wiki_history();
        else if (page.subpage == 'wiki_edit')
            bleh_wiki_editor();
        else if (page.subpage == 'listeners_overview')
            bleh_top_listeners();
    }

    log('status is', 'page', 'info', page);
    update_page();
}