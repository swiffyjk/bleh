import {register_background, update_page} from "../page.js";
import {auth, page} from "../build/page.js";
import {log} from "../build/log.js";
import {checkup_page_structure} from "../components/structure.js";
import {html, render} from "lighterhtml";

export function mualani() {
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

    page.type = 'bleh_mualani';
    page.subpage = '';

    log('status is', 'page', 'info', page);

    update_page();

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);

    render(page.structure.main, html`
        <section class="flexy">
            <h2>Buttons</h2>
            <div class="button-group">
                <button>Button</button>
                <button class="primary">Button</button>
                <button disabled>Button</button>
                <button class="primary" disabled>Button</button>
            </div>
            <div class="button-group">
                <button class="danger-subtle">Button</button>
                <button class="primary danger">Button</button>
                <button class="danger-subtle" disabled>Button</button>
                <button class="primary danger" disabled>Button</button>
            </div>
        </section>
        <section class="flexy">
            <h2>Settings</h2>
            <div class="setting-group">
                
            </div>
        </section>
    `);
}
