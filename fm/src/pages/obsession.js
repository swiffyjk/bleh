export function patch_obsession_view() {
    let obsession_container = document.querySelector('.obsession-container');

    if (!obsession_container)
        return;

    let page_content = obsession_container.querySelector('.page-content');
    page_content.classList.add('obsession-content', 'ignore-katsune');

    let obsession_author = document.querySelector('.obsession-details-intro a').textContent;
    let obsession_avatar = document.querySelector('.obsession-details-intro-avatar-wrap .avatar');

    patch_avatar(obsession_avatar, obsession_author);


    // remove quotations
    let obsession_reason = document.querySelector('.obsession-reason');

    if (!obsession_reason)
        return;

    let obsession_reason_text = obsession_reason.textContent;

    obsession_reason.textContent = obsession_reason_text.trim().substr(1).slice(0, -1);
}