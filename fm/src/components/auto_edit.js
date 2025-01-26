function bleh_auto_edits() {
    let corrections_panel = document.body.querySelector('#subscription-corrections');
    page.structure.main.appendChild(corrections_panel);


    let nav = page.structure.nav.querySelector('ul');
    let back_nav = document.createElement('li');
    back_nav.classList.add('navlist-item', 'secondary-nav-item', 'secondary-nav-item--back');
    back_nav.innerHTML = (`
        <a class="secondary-nav-item-link" href="${root}settings/subscription">
            ${trans[lang].settings.back}
        </a>
    `);

    nav.insertBefore(back_nav, nav.firstElementChild);
}

function auto_edit_modal() {
    let modal = document.querySelector('.automatic-edit-modal-body-v2');

    if (modal == null)
        return;

    if (modal.hasAttribute('data-bwaa-edit'))
        return;
    modal.setAttribute('data-bwaa-edit', 'true');

    log('auto edit v2', 'modal');


    let checkboxes = modal.querySelectorAll('.checkbox');

    checkboxes.forEach((checkbox) => {
        let id = checkbox.querySelector('input').getAttribute('name');
        let text = checkbox.textContent.trim();

        checkbox.classList = 'toggle-container';
        checkbox.setAttribute('onclick', `_update_inbuilt_item('${id}')`);
        checkbox.innerHTML = (`
            <div class="heading">
                <h5>${text}</h5>
            </div>
            <div class="toggle-wrap">
                <input class="companion-checkbox" type="checkbox" name="${id}" id="inbuilt-companion-checkbox-${id}">
                <span class="btn toggle" id="toggle-${id}" aria-checked="false">
                    <div class="dot"></div>
                </span>
            </div>
        `);
    });
}