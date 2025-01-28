log(`starting ${version.build}.${version.sku}`, 'load');

bleh();

function bleh() {
    let head_observer = new MutationObserver((mutations) => {
        if (document.head) {
            append_style();

            head_observer.disconnect();
        }
    });

    head_observer.observe(document.documentElement, {
        childList: true
    });

    let pre_observer = new MutationObserver((mutations) => {
        if (document.body && document.body.querySelector('.masthead-logo')) {
            bleh_main();

            pre_observer.disconnect();
        }
    });

    pre_observer.observe(document.documentElement, {
        childList: true
    });
}

function bleh_main() {
    let performance_start = performance.now();

    auth_link = document.querySelector('a.auth-link');
    if (auth_link)
        auth.name = auth_link.querySelector('img').getAttribute('alt');

    load_settings();

    // messaging
    load_dialogs();

    theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', ''); // remove quotations

    lookup_lang();
    patch_masthead(document.body);


    load_notifications();

    // load seasonal data
    set_season();

    start_rain();

    // everything past this point requires authorisation
    if (auth.name == '') {
        notify({
            title: 'No account added',
            body: 'Please sign in to an account to access bleh features.',
            icon: 'icon-16-user',
            persist: true
        });
        document.body.classList.add('bleh-loaded');
        return;
    }

    load_activities();
    notify_if_new_update();

    lotus();
    sponsors();

    append_nav();

    try {
        //throw new Error;
        main_flow();

        // last.fm is a single page application
        const observer = new MutationObserver((mutations) => {
            lookup_lang();
            patch_masthead(document.body);

            theme_version = getComputedStyle(document.body).getPropertyValue('--version-build').replaceAll("'", '').replaceAll('"', ''); // remove quotations
            if (theme_version != version.build && theme_version != '' && !has_prompted_for_update) {
                // script is either out of date, or more in date (not gonna happen)
                log(`version mismatch! running ${version.build}, downloaded theme ${theme_version}`, 'update');

                prompt_for_update();
                has_prompted_for_update = true;
            }

            main_flow();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        let performance_end = performance.now();
        log(`finished in ${performance_end - performance_start}`, 'load');
    } catch(e) {
        handle_error(e);
    }
}

function handle_error(e = null) {
    dialog({
        id: 'error',
        title: 'An error has occured',
        body: (`
            <div class="modal-vertical-inner error-inner">
                <div class="bleh-icon" style="--icon: var(--icon-error)"></div>
                <h1>oops.. something broke</h1>
                <p>An error has prevented bleh from loading correctly, please report this issue on Github.</p>
                <pre class="error-info">${(e) ? `<span class="error-type">${e.name}</span>: ${e.message}` : ''}<br>on: ${page.type}/${page.subpage}</pre>
                <p>Please include this error and the steps you took in the report!</p>
            </div>
            <div class="modal-footer">
                <a class="btn primary report-bug continue" href="https://github.com/katelyynn/bleh/issues/new/choose" target="_blank">
                    Report bug now
                </a>
            </div>
        `),
        type: 'error'
    });

    if (e != null) {
        log('fatal failure', 'load');
        console.error(e);
    }

    log('current page', 'page', 'info', page);
}

function main_flow() {
    assign_page();

    if (page.type == 'artist' || page.type == 'album') {
        bleh_gallery();
        bleh_gallery_upload_check();
    }

    if (page.type == 'user' ||
        page.type == 'search' ||
        page.type == 'tag'
    )
        music_grids();

    if (page.type == 'user' ||
        page.type == 'artist' ||
        page.type == 'album' ||
        page.type == 'track' ||
        page.type == 'events' ||
        page.type == 'festival' ||
        page.type == 'tag'
    ) {
        patch_shouts();

        if (shout_parse_queue.length > 0)
            parse_shout_queue();
    }
    patch_gallery_page();

    if (page.type == 'user' && page.subpage.startsWith('library') && (
        page.subpage != 'library_overview' && !page.subpage.startsWith('library_artist_') &&
        !page.subpage.startsWith('library_album_') && !page.subpage.startsWith('library_track_')
    ))
        bleh_glacier_library();

    // bulk edit check
    if (auth.pro && page.type == 'user' && page.name == auth.name && page.subpage == 'library_artist_overview' ||
        page.subpage == 'library_album_overview' || page.subpage == 'library_track_overview'
    ) {
        bleh_glacier_library_bulk_edit();
    }

    if (page.type == 'user' ||
        page.type == 'artist' ||
        page.type == 'album' ||
        page.type == 'events' ||
        page.type == 'festival' ||
        page.type == 'tag'
    ) {
        patch_titles();
    }

    if (settings.corrections) {
        correct_generic_combo_no_artist('artist-header-featured-items-item');
        correct_generic_combo_no_artist('artist-top-albums-item');
        correct_generic_combo('source-album-details');
        correct_generic_combo('resource-list--release-list-item');
        correct_generic_combo('similar-albums-item');
        correct_generic_combo('track-similar-tracks-item');
        correct_generic_combo('similar-items-sidebar-item');
    }

    patch_obsession_view();

    subscribe_to_events();
    auto_edit_modal();
}

function assign_page() {
    document.documentElement.classList.add('bleh-supports-loading');
    if (!page.structure.wrapper)
        page.structure.wrapper = document.body.querySelector('.main-content');

    let main_content = page.structure.wrapper.querySelector(':scope > :last-child:not([data-bleh])');
    if (main_content) {
        assign_page_type();
        load_page();
        main_content.setAttribute('data-bleh', 'true');
    } else {
        assign_page_subpage();
    }

    document.body.classList.add('bleh-loaded');
}

function assign_page_type() {
    let page_classes = document.body.classList;
    page_classes.forEach((page_class, index) => {
        if (page_class.startsWith('namespace')) {
            page.initial = page_class.replace('namespace--', '');
            let page_split = page.initial.split('_');

            page.type = page_split[0];
            if (page.type == 'music') {
                page.type = page_split[1];
            }

            if (page.type != last_page_type) {
                last_page_type = page.type;
                log(page.type, 'page');
            }

            console.log(page);

            assign_page_subpage();

            return;
        }

        if (index > 4)
            return;
    });
}

function assign_page_subpage() {
    page.subpage = page.initial.replace(page.type, '').replace('_', '').replace('music_', '');

    if (last_page_subpage != page.subpage) {
        last_page_subpage = page.subpage;
        log(`subpage of ${page.subpage}`, 'page');

        load_settings();

        if (page.state.settings_reload) {
            page.state.settings_reload = false;
        }

        if (page.structure.indicator)
            page_indicator();
    }
}

function load_page() {
    append_nav();
    set_season();
    seasonal_timer_end();

    if (window.location.href.startsWith(setup_url.replace('{root}', root))) {
        bleh_setup();
    } else if (window.location.href.startsWith(sponsor_url.replace('{root}', root))) {
        bleh_sponsor_page();
    } else if (window.location.href.startsWith(bleh_url.replace('{root}', root))) {
        bleh_settings();
    } else {
        error_page();

        if (page.state.error)
            return;

        if (page.type == 'user')
            bleh_profiles();
        else if (page.type == 'artist')
            bleh_artists();
        else if (page.type == 'album')
            bleh_albums();
        else if (page.type == 'track')
            bleh_tracks();
        else if (page.type == 'events' || page.type == 'festival')
            bleh_events();
        else if (page.type == 'tag')
            bleh_tags();
        else if (page.type == 'search')
            bleh_search();
        else if (page.type == 'settings')
            bleh_native_settings();
        else if (page.type == 'charts')
            bleh_charts();
        else if (page.type == 'inbox')
            bleh_inbox();
        else if (page.type == 'bookmarks')
            bleh_bookmarks();

        if (
            (page.type == 'artist' || page.type == 'album' || page.type == 'track') &&
            page.subpage == 'overview'
        )
            patch_wiki();
    }

    if (ff('page_title')) {
        //document.title = `${page.type}_${page.subpage} (${page.name}, ${page.sister}) - bleh ${version.build}.${version.sku}`;
        try {
            document.title = `${trans[lang].pages[page.type][page.subpage].replace('{name}', page.name).replace('{sister}', page.sister)} | ${version.brand} ${version.build}.${version.sku}`
        } catch(e) {
            log(`translation key for this page could not be found`, 'page', 'info', page);
        }
    }

    page_title();

    if (page.structure.indicator)
        page_indicator();
}

function page_title() {
    if (!ff('katsune'))
        return;

    let title = page.structure.container.querySelector('.page-title');
    if (!title) {
        title = document.createElement('section');
        title.classList.add('page-header');

        page.structure.container.insertBefore(title, page.structure.container.firstElementChild);
    }

    let name = page.type;

    if (trans[lang].hasOwnProperty(page.type))
        name = trans[lang][page.type].name;
    else if (page.type == 'user')
        name = trans[lang].profile.name;
    else if (page.type == 'bleh_settings')
        name = trans[lang].settings.name;

    title.setAttribute('data-page-type', page.type);
    title.innerHTML = (`
        <div class="bleh-icon page-header-icon"></div>
        <div class="page-header-title">
            ${name}
        </div>
    `);
}

function page_indicator() {
    page.structure.indicator.innerHTML = (`
        <div class="bleh">
            <strong>version</strong>
            <span>${version.brand}</span>
            <span>${version.build}</span>
            <span>${version.sku}</span>
        </div>
        <div class="page">
            <strong>auth</strong>
            <span>${auth.name}</span>
            <span>${lang} (${non_override_lang})</span>
        </div>
        <div class="page">
            <strong>page</strong>
            <span>${page.type}</span>
            <span>${page.subpage}</span>
        </div>
        <div class="page">
            <strong></strong>
            <span>${page.name}</span>
            <span>${page.sister}</span>
        </div>
        <div class="page">
            <strong>season</strong>
            <span>${stored_season.id}</span>
            <span>${stored_season.year}</span>
            <span>${stored_season.offset}</span>
        </div>
    `);
}


function update_page() {
    page.structure.container.setAttribute('data-page-type', page.type);
    page.structure.container.setAttribute('data-page-subpage', page.subpage);
}

function register_background(url) {
    let flag = ff('katsune');

    let background;
    if (flag) {
        background = page.structure.container.querySelector('.bleh-background');
        if (background == null) {
            background = document.createElement('div');
            background.classList.add('bleh-background', 'katsune-bleh-background');

            let border = document.createElement('div');
            border.classList.add('katsune-bleh-background-border');
            background.appendChild(border);

            page.structure.container.insertBefore(background, page.structure.container.firstElementChild);
        }
    } else {
        background = document.body.querySelector('.bleh-background');
        if (background == null) {
            background = document.createElement('div');
            background.classList.add('bleh-background');

            document.body.appendChild(background);
        }
    }

    background.setAttribute('data-page-type', page.type);

    if (url)
        background.style.setProperty('background-image', `url(${url})`);
    else
        background.style.removeProperty('background-image');

    if (page.type == 'user') {
        if (page.name == auth.name) {
            background.setAttribute('data-page-user-is-self', 'true');
        } else {
            background.setAttribute('data-page-user-is-self', 'false');
        }
    }

    return background;
}