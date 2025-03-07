function bleh_albums() {
    let album_header = document.body.querySelector('.header-new--album');

    if (album_header == undefined)
        return;

    if (album_header.hasAttribute('data-bwaa'))
        return;
    album_header.setAttribute('data-bwaa', 'true');

    patch_header_title();

    page.sister = album_header.querySelector('.header-new-crumb span').textContent;
    page.name = correct_item_by_artist(document.body.querySelector('[data-page-resource-name]').getAttribute('data-page-resource-name'), page.sister);

    let is_subpage = album_header.classList.contains('header-new--subpage');


    // without pro theres two containers
    if (auth.pro) {
        // pro

        page.structure.container = document.body.querySelector('.page-content:not(:has(.content-top-lower-row, a + .js-gallery-heading))');
    } else {
        // not pro

        if (!is_subpage) {
            // normal, is there an ad then a container?
            page.structure.container = document.body.querySelector('.full-bleed-ad-container + .page-content:not(.visible-xs)');

            // death grips for some reason
            if (!page.structure.container)
                page.structure.container = document.body.querySelector('.page-content');
        } else {
            page.structure.container = document.body.querySelector('.page-content:not(:has(.content-top-lower-row, a + .js-gallery-heading))');
        }
    }
    page.structure.row = page.structure.container.querySelector('.row');
    try {
        page.structure.main = page.structure.row.querySelector('.col-main:not(.visible-xs, .hidden-xs, .upper-overview)');
        if (!is_subpage)
            page.structure.side = page.structure.row.querySelector('.col-sidebar.hidden-xs.masonry-right-bottom');
        else
            page.structure.side = page.structure.row.querySelector('.col-sidebar.hidden-xs');
    } catch(e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure(is_subpage, album_header);

    if (ff('refreshed_music_nav')) {
        let avatar = album_header.querySelector('.header-new-background-image');
        let title = album_header.querySelector('.header-new-title');
        let artist = album_header.querySelector('[itemprop="byArtist"]');
        let position = album_header.querySelector('.header-new-chart-position-number');

        let redesigned_album_header = document.createElement('section');
        redesigned_album_header.classList.add('redesigned-header', 'redesigned-album-header', 'no-background');
        redesigned_album_header.innerHTML = (`
            ${(is_subpage || ff('show_album_cover_always')) ? (`
            <div class="avatar-side">
                ${(avatar != null) ? (`
                <img src="${avatar.getAttribute('content').replace('/ar0/', '/avatar170s/')}">
                <a class="bleh--avatar-clickable-link"></a>
                `) : '<img class="missing-album">'}
            </div>
            `) : ''}
            <div class="info-side">
                <div class="sub-text">${trans[lang].album.name}</div>
                <div class="title-container">
                    <h1>${title.innerHTML}</h1>
                    ${(position != null) ? position.outerHTML : ''}
                </div>
                <h2>${artist.innerHTML}</h2>
            </div>
        `);

        let bg;

        if (avatar)
            bg = register_background(avatar.getAttribute('content'));
        else
            bg = register_background(null);

        page.structure.container.insertBefore(redesigned_album_header, page.structure.container.firstElementChild);
        album_header.classList.add('legacy-header');


        let avatar_side = redesigned_album_header.querySelector('.avatar-side');
        let avatar_link = avatar_side.querySelector('a');

        if (avatar != null && avatar_link != null) {
            let expand_link;
            if (avatar != null)
                expand_link = `_expand_avatar('${avatar.getAttribute('content')}')`;

            if (settings.default_avatar_action == 'expand' && avatar != null)
                avatar_link.setAttribute('onclick', expand_link);
            else if (settings.default_avatar_action == 'gallery')
                avatar_link.href = `${root}music/${sanitise(page.sister)}/${sanitise(page.name)}/+images`;

            let menu = tippy(avatar_side, {
                theme: 'context-menu',
                content: (`
                    ${(avatar != null) ? (`
                    <button class="dropdown-menu-clickable-item" onclick="${expand_link}" data-menu-item="expand">
                        ${trans[lang].gallery.open.name}
                    </button>
                    `) : ''}
                    <a class="dropdown-menu-clickable-item" href="${root}music/${sanitise(page.sister)}/${sanitise(page.name)}/+images" data-menu-item="gallery">
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
    }

    // cover
    if (settings.hue_from_album) {
        let header_inner = album_header.querySelector('.header-new-inner');
        try {
            let bg = header_inner.getAttribute('style').replace('background: #', '');
            let hsl = hex_to_hsl(bg);
            document.body.style.setProperty('--hue-album', hsl.h);
            document.body.style.setProperty('--sat-album', clamp_sat((hsl.s / 100) * 3));

            log(`sourced hsl of (${hsl.h}, ${hsl.s}, ${hsl.l}) - using final value of (${hsl.h}, ${clamp_sat((hsl.s / 100) * 3)}, ${hsl.l})`, 'hue from album');

            load_chart_colours();
        } catch(e) {
            log('no cover present', 'hue from album');
        }
    }

    if (!is_subpage) {
        show_your_scrobbles();

        bleh_music_page_charts();

        album_missing_a_tracklist();

        bleh_about_artist();

        bleh_tags_mini();


        let similar_albums = page.structure.main.querySelector('.similar-albums');
        if (similar_albums) {
            let similar_panel = similar_albums.parentElement;
            similar_panel.classList.add('similar-panel');
        }

        // tooltips on album cover
        let button_row = page.structure.side.querySelector('.album-overview-cover-art-action-row');
        if (button_row) {
            let buttons = button_row.querySelectorAll('a');
            buttons.forEach((button) => {
                button.classList.add('btn');

                tippy(button, {
                    content: button.textContent
                });
            });
        }

        let upload_container = page.structure.side.querySelector('.album-overview-cover-art-upload-action');
        let avatar = album_header.querySelector('.header-new-background-image');

        let katsune = ff('katsune');

        if (avatar && !katsune) {
            let expand_container = document.createElement('span');
            expand_container.classList.add('album-overview-cover-art-expand-action');

            let expand_link = document.createElement('a');
            expand_link.classList.add('btn');
            expand_link.setAttribute('onclick', `_expand_avatar('${avatar.getAttribute('content')}')`);
            expand_link.textContent = trans[lang].gallery.open.name;

            tippy(expand_link, {
                content: trans[lang].gallery.open.name
            });

            expand_container.appendChild(expand_link);

            upload_container.after(expand_container);
        }

        if (katsune) {
            let row = page.structure.side.querySelector('.album-overview-cover-art-actions');

            if (row)
                page.structure.container.querySelector('.avatar-side').appendChild(row);
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
    }

    log('status is', 'page', 'info', page);
    update_page();
}

function album_missing_a_tracklist() {
    // tracklist
    let tracklist = document.getElementById('tracklist');
    if (tracklist == null) {
        let top_overview = document.querySelector('.top-overview-panel');

        if (top_overview == null) {
            return;
        }

        tracklist = document.createElement('section');
        tracklist.innerHTML = (`
            <h3 class="text-18">${trans[lang].music.fetch_plays.name}</h3>
            <div class="loading-data-container">
                <p class="loading-data-text">${trans[lang].music.fetch_plays.loading}</p>
            </div>
        `);
        top_overview.after(tracklist);

        /*let url_split = window.location.href.split('/');
        let album_url = `${url_split[(url_split.length - 2)]}/${url_split[(url_split.length - 1)]}`;
        let album_as_track_url = window.location.href.replace(album_url, `${url_split[(url_split.length - 2)]}/_/${url_split[(url_split.length - 1)]}`);*/

        let url = document.querySelector('.header-metadata-display a');
        if (url == undefined) {
            let url_split = window.location.href.split('/');
            let album_url = `${url_split[(url_split.length - 2)]}/${url_split[(url_split.length - 1)]}`;
            let album_as_track_url = window.location.href.replace(album_url, `${url_split[(url_split.length - 2)]}/_/${url_split[(url_split.length - 1)]}`);

            tracklist.innerHTML = (`
                <h3 class="text-18">${trans[lang].music.fetch_plays.name}</h3>
                <div class="loading-data-container">
                    <p class="loading-data-text failed">${trans[lang].music.fetch_plays.fail}</p>
                    <a class="btn" href="${album_as_track_url}">${trans[lang].music.fetch_plays.open_as_track}</a>
                </div>
            `);
            return;
        }
        url = url.getAttribute('href');


        // we need to fetch the tracklist
        fetch(url)
            .then(function(response) {
                console.error('returned', response, response.text);

                return response.text();
            })
            .then(function(html) {
                let doc = new DOMParser().parseFromString(html, 'text/html');

                //deliver_notif(`using url ${`/user/${auth.name}/library/music/${album_url}`}`);
                console.error('DOC', doc);

                let inner_tracklist = doc.querySelector('#top-tracks-section [v-else=""] .chartlist');
                if (inner_tracklist == null) {
                    tracklist.innerHTML = (`
                        <h3 class="text-18">${trans[lang].music.fetch_plays.name}</h3>
                        <div class="loading-data-container">
                            <p class="loading-data-text failed">${trans[lang].music.fetch_plays.fail}</p>
                            <a class="btn" href="${album_as_track_url}">${trans[lang].music.fetch_plays.open_as_track}</a>
                        </div>
                    `);
                    return;
                }

                inner_tracklist.classList.remove('chartlist--with-image');

                tracklist.innerHTML = (`
                    <h3 class="text-18">${trans[lang].music.fetch_plays.name}</h3>
                    <div class="alert alert-info">${trans[lang].music.fetch_plays.info}</div>
                    ${inner_tracklist.outerHTML}
                `);
            })
    }
}