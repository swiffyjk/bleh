export function patch_avatar(avatar, name, type = '') {
    if (avatar.hasAttribute('data-bleh-avatar'))
        return;
    avatar.setAttribute('data-bleh-avatar', 'true');

    let avatar_img = avatar.querySelector('img');
    if (avatar_img == null)
        return;

    // last.fm bug: it uses 64s instead of avatar70s for
    // event attendees - this causes it to center in the middle of the image
    // rather than the top
    avatar_img.setAttribute('src', avatar_img.getAttribute('src').replace('/64s/', '/avatar70s/'));

    let badges = load_badges(name, true);

    if (badges) {
        // remove pre-existing badge
        let pre_existing_badge = avatar.querySelector('.avatar-status-dot');
        if (pre_existing_badge !== null)
            avatar.removeChild(pre_existing_badge);

        avatar.setAttribute('title','');

        let this_badge = sponsor_list.badges[name];
        if (!Array.isArray(sponsor_list.badges[name])) {
            // default
            log(`@${name} 1 badge:`, 'shout', 'info', sponsor_list.badges[name]);
        } else {
            // multiple
            log(`@${name} multiple badges:`, 'shout', 'info', sponsor_list.badges[name]);
            let badges_length = Object.keys(sponsor_list.badges[name]).length - 1;
            this_badge = sponsor_list.badges[name][badges_length];
            log(`@${name} using badge ${badges_length} as primary`, 'shout', 'info', this_badge);
        }

        // make new badge
        let badge = document.createElement('span');
        badge.classList.add('avatar-status-dot',`user-status--bleh-${this_badge.type}`,`user-status--bleh-user-${name}`);
        avatar.appendChild(badge);

        avatar.classList.add('avatar-can-hoverbox');
        tippy(avatar, {
            theme: 'user',
            content: (`
                <div class="image-info">
                    <div class="inner-image">
                        ${avatar_img.outerHTML}
                    </div>
                    <div class="info">
                        <h5 class="title">${name}</h5>
                        <p class="descriptor">${trans[lang].profile.top_badge}</p>
                        <p class="badge user-status--bleh-${this_badge.type} user-status--bleh-user-${name}" data-badge-type="${this_badge.type}" data-badge-user="${name}">${this_badge.name}</p>
                    </div>
                    <a href="${root}user/${name}" class="link-over"></a>
                </div>
                <div class="user-buttons view-buttons">
                    <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${trans[lang].actions.view_library}</a>
                    <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${trans[lang].actions.leave_a_shout}</a>
                </div>
            `),
            allowHTML: true,
            delay: [50, 100],
            placement: 'right',
            interactive: true,
            delay: [200, 0]
        });

        return this_badge;
    } else {
        let pre_existing_badge = avatar.querySelector('.avatar-status-dot');
        if (pre_existing_badge == null) {
            avatar.classList.add('avatar-can-hoverbox');
            tippy(avatar, {
                theme: 'user',
                content: (`
                    <div class="image-info">
                        <div class="inner-image">
                            ${avatar_img.outerHTML}
                        </div>
                        <div class="info">
                            <h5 class="title">${name}</h5>
                        </div>
                        <a href="${root}user/${name}" class="link-over"></a>
                    </div>
                    <div class="user-buttons view-buttons">
                        <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${trans[lang].actions.view_library}</a>
                        <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${trans[lang].actions.leave_a_shout}</a>
                    </div>
                `),
                allowHTML: true,
                delay: [50, 100],
                placement: 'right',
                interactive: true,
                delay: [200, 0]
            });

            return {};
        } else {
            avatar.classList.add('avatar-can-hoverbox');
            tippy(avatar, {
                theme: 'user',
                content: (`
                    <div class="image-info">
                        <div class="inner-image">
                            ${avatar_img.outerHTML}
                        </div>
                        <div class="info">
                            <h5 class="title">${name}</h5>
                            <p class="descriptor">${trans[lang].profile.top_badge}</p>
                            <p class="badge ${pre_existing_badge.classList[1]}">${avatar.getAttribute('title')}</p>
                        </div>
                        <a href="${root}user/${name}" class="link-over"></a>
                    </div>
                    <div class="user-buttons view-buttons">
                        <a class="btn view-item user-button view-library-btn" href="${root}user/${name}/library">${trans[lang].actions.view_library}</a>
                        <a class="btn view-item user-button leave-shout-btn" href="${root}user/${name}/shoutbox">${trans[lang].actions.leave_a_shout}</a>
                    </div>
                `),
                allowHTML: true,
                delay: [50, 100],
                placement: 'right',
                interactive: true,
                delay: [200, 0]
            });
            avatar.setAttribute('title', '');

            return {
                type: pre_existing_badge.classList[1]
            };
        }
    }
}

export function return_name_from_avatar(avatar) {
    if (!avatar)
        return;

    if (!avatar.hasAttribute('alt'))
        return;

    if (avatar.getAttribute('alt') == trans[lang].avatar_for_me)
        return auth;

    return avatar.getAttribute('alt').replace(trans[lang].avatar_for_user, '');
}

unsafeWindow._expand_avatar = function(src) {
    expand_avatar(src);
}
export function expand_avatar(src) {
    dialog({
        id: 'avatar',
        body: (`
            <div class="full-avatar-wrapper">
                <div class="full-avatar">
                    <img src="${src}">
                </div>
                <div class="modal-footer">
                    <a class="btn primary open" href="${src}" target="_blank">
                        ${trans[lang].profile.open_avatar}
                    </a>
                </div>
            </div>
        `),
        type: 'avatar',
        has_overlays: false
    });
}