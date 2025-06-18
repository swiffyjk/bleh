import {page} from "../build/page.js";
import {dialog} from "./dialog.js";
import {html} from "lighterhtml";
import {notify} from "./notify.js";

export function register_rabbit() {
    page.state.cmd = false;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            page.state.cmd = true;
        }

        notify({
            id: 'key',
            title: e.key
        });
        if (page.state.cmd && e.key == ',' && !page.structure.dialogs.hasChildNodes()) {
            // ctrl + k
            rabbit();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey || e.metaKey) {
            page.state.cmd = false;
        }
    });
}

function rabbit() {
    page.state.rabbit_modal = dialog({
        id: 'rabbit',
        title: 'rabbit',
        body: html.node`
        rabbit quick switcher
        `,
        type: 'rabbit',
        replace_if_possible: true
    });
}
