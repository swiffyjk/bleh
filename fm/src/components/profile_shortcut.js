unsafeWindow._open_profile_shortcut_window = function() {
    dialog_legacy('profile_shortcut',trans[lang].settings.music.profile_shortcut.name,(`
        <div class="text-container" id="container-profile_shortcut">
            <button class="btn reset" onclick="_reset_item('profile_shortcut')">${trans[lang].settings.reset}</button>
            <div class="avatar-container">
                <div class="avatar-inner" id="avatar-profile_shortcut">
                    <img id="avatar_src-profile_shortcut" src="${localStorage.getItem('bleh_profile_shortcut_avi') || ''}">
                </div>
            </div>
            <div class="heading content-form">
                <h5>${trans[lang].settings.music.profile_shortcut.placeholder}</h5>
                <div class="input-container">
                    <input type="text" maxlength="40" id="text-profile_shortcut" value="${settings.profile_shortcut}" placeholder="${trans[lang].settings.music.profile_shortcut.header}">
                    <button class="bleh--btn primary save" onclick="_save_profile_shortcut()">${trans[lang].settings.save}</button>
                </div>
            </div>
        </div>
    `), true);
}

unsafeWindow._other_listener = function(id) {
    dialog({
        id: 'other_listener',
        title: trans[lang].music.listens.custom.name,
        body: (`
        <div class="text-container">
            <div class="avatar-container">
                <div class="avatar-inner avatar--bleh-missing">
                    <img>
                </div>
            </div>
            <div class="heading content-form">
                <h5>${trans[lang].settings.music.profile_shortcut.placeholder}</h5>
                <div class="input-container">
                    <input type="text" maxlength="40" id="text-profile" placeholder="${trans[lang].settings.music.profile_shortcut.header}">
                    <button class="bleh--btn primary save" onclick="_send_other_listener('${id}')">${trans[lang].settings.done}</button>
                </div>
            </div>
        </div>
        `)
    });
}
unsafeWindow._send_other_listener = function(link) {
    let name = dialogs['other_listener'].instance.querySelector('#text-profile').value;

    dialog_rm({
        id: 'other_listener'
    });
    window.location.href = `${root}user/${name}/library/music/${link}`;
}