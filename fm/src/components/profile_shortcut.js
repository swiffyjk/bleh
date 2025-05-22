import { settings } from "../build/config";
import { auth, dialogs, page, root } from "../build/page";
import { lang, trans_legacy, trans, tl } from "../build/trans";
import { dialog, dialog_legacy, dialog_rm } from "./dialog";
import { deliver_notif, notify } from "./notify";

unsafeWindow._open_profile_shortcut_window = function() {
    open_profile_shortcut_window();
}
export function open_profile_shortcut_window() {
    let modal = dialog({
        id: 'profile_shortcut',
        title: tl(trans.profile_shortcut.name),
        body: (`
        <div class="setting" data-type="text" id="container-profile_shortcut">
            <div class="avatar-container">
                <div class="avatar-inner" id="avatar-profile_shortcut">
                    <img id="avatar_src-profile_shortcut" src="${localStorage.getItem('bleh_profile_shortcut_avi') || ''}">
                </div>
            </div>
            <div class="input-container content-form">
                <input type="text" maxlength="40" id="text-profile_shortcut" value="${settings.profile_shortcut}" placeholder="${tl(trans.enter_username)}">
                <button class="btn chibi icon primary submit" onclick="_save_profile_shortcut()">${tl(trans.save)}</button>
            </div>
        </div>
        `)
    });

    modal.querySelector('#text-profile_shortcut').focus();
}

unsafeWindow._other_listener = function(id) {
    other_listener(id);
}
export function other_listener(id) {
    let modal = dialog({
        id: 'other_listener',
        title: trans_legacy.en.music.listens.custom.name,
        body: (`
        <div class="setting" data-type="text">
            <div class="avatar-container">
                <div class="avatar-inner avatar--bleh-missing">
                    <img>
                </div>
            </div>
            <div class="input-container content-form">
                <input type="text" maxlength="40" id="text-profile" placeholder="${tl(trans.enter_username)}">
                <button class="btn chibi icon primary submit" onclick="_send_other_listener('${id}')">${tl(trans.done)}</button>
            </div>
        </div>
        `)
    });

    modal.querySelector('#text-profile').focus();
}
unsafeWindow._send_other_listener = function(link) {
    let name = dialogs['other_listener'].instance.querySelector('#text-profile').value;

    dialog_rm({
        id: 'other_listener'
    });
    window.location.href = `${root}user/${name}/library/music/${link}`;
}


unsafeWindow._set_profile_as_shortcut = function(button) {
    page.state.profile_shortcut_button = button;

    dialog({
        id: 'profile_shortcut',
        title: tl(trans.profile_shortcut.name),
        body: (`
        <div class="big-modal-alert alert-danger">
            ${tl(trans.profile_shortcut.notice).replace('{u}', `<a class="mention" href="${root}user/${settings.profile_shortcut}" target="_blank">@${settings.profile_shortcut}</a>`)}
        </div>
        <div class="modal-footer">
            <button class="see-more cancel" onclick="_dialog_rm({id:'profile_shortcut'})">
                ${tl(trans.back)}
            </button>
            <div class="fill"></div>
            <button class="btn primary save" onclick="_confirm_set_profile_as_shortcut()">
                ${tl(trans.replace)}
            </button>
        </div>
        `)
    });
}

unsafeWindow._confirm_set_profile_as_shortcut = function() {
    confirm_set_profile_as_shortcut();
}
function confirm_set_profile_as_shortcut() {
    dialog_rm({
        id: 'profile_shortcut'
    });

    let avatar_src = document.body.querySelector('.header-avatar-inner-wrap img').getAttribute('src');
    localStorage.setItem('bleh_profile_shortcut_avi', avatar_src);
    notify({
        id: 'profile_shortcut_saved',
        title: tl(trans.profile_shortcut.name),
        body: tl(trans.profile_shortcut.linked).replace('{u}', page.name),
        icon: 'icon-16-profile-shortcut'
    });

    // show on button
    page.state.profile_shortcut_button.setAttribute('data-is-shortcut', 'true');
    page.state.profile_shortcut_button.removeAttribute('onclick');

    // save to settings
    settings.profile_shortcut = page.name;
    localStorage.setItem('bleh', JSON.stringify(settings));
}

unsafeWindow._save_profile_shortcut = function() {
    let profile_name = document.getElementById('text-profile_shortcut').value;
    let profile_img = document.getElementById('avatar-profile_shortcut');

    if (profile_name == '' || profile_name == auth.name) {
        localStorage.removeItem('bleh_profile_shortcut_avi');
        document.getElementById('avatar_src-profile_shortcut').setAttribute('src', '');

        // save to settings
        settings.profile_shortcut = '';
        localStorage.setItem('bleh', JSON.stringify(settings));

        return;
    }

    profile_img.classList.add('requesting');

    fetch(`${root}user/${profile_name}/tags`)
    .then(function(response) {
        console.log('returned', response, response.text);

        return response.text();
    })
    .then(function(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        console.log('DOC', doc);

        profile_img.classList.remove('requesting');

        try {
            let avatar_src = doc.querySelector('.header-avatar-inner-wrap img').getAttribute('src');
            localStorage.setItem('bleh_profile_shortcut_avi', avatar_src);
            document.getElementById('avatar_src-profile_shortcut').setAttribute('src', avatar_src);
            notify({
                id: 'profile_shortcut_saved',
                title: tl(trans.profile_shortcut.name),
                body: tl(trans.profile_shortcut.linked).replace('{u}', profile_name),
                icon: 'icon-16-profile-shortcut'
            });

            // save to settings
            settings.profile_shortcut = profile_name;
            localStorage.setItem('bleh', JSON.stringify(settings));
        } catch(e) {
            notify({
                id: 'profile_shortcut_saved',
                title: tl(trans.profile_shortcut.name),
                body: tl(trans.failed_to_find_profile),
                type: 'error'
            });
            localStorage.removeItem('bleh_profile_shortcut_avi');
            document.getElementById('avatar_src-profile_shortcut').setAttribute('src', '');
        }
    });
}