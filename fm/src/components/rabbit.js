import {page} from "../build/page.js";
import {dialog, dialog_rm} from "./dialog.js";
import {html} from "lighterhtml";
import {input} from "./input.js";
import {tl, trans} from "../build/trans.js";

export function register_rabbit() {
    page.state.cmd = false;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = true;

        /*notify({
            id: 'key',
            title: e.key
        });*/
        if (page.state.cmd && e.key == ',' && !page.structure.dialogs.hasChildNodes()) {
            // ctrl + k
            rabbit();
        } else if (e.key == 'Escape' && page.structure.dialogs.hasChildNodes() && page.structure.dialogs.querySelector(':scope > [data-modal-type="rabbit"]')) {
            dialog_rm({id: 'rabbit'});
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey || e.metaKey)
            page.state.cmd = false;
    });
}

function rabbit() {
    let input_box;

    page.state.rabbit_modal = dialog({
        id: 'rabbit',
        title: 'rabbit',
        body: html.node`
        ${() => {
            input_box = input({
                maxlength: 100,
                placeholder: tl(trans.anything_you_can_imagine),
                focus: true
            });
            
            return input_box;
        }}
        `,
        type: 'rabbit',
        replace_if_possible: true
    });

    input_box.querySelector('input').focus();
}
