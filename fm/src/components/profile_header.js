unsafeWindow._toggle_profile_header = function(button) {
    let current = settings.profile_header_expand;

    settings.profile_header_expand = !current;
    button.setAttribute('aria-expanded', !current);

    document.documentElement.setAttribute('data-bleh--profile_header_expand', !current);

    // save to settings
    localStorage.setItem('bleh', JSON.stringify(settings));
}

function redesign_profile_header(is_own_profile, is_following) {
    let base_header = document.body.querySelector('.header-info-secondary');

    if (base_header == null)
        return;

    let katsune = ff('katsune');

    let header_meta = base_header.querySelector('.header-metadata');
    header_meta.classList.add('profile-header-metadata-legacy');

    // acquire info
    let scrobbles = 0;
    let average = 0;
    let artists = 0;
    let loved = 0;

    if (!katsune) {
        let metadata = header_meta.querySelectorAll('.header-metadata-display');
        metadata.forEach((item, index) => {
            if (index == 0) {
                let para = item.querySelector('p');

                scrobbles = clean_number(para.textContent.trim());
                average = para.getAttribute('title');
            } else if (index == 1) {
                artists = clean_number(item.textContent.trim());
            } else if (index == 2) {
                loved = clean_number(item.textContent.trim());
            }
        });
    }


    // taste
    let taste = '';
    let taste_percentage = '';
    let taste_artists = [];
    let profile_avi = '';

    if (!is_own_profile && page.name != sponsor_list.sponsor_account) {
        let taste_meter = base_header.querySelector('.tasteometer');

        taste = taste_meter.classList[1].replace('tasteometer-compat-', '');

        let artists = taste_meter.querySelectorAll('a');
        artists.forEach((artist) => {
            taste_artists.push(correct_artist(artist.getAttribute('title')));
        });

        profile_avi = document.body.querySelector('.header-avatar img');
        if (profile_avi != null)
            profile_avi = profile_avi.getAttribute('src');
        else
            profile_avi = '';

        taste_percentage = taste_meter.querySelector('.tasteometer-viz').getAttribute('title');
        if (taste_percentage == '99%')
            taste_percentage = '100%';
    }


    // create new
    let profile_header;

    if (katsune) {
        profile_header = document.createElement('section');
        profile_header.classList.add('profile-top-header', 'katsune-button-row');
    } else {
        profile_header = document.createElement('div');
        profile_header.classList.add('profile-top-header', 'view-buttons');
    }

    if (!is_own_profile) {
        // follow
        let follow_wrap = document.body.querySelector('.header-avatar .class > div');

        if (follow_wrap != null) {
            let follow_btn = follow_wrap.querySelector('button');
            follow_btn.classList.add('btn', 'profile-top-item', 'profile-top-item--follow', 'view-item', (katsune) ? 'icon' : '');
            follow_btn.classList.remove('toggle-button', 'header-follower-btn');
            follow_btn.setAttribute('data-following', is_following);
            profile_header.appendChild(follow_wrap);

            if (!katsune)
                tippy(follow_btn, {
                    content: follow_btn.textContent
                });

            follow_btn.addEventListener('click', () => {
                window.setTimeout(() => {
                    follow_btn._tippy.setContent(follow_btn.textContent);
                }, 50);
            });
        } else {
            // ignore list
            let follow_placeholder = document.createElement('button');
            follow_placeholder.classList.add('btn', 'profile-top-item', 'profile-top-item--follow', 'view-item', (katsune) ? 'icon' : '');
            follow_placeholder.textContent = trans[lang].profile.on_ignore_list;

            follow_placeholder.setAttribute('disabled', 'true');
            follow_placeholder.setAttribute('data-ignored', 'true');

            if (!katsune)
                tippy(follow_placeholder, {
                    content: trans[lang].profile.on_ignore_list
                });

            profile_header.appendChild(follow_placeholder);
        }


        if (page.name == 'cutensilly') {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'sponsor',
                link: '_sponsor()',
                full: true,
                action: 'button',
                primary: true,
                katsune: katsune
            });
        }


        // message
        let msg_button = document.body.querySelector('.header-message-user');
        if (msg_button != null) {
            if (page.name != sponsor_list.sponsor_account) {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'message',
                    link: msg_button.getAttribute('href'),
                    katsune: katsune
                });
            } else {
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'sponsor',
                    link: '_sponsor()',
                    full: true,
                    action: 'button',
                    primary: true,
                    katsune: katsune
                });
                create_profile_top_item(profile_header, {
                    name: page.name,
                    type: 'message_sponsor',
                    link: msg_button.getAttribute('href'),
                    full: true,
                    primary: true,
                    katsune: katsune
                });
            }
        }


        // shortcut
        if (page.name != sponsor_list.sponsor_account) {
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'shortcut',
                link: `_set_profile_as_shortcut(this, '${page.name}')`,
                action: 'button',
                katsune: katsune
            });
        }
    } else {
        // edit
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'edit',
            link: `${root}settings`,
            katsune: katsune
        });
        create_profile_top_item(profile_header, {
            name: page.name,
            type: 'obsess',
            link: `${root}user/${page.name}/obsessions/set`,
            katsune: katsune
        });
    }

    if (katsune) {
        let sep = document.createElement('div');
        sep.classList.add('btn-gap');
        profile_header.appendChild(sep);
    }

    if (!is_own_profile && page.name != sponsor_list.sponsor_account && katsune) {
        let taste_wrap = document.createElement('div');
        taste_wrap.classList.add('katsune-taste');

        taste_wrap.innerHTML = (`
            <div class="taste-info">
                <div class="taste-value">
                    ${(taste_artists.length == 1) ? trans[lang].profile.taste_meter.you_share_1.replace('{artist}', taste_artists[0]) : ''}
                    ${(taste_artists.length == 2) ? trans[lang].profile.taste_meter.you_share_2.replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]) : ''}
                    ${(taste_artists.length == 3) ? trans[lang].profile.taste_meter.you_share_3.replace('{artist1}', taste_artists[0]).replace('{artist2}', taste_artists[1]).replace('{artist3}', taste_artists[2]) : ''}
                </div>
                <div class="taste-bar colourful" data-taste="${taste}">
                    <div class="taste-bar-fill" style="width: ${taste_percentage}"></div>
                </div>
            </div>
            <div class="katsune-taste-badge">
                <div class="taste-icon colourful" data-taste="${taste}"></div>
                <div class="taste-percent">${taste_percentage.replace('%', '')}</div>
            </div>
        `);

        tippy(taste_wrap, {
            theme: 'stack',
            content: (`
            <span>
                ${trans[lang].profile.taste}
                <!--<div class="taste-badge spacing">
                    <span>${trans[lang].profile.taste_meter.level[taste]}</span>
                    <span>${taste_percentage}</span>
                </div>-->
            </span>
            <div class="hint">${trans[lang].settings.right_click}</div>
            `),
            allowHTML: true
        });

        profile_header.appendChild(taste_wrap);

        if (taste_artists.length > 1) {
            let menu = tippy(taste_wrap, {
                theme: 'context-menu',
                content: (`
                    <h4 class="menu-header">${trans[lang].music.compare.header}</h4>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[0]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[0])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[0]}
                    </a>
                    ${(taste_artists.length >= 2) ? (`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[1]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[1])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[1]}
                    </a>
                    `) : ''}
                    ${(taste_artists.length >= 3) ? (`
                    <div class="sep"></div>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${page.name}/library/music/${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${profile_avi}" alt="${page.name}">${taste_artists[2]}
                    </a>
                    <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(taste_artists[2])}" data-menu-item="shared-artist">
                        <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${taste_artists[2]}
                    </a>
                    `) : ''}
                `),
                allowHTML: true,
                placement: 'right-start',
                trigger: 'manual',
                interactive: true,
                interactiveBorder: 10,
                offset: [0, 0]
            });

            register_menu(taste_wrap, menu);
        }
    }

    if (page.name != sponsor_list.sponsor_account && katsune) {
        let progress = document.createElement('div');
        progress.classList.add('katsune-scrobble-progress', 'colourful');

        let metadata = header_meta.querySelector('.header-metadata-display');
        scrobbles = clean_number(metadata.querySelector('p').textContent.trim());

        let tier = 0;
        if (scrobbles > 100_000) {
            tier = Math.floor(scrobbles / 100_000);
            scrobbles -= (tier * 100_000);
        }

        if (tier > 4)
            tier = 4;
        progress.setAttribute('data-tier', tier);

        let left = 100_000 - scrobbles;
        let percent = (scrobbles / 100_000) * 100;

        progress.innerHTML = (`
            <div class="progress-info">
                <div class="progress-value">${trans[lang].profile.progress.to_go.replace('{s}', left.toLocaleString(lang))}</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="progress-badge">
                <div class="progress-icon"></div>
                <div class="progress-percent">${Math.round(percent)}</div>
            </div>
        `);

        profile_header.appendChild(progress);

        tippy(progress, {
            theme: 'progress-badges',
            content: (`
                <span class="progress-badges-title">${trans[lang].profile.progress.explain}</span>
                <div class="progress-badges-list">
                    <div class="progress-badges-item colourful ${(tier == 0) ? 'active' : ''}" data-tier="0">
                        <div class="bleh-icon" style="--icon: var(--icon-16-progress-tier-0)"></div>
                        <span class="tier-name">${trans[lang].profile.progress.tier.replace('{t}', '0')}</span>
                    </div>
                    <div class="progress-badges-item colourful ${(tier == 1) ? 'active' : ''}" data-tier="1">
                        <div class="bleh-icon" style="--icon: var(--icon-16-progress-tier-1)"></div>
                        <span class="tier-name">${trans[lang].profile.progress.tier.replace('{t}', '1')}</span>
                    </div>
                    <div class="progress-badges-item colourful ${(tier == 2) ? 'active' : ''}" data-tier="2">
                        <div class="bleh-icon" style="--icon: var(--icon-16-progress-tier-2)"></div>
                        <span class="tier-name">${trans[lang].profile.progress.tier.replace('{t}', '2')}</span>
                    </div>
                    <div class="progress-badges-item colourful ${(tier == 3) ? 'active' : ''}" data-tier="3">
                        <div class="bleh-icon" style="--icon: var(--icon-16-progress-tier-3)"></div>
                        <span class="tier-name">${trans[lang].profile.progress.tier.replace('{t}', '3')}</span>
                    </div>
                    <div class="progress-badges-item colourful ${(tier == 4) ? 'active' : ''}" data-tier="4">
                        <div class="bleh-icon" style="--icon: var(--icon-16-progress-tier-4)"></div>
                        <span class="tier-name">${trans[lang].profile.progress.tier.replace('{t}', '4')}</span>
                    </div>
                </div>
            `),
            allowHTML: true
        });
    }

    if (page.name != sponsor_list.sponsor_account && !katsune) {
        let listen_divider = document.createElement('div');
        listen_divider.classList.add('listen-divider');

        profile_header.appendChild(listen_divider);

        create_profile_top_item(profile_header, {
            name: page.name,
            text: scrobbles,
            type: 'scrobbles',
            link: `${root}user/${page.name}/library`,
            tooltip: average
        });
        create_profile_top_item(profile_header, {
            name: page.name,
            text: artists,
            type: 'artists',
            link: `${root}user/${page.name}/library/artists`
        });
        create_profile_top_item(profile_header, {
            name: page.name,
            text: loved,
            type: 'loved',
            link: `${root}user/${page.name}/loved`
        });

        if (!is_own_profile) {
            // taste
            create_profile_top_item(profile_header, {
                name: page.name,
                type: 'taste',
                link: `${root}user/${page.name}/library/artists?date_preset=LAST_30_DAYS&page=1`,
                taste: taste,
                artists: taste_artists,
                avi: profile_avi,
                percent: taste_percentage,
                tooltip: (`
                    <span>
                        ${trans[lang].profile.taste}
                        <!--<div class="taste-badge spacing">
                            <span>${trans[lang].profile.taste_meter.level[taste]}</span>
                            <span>${taste_percentage}</span>
                        </div>-->
                    </span>
                    <div class="hint">${trans[lang].settings.right_click}</div>
                `),
                allow_html: true,
                tooltip_theme: 'stack'
            });
        }
    }

    if (katsune) {
        page.structure.container.querySelector('.redesigned-profile-header').after(profile_header);
    } else {
        if (ff('refreshed_nav'))
            page.structure.container.querySelector('.redesigned-profile-header .info-side').appendChild(profile_header);
        else
            base_header.appendChild(profile_header);
    }
}

