import {update_page} from "../page.js";
import {auth, page, root} from "../build/page.js";
import {html, render} from "lighterhtml";
import {tl, trans} from "../build/trans.js";
import {collage} from "../components/collage.js";
import {compare} from "../components/compare.js";

let valid_minis;

export function bleh_minis(skip = false) {
    if (!skip) {
        update_page();

        // remove error stuff cus we control this page
        page.structure.row.removeChild(page.structure.row.firstElementChild);
        page.structure.row.removeChild(page.structure.row.firstElementChild);
    }

    let params = new URLSearchParams(document.location.search);
    page.requested.profile = params.get('profile') || auth.name;
    page.requested.secondary = params.get('secondary');
    page.requested.redirect = params.get('redirect');
    page.requested.type = params.get('type');
    page.requested.timeframe = params.get('timeframe');

    let path = window.location.pathname.split('/');
    let mini = path[path.length - 1];

    if (mini == 'minis') mini = null;

    valid_minis = {
        collage: {
            name: tl(trans.collage),
            body: tl(trans.collage_description),
            func: bleh_minis_collage
        },
        compare: {
            name: tl(trans.compare),
            body: tl(trans.compare_description),
            func: bleh_minis_compare
        },
        pixel: {
            name: tl(trans.pixel?.name),
            body: tl(trans.pixel?.body),
            func: bleh_minis_pixel
        },
        rainbow: {
            name: tl(trans.rainbow?.name),
            body: tl(trans.rainbow?.body),
            func: bleh_minis_rainbow
        },
        receipt: {
            name: tl(trans.receipt?.name),
            body: tl(trans.receipt?.body),
            func: bleh_minis_receipt
        }
    }

    if (mini && !valid_minis[mini]) {
        render(page.structure.main, html`
            <div class="loading-data-container">
                <div class="loading-data-text error">${tl(trans.no_mini_found).replace('{v}', mini)}</div>
            </div>
        `);
        return;
    }

    render(page.structure.side, html``);

    page.avatar = '';
    page.name = page.requested.profile;
    if (page.name == auth.name) page.avatar = auth.avatar;

    if (mini) {
        page.structure.container.setAttribute('data-mini', mini);

        valid_minis[mini].func();
        return;
    }

    render(page.structure.main, html`
        <section class="minis">
            <div class="minis-header">
                <h2>${tl(trans.minis)}</h2>
            </div>
            <div class="mini-list">
                ${Object.entries(valid_minis).map(([id, mini]) => html.node`
                    <button class="mini" data-type=${id} data-mini=${id} onclick=${() => {
                        window.history.replaceState(id, '', `${root}bleh/minis/${id}`);
                        page.structure.container.setAttribute('data-mini', id);
                        render(page.structure.main, html``);
                        valid_minis[id].func();
                    }}>
                        <div class="mini-icon colourful">
                            <div class="bleh-icon" />
                        </div>
                        <div class="mini-info">
                            <h5>${mini.name}</h5>
                            <p>${mini.body}</p>
                        </div>
                        <div class="bleh-icon mini-arrow" style="--icon: var(--mask)" data-type="arrow-right" />
                    </button>
                `)}
            </div>
            <p class="card-tip">${{html: tl(trans.labs_cta).replace('{a}', `<a class="see-more" href="${root}labs">`).replace('{/a}', '</a>')}}</p>
        </section>
    `);
}

function return_to_minis(mini) {
    return html.node`
        <div class="minis-header">
            <h2 class="previous" onclick=${() => {
                window.history.replaceState(null, '', `${root}bleh/minis`);
                bleh_minis(true);
            }}>${tl(trans.minis)}</h2>
            <div class="bleh-icon mini-arrow" style="--icon: var(--mask)" data-type="arrow-right" />
            <h2>${valid_minis[mini].name}</h2>
        </div>
    `;
}

function bleh_minis_collage() {
    let content;
    let mini_settings;

    render(page.structure.main, html`
        <section class="minis">
            ${return_to_minis('collage')}
            <div class="minis-content" ref=${el => content = el} />
        </section>
    `);

    render(page.structure.side, html`
        <section class="current-mini-settings" ref=${el => mini_settings = el} />
    `);

    collage({
        host: content,
        sidebar: mini_settings
    });
}

function bleh_minis_compare() {
    let content;
    let mini_settings;

    render(page.structure.main, html`
        <section class="minis">
            ${return_to_minis('compare')}
            <div class="minis-content" ref=${el => content = el} />
        </section>
    `);

    render(page.structure.side, html`
        <section class="current-mini-settings" ref=${el => mini_settings = el} />
    `);

    compare({
        host: content,
        sidebar: mini_settings
    });
}

function bleh_minis_pixel() {
    render(page.structure.main, html`
        <section class="minis">
            ${return_to_minis('pixel')}
        </section>
    `);
}

function bleh_minis_rainbow() {
    render(page.structure.main, html`
        <section class="minis">
            ${return_to_minis('rainbow')}
        </section>
    `);
}

function bleh_minis_receipt() {
    render(page.structure.main, html`
        <section class="minis">
            ${return_to_minis('receipt')}
        </section>
    `);
}

export function render_user(name, avatar, user, replace_page = false) {
    if (avatar == '' && name != '') {
        fetch(`${root}user/${name}/tags`)
            .then(function (response) {
                console.log('returned', response, response.text);

                return response.text();
            })
            .then(function (dom) {
                let doc = new DOMParser().parseFromString(dom, 'text/html');
                console.log('DOC', doc);

                try {
                    avatar = doc.querySelector('.header-avatar-inner-wrap img').getAttribute('src');
                    name = doc.querySelector('.header-title').textContent.trim();

                    if (replace_page) {
                        page.avatar = avatar;
                        page.name = name;
                    }

                    if (!user) user = page.structure.main.querySelector('.compare-user.focus');
                    render(user, render_user(name, avatar, user, replace_page));
                } catch (e) {
                    console.error(e);
                }
            });

        return html`
            <div class="avatar loading" />
            <strong>${name}</strong>
        `;
    }

    return html`
        <div class="avatar">
            <img src=${avatar} alt=${tl(trans.avatar_for_user).replace('{u}', name)}>
        </div>
        <strong>${name}</strong>
    `;
}