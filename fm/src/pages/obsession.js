function patch_obsession_view() {
    let obsession_container = document.querySelector('.obsession-container');

    if (obsession_container == null)
        return;

    if (obsession_container.hasAttribute('data-kate-processed'))
        return;
    obsession_container.setAttribute('data-kate-processed', 'true');

    let obsession_author = document.querySelector('.obsession-details-intro a').textContent;
    let obsession_avatar = document.querySelector('.obsession-details-intro-avatar-wrap .avatar');

    patch_avatar(obsession_avatar, obsession_author);


    // remove quotations
    let obsession_reason = document.querySelector('.obsession-reason');

    if (obsession_reason == null)
        return;

    let obsession_reason_text = obsession_reason.textContent;

    obsession_reason.textContent = obsession_reason_text.trim().substr(1).slice(0, -1);
}