import { log } from "../build/log";
import { page, root } from "../build/page";
import { trans, tl } from "../build/trans";
import { html, render } from "lighterhtml";

export function bleh_auto_edits() {
    let corrections_panel = document.body.querySelector('#subscription-corrections');
    page.structure.main.appendChild(corrections_panel);

    // we want the other navigation
    let nav = page.structure.container.querySelector('nav[data-more-string] .navlist-items');

    nav.insertBefore(html.node`
        <li class="navlist-item secondary-nav-item secondary-nav-item--back">
            <a class="secondary-nav-item-link" href="${root}settings/subscription">
                ${tl(trans.back)}
            </a>
        <li>
    `, nav.firstElementChild);
}

export function auto_edit_modal() {
    let modal = document.querySelector('.automatic-edit-modal-body-v2');

    if (!modal) return;

    if (modal.hasAttribute('data-bwaa-edit'))
        return;
    modal.setAttribute('data-bwaa-edit', 'true');

    log('auto edit v2', 'modal');


    let checkboxes = modal.querySelectorAll('.checkbox');

    checkboxes.forEach((checkbox) => {
        let id = checkbox.querySelector('input').getAttribute('name');
        let text = checkbox.textContent.trim();

        checkbox.classList = 'setting';
        checkbox.setAttribute('data-type', 'toggle');
        checkbox.setAttribute('onclick', `_update_inbuilt_item('${id}')`);
        render(checkbox, html`
            <div class="heading">
                <h5>${text}</h5>
            </div>
            <div class="toggle-wrap">
                <input class="companion-checkbox" type="checkbox" name="${id}" id="inbuilt-companion-checkbox-${id}">
                <span class="btn toggle" id="toggle-${id}" aria-checked="false">
                    <div class="dot"></div>
                </span>
            </div>
        `)
    });
}