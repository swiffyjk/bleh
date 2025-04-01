function bleh_about_artist() {
    let legacy_container = page.structure.main.querySelector('.about-artist');

    if (legacy_container == null)
        return;

    let avatar = legacy_container.querySelector('.gallery-preview-image--0 img');
    let listeners = legacy_container.querySelector('.about-artist-listeners');
    let tags = legacy_container.querySelector('.about-artist-tags');

    let wiki = legacy_container.querySelector('.wiki-block.visible-lg');
    if (wiki != null)
        wiki.classList.remove('visible-lg');

    let about_artist_container = legacy_container.parentElement;
    about_artist_container.classList.add('about-artist-container');

    about_artist_container.innerHTML = (`
        <div class="about-artist-panel">
            <div class="avatar-side">
                ${(avatar != null) ? `<img src="${avatar.getAttribute('src')}"><a onclick="_expand_avatar('${avatar.getAttribute('src').replace('/300x300/', '/ar0/')}')" class="bleh--avatar-clickable-link"></a>` : '<img class="missing-artist">'}
            </div>
            <div class="info-side">
                <div class="sub-text">${trans[lang].music.about}</div>
                <h1><a href="${root}music/${sanitise(page.sister)}">${sanitise_text(page.sister)}</a></h1>
                ${(listeners != null) ? listeners.outerHTML : ''}
                ${(tags != null) ? tags.outerHTML : ''}
                ${(wiki != null) ? wiki.outerHTML : ''}
            </div>
        </div>
        ${(page.sister_others.length > 0) ? `<div class="sep"></div><div class="sub-text">${trans[lang].music.about_guests}</div>` : ''}
    `);

    // there are guest features
    if (page.sister_others.length > 0) {
        let guest_feature_panel = document.createElement('div');
        guest_feature_panel.classList.add('about-guest-features-panel');

        for (let guest in page.sister_others) {
            let guest_element = document.createElement('a');
            guest_element.classList.add('about-guest-feature');
            guest_element.setAttribute('href', `${root}music/${sanitise(page.sister_others[guest])}`);
            guest_element.textContent = page.sister_others[guest];

            guest_feature_panel.appendChild(guest_element);
        }

        about_artist_container.appendChild(guest_feature_panel);
    }
}