import {page, root} from "../build/page.js";
import {tl, trans} from "../build/trans.js";
import {html, render} from "lighterhtml";
import {toggle} from "./toggle.js";

export function dialog_extender() {
    let wrappers = document.body.querySelectorAll(':scope > .popup_wrapper');

    wrappers.forEach(wrapper => {
        let modal_dialog = wrapper.querySelector('.modal-dialog:not([data-dialog-extender])');
        if (!modal_dialog) return;

        modal_dialog.setAttribute('data-dialog-extender', 'true');

        let body = modal_dialog.querySelector('.modal-body');
        let title = body.querySelector('.modal-title');

        let contents = body.querySelector(':scope > div');


        let form = contents.querySelector('form');
        if (!form) return;

        page.token = form.querySelector('[name="csrfmiddlewaretoken"]');

        if (form.getAttribute('action').endsWith('+bookmarks/modal/added')) {
            // bookmark added modal

            title.textContent = tl(trans.saved_to_bookmarks);

            render(contents, html`
                <div class="big-modal-alert">
                    ${{html: tl(trans.bookmark_save_msg).replace('{link}', `<a class="see-more" href="${root}music/+bookmarks">${tl(trans.go_there_now_lower)}</a>`)}}
                </div>
                <form method="post" action="${root}music/+bookmarks/modal/added">
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
        }
    });
}
