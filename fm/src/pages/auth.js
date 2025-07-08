import {auth, page} from "../build/page.js";
import {register_background, update_page} from "../page.js";
import {log} from "../build/log.js";
import {checkup_page_structure} from "../components/structure.js";

export function bleh_auth() {
    page.structure.container = document.body.querySelector('.page-content');
    try {
        page.structure.row = page.structure.container.querySelector('.row');
        page.structure.main = page.structure.row.querySelector('.col-main');
        page.structure.side = page.structure.row.querySelector('.col-sidebar');
    } catch (e) {
        log('unable to find elements', 'page structure');
    }

    checkup_page_structure();

    register_background(auth.avatar.replace('/avatar42s/', '/ar0/'));

    page.type = 'bleh_auth';
    page.subpage = '';

    log('status is', 'page', 'info', page);

    update_page();

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);
}
