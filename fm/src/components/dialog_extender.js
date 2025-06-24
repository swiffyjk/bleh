import {page, root} from "../build/page.js";
import {tl, trans} from "../build/trans.js";
import {html, render} from "lighterhtml";
import {toggle} from "./toggle.js";
import {log} from "../build/log.js";

export function dialog_extender() {
    // data-processed=true is signature of bulk edit
    let wrappers = document.body.querySelectorAll(':scope > :is(.popup_wrapper, div[data-processed="true"] > .popup_wrapper)');

    wrappers.forEach(wrapper => {
        let modal_dialog = wrapper.querySelector('.modal-dialog:not([data-dialog-extender])');
        if (!modal_dialog) return;

        modal_dialog.setAttribute('data-dialog-extender', 'true');

        let body = modal_dialog.querySelector('.modal-body');
        let title = body.querySelector('.modal-title');

        let contents = body.querySelector(':scope > div');


        let form = contents.querySelector('form');
        if (!form) return;

        let dismiss = modal_dialog.querySelector('.modal-dismiss');

        page.token = form.querySelector('[name="csrfmiddlewaretoken"]').getAttribute('value');

        if (form.getAttribute('action').endsWith('+bookmarks/modal/added')) {
            // bookmark added modal

            title.textContent = tl(trans.saved_to_bookmarks);

            let new_form;
            render(contents, html`
                <div class="big-modal-alert">
                    ${{html: tl(trans.bookmark_save_msg).replace('{link}', `<a class="see-more" href="${root}music/+bookmarks">${tl(trans.go_there_now_lower)}</a>`)}}
                </div>
                <form method="post" ref=${el => new_form = el} onsubmit=${async (e) => {
                    e.preventDefault();
                    
                    let url = `${root}music/+bookmarks/modal/added`;
                    let form_data = new FormData(new_form);
                    
                    console.info(form_data);

                    try {
                        await fetch(url, {
                            method: 'POST',
                            body: form_data
                        }).then(res => {
                            let data = res.json();
                            
                            log('received response', 'form', 'info', {data: data});
                            dismiss.click();
                        });
                    } catch(e) {
                        console.error(e);
                    }
                }}>
                    <input type="hidden" name="csrfmiddlewaretoken" value="${page.token}">
                    <div class="modal-footer">
                        ${toggle({
                            value: true,
                            type: 'checkbox',
                            name: 'always_show',
                            title: tl(trans.always_remind_me)
                        })}
                        <button class="btn primary done" type="submit">
                            ${tl(trans.done)}
                        </button>
                    </div>
                </form>
            `);
        } else if (body.classList.contains('automatic-edit-modal-body-v2')) {
            // automatic edit v2
            return;

            // we use this to detect the bulk edit extension
            let bulk_edit_active = false;

            let edit_all = body.querySelector('[name="edit_all"]');
            if (edit_all.disabled) bulk_edit_active = true;

            if (!bulk_edit_active)
                title.textContent = tl(trans.edit_scrobble);
            else
                title.textContent = tl(trans.edit_scrobbles_in_bulk);

            modal_dialog.classList.add('automatic-edit-modal');

            let checkboxes = body.querySelectorAll('.checkbox');

            checkboxes.forEach((checkbox) => {
                let input_el = checkbox.querySelector('input');
                let value = input_el.checked;
                let name = input_el.getAttribute('name');
                let text = checkbox.textContent.trim();
                let disabled = input_el.disabled;

                render(checkbox.parentElement, html`
                    ${toggle({
                        value: value,
                        type: 'checkbox',
                        name: name,
                        title: text,
                        disabled: disabled
                    })}
                `);
            });

            let submit = body.querySelector('.form-group--submit');
            submit.classList = 'modal-footer';

            render(submit, html`
                <button class="see-more cancel" type="button" onclick=${() => dismiss.click()}>
                    ${tl(trans.cancel)}
                </button>
                <div class="fill" />
                <button class="btn primary icon" data-type="item-edit" type="submit">
                    ${tl(trans.edit)}
                </button>
            `);
        } else if (body.querySelector('.lastfm-bulk-edit-list')) {
            // bulk edit
            // select albums to edit


        }
    });
}