function create_profile_top_item(parent, {name, link, text='', type, taste='', artists=[], avi='', percent='', action='', tooltip='', allow_html=false, tooltip_theme='', full=false, primary=false, katsune=false}) {
    log(`creating top item of ${name}, ${link}, ${text}`, 'profile');

    let listen_item = document.createElement((action != 'button') ? 'a' : 'button');
    listen_item.classList.add('btn', 'profile-top-item', `profile-top-item--${type}`, 'view-item');

    if (action != 'button' && type != 'going' && type != 'maybe' && type != 'total') {
        listen_item.setAttribute('href', link);
        //listen_item.setAttribute('target', '_blank');
    } else if (type != 'going' && type != 'maybe' && type != 'total') {
        listen_item.setAttribute('onclick', link);
    }

    if (primary)
        listen_item.classList.add('primary');

    if (type != 'taste') {
        text = text.toLocaleString(lang);
        listen_item.innerHTML = text;
    } else {
        // taste
        listen_item.setAttribute('data-taste', taste);
        listen_item.style.setProperty('--data-taste-percent', percent);
        listen_item.innerHTML = (`
            <img class="view-item-avatar" src="${avi}" alt="${name}">
            <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">
            <!--<div class="taste-badge">${trans[lang].profile.taste_meter.level[taste]}</div>-->
            <div class="taste-badge">${percent}</div>
            ${(artists.length == 1) ? trans[lang].profile.taste_meter.you_share_1.replace('{artist}', artists[0]) : ''}
            ${(artists.length == 2) ? trans[lang].profile.taste_meter.you_share_2.replace('{artist1}', artists[0]).replace('{artist2}', artists[1]) : ''}
            ${(artists.length == 3) ? trans[lang].profile.taste_meter.you_share_3.replace('{artist1}', artists[0]).replace('{artist2}', artists[1]).replace('{artist3}', artists[2]) : ''}
        `);
    }

    if (katsune) {
        full = true;
        listen_item.classList.add('icon');
    }

    if (full) {
        listen_item.classList.add('profile-top-item-full');
        listen_item.textContent = trans[lang].profile[type];
    }

    parent.appendChild(listen_item);

    if (type == 'shortcut') {
        if (name == settings.profile_shortcut) {
            listen_item.setAttribute('data-is-shortcut', 'true');
            listen_item.removeAttribute('onclick');

            if (katsune)
                listen_item.textContent = trans[lang].profile.shortcut.remove;
            else
                tippy(listen_item, {
                    content: trans[lang].profile.shortcut.remove
                });
        } else {
            listen_item.setAttribute('data-is-shortcut', 'false');

            if (katsune)
                listen_item.textContent = trans[lang].profile.shortcut.add;
            else
                tippy(listen_item, {
                    content: trans[lang].profile.shortcut.add
                });
        }

        let menu = tippy(listen_item, {
            theme: 'context-menu',
            content: (`
                <button class="dropdown-menu-clickable-item" onclick="_open_profile_shortcut_window()" data-menu-item="settings">
                    ${trans[lang].settings.configure}
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

        register_menu(listen_item, menu);

        return;
    }

    if (type == 'taste' && artists.length >= 1) {
        let menu = tippy(listen_item, {
            theme: 'context-menu',
            content: (`
                <h4 class="menu-header">${trans[lang].music.compare.header}</h4>
                <a class="dropdown-menu-clickable-item" href="${root}user/${name}/library/music/${sanitise(artists[0])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${avi}" alt="${name}">${artists[0]}
                </a>
                <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(artists[0])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${artists[0]}
                </a>
                ${(artists.length >= 2) ? (`
                <div class="sep"></div>
                <a class="dropdown-menu-clickable-item" href="${root}user/${name}/library/music/${sanitise(artists[1])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${avi}" alt="${name}">${artists[1]}
                </a>
                <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(artists[1])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${artists[1]}
                </a>
                `) : ''}
                ${(artists.length >= 3) ? (`
                <div class="sep"></div>
                <a class="dropdown-menu-clickable-item" href="${root}user/${name}/library/music/${sanitise(artists[2])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${avi}" alt="${name}">${artists[2]}
                </a>
                <a class="dropdown-menu-clickable-item" href="${root}user/${auth.name}/library/music/${sanitise(artists[2])}" data-menu-item="shared-artist">
                    <img class="view-item-avatar" src="${auth.avatar}" alt="${auth.name}">${artists[2]}
                </a>
                `) : ''}
            `),
            allowHTML: true,
            placement: 'right-start',
            trigger: 'manual',
            interactive: true,
            interactiveBorder: 10,
            offset: [0, 0]
        });

        register_menu(listen_item, menu);
    }

    if (katsune)
        return;

    if (tooltip == '')
        tippy(listen_item, {
            content: trans[lang].profile[type]
        });
    else
        tippy(listen_item, {
            content: tooltip,
            allowHTML: allow_html,
            theme: tooltip_theme
        });
}