import { settings } from "../build/config";
import { auth, dialogs, root } from "../build/page";
import { lang, trans_legacy, trans, tl } from "../build/trans";
import { dialog, dialog_legacy, dialog_rm } from "./dialog";
import { deliver_notif, notify } from "./notify";

unsafeWindow._open_profile_shortcut_window = function() {
    dialog_legacy('profile_shortcut',trans_legacy[lang].settings.music.profile_shortcut.name,(`
        <div class="text-container" id="container-profile_shortcut">
            <button class="btn reset" onclick="_reset_item('profile_shortcut')">${tl(trans.reset)}</button>
            <div class="avatar-container">
                <div class="avatar-inner" id="avatar-profile_shortcut">
                    <img id="avatar_src-profile_shortcut" src="${localStorage.getItem('bleh_profile_shortcut_avi') || ''}">
                </div>
            </div>
            <div class="heading content-form">
                <h5>${trans_legacy[lang].settings.music.profile_shortcut.placeholder}</h5>
                <div class="input-container">
                    <input type="text" maxlength="40" id="text-profile_shortcut" value="${settings.profile_shortcut}" placeholder="${trans_legacy[lang].settings.music.profile_shortcut.header}">
                    <button class="bleh--btn primary save" onclick="_save_profile_shortcut()">${trans_legacy[lang].settings.save}</button>
                </div>
            </div>
        </div>
    `), true);
}

unsafeWindow._other_listener = function(id) {
    other_listener(id);
}
export function other_listener(id) {
    let modal = dialog({
        id: 'other_listener',
        title: trans_legacy[lang].music.listens.custom.name,
        body: (`
        <div class="text-container">
            <div class="avatar-container">
                <div class="avatar-inner avatar--bleh-missing">
                    <img>
                </div>
            </div>
            <div class="heading content-form">
                <h5>${trans_legacy[lang].settings.music.profile_shortcut.placeholder}</h5>
                <div class="input-container">
                    <input type="text" maxlength="40" id="text-profile" placeholder="${trans_legacy[lang].settings.music.profile_shortcut.header}">
                    <button class="bleh--btn primary save" onclick="_send_other_listener('${id}')">${trans_legacy[lang].settings.done}</button>
                </div>
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


unsafeWindow._set_profile_as_shortcut = function(button, profile_name) {
    let avatar_src = document.body.querySelector('.header-avatar-inner-wrap img').getAttribute('src');
    localStorage.setItem('bleh_profile_shortcut_avi', avatar_src);
    deliver_notif(trans_legacy[lang].settings.music.profile_shortcut.saved);

    // show on button
    button.setAttribute('data-is-shortcut', 'true');
    button.removeAttribute('onclick');
    // this breaks the configure menu
    //button._tippy.setContent(trans_legacy[lang].profile.shortcut.remove);

    if (button.classList.contains('icon'))
        button.textContent = trans_legacy[lang].profile.shortcut.remove;

    // save to settings
    settings.profile_shortcut = profile_name;
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
                title: trans_legacy[lang].settings.music.profile_shortcut.name,
                body: trans_legacy[lang].settings.music.profile_shortcut.saved,
                icon: 'icon-16-profile-shortcut'
            });

            // save to settings
            settings.profile_shortcut = profile_name;
            localStorage.setItem('bleh', JSON.stringify(settings));
        } catch(e) {
            notify({
                id: 'profile_shortcut_saved',
                title: trans_legacy[lang].settings.music.profile_shortcut.name,
                body: trans_legacy[lang].settings.music.profile_shortcut.failed,
                type: 'error'
            });
            localStorage.removeItem('bleh_profile_shortcut_avi');
            document.getElementById('avatar_src-profile_shortcut').setAttribute('src', '');
        }
    });
}