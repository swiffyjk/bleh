import { log } from "./build/log";
import { auth, page, root } from "./build/page";
import { sponsor_list } from "./build/sponsor";
import { lang, trans_legacy } from "./build/trans";
import { dialog } from "./components/dialog";
import { deliver_notif } from "./components/notify";
import { ff } from "./sku";

export function sponsors(force = false) {
    if (!ff('sponsor'))
        return;

    let sponsor_data = localStorage.getItem('kat_sponsors');
    let sponsor_expire = new Date(localStorage.getItem('kat_sponsors_expire'));

    let current_time = new Date();

    if (sponsor_data == null) {
        log('not cached, fetching', 'sponsor');
        sponsor_request(true);
    } else {
        // we prefer to load the current cache before waiting for a new response
        for (var member in sponsor_list) delete sponsor_list[member];
        Object.assign(sponsor_list, JSON.parse(sponsor_data));

        // is it valid?
        if (sponsor_expire < current_time && !force) {
            sponsor_request();
        } else if (force) {
            sponsor_request(true);
        }
    }
}

function sponsor_request(notify = false) {
    let button = document.body.querySelector('[onclick="_sponsor_check()"]');
    if (button != null)
        button.setAttribute('disabled', '');

    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/bleh/fm/badges/badges.json?${Math.random()}`;
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`list responded with ${xhr.status}`, 'sponsor');

        if (xhr.status != 200) {
            log('request has been cancelled, will request again in 1h', 'sponsor');
            api_expire.setHours(api_expire.getHours() + 1);
        }

        // set expire date
        let api_expire = new Date();

        if (xhr.status == 200) {
            for (var member in sponsor_list) delete sponsor_list[member];
            Object.assign(sponsor_list, JSON.parse(this.response));

            if (notify)
                deliver_notif(trans_legacy[lang].settings.home.sponsor.download, false, true, 'sponsor');

            // save to cache for next page load
            localStorage.setItem('kat_sponsors', this.response);
            api_expire.setHours(api_expire.getHours() + 4);
            log(`list cached until ${api_expire}`, 'sponsor');
        }

        localStorage.setItem('kat_sponsors_expire', api_expire);

        if (button != null)
            button.removeAttribute('disabled');
    }

    xhr.send();
}

unsafeWindow._sponsor_check = function() {
    sponsors(true);
}


unsafeWindow._sponsor = function() {
    sponsor();
}
function sponsor() {
    dialog({
        id: 'sponsor',
        title: trans_legacy[lang].settings.home.sponsor.header,
        body: (`
            <div class="modal-vertical-inner support-inner">
                <div class="bleh-icon sponsor-heart"></div>
                <h1>${trans_legacy[lang].settings.home.sponsor.header}</h1>
                <p>${trans_legacy[lang].settings.home.sponsor.bio}</p>
            </div>
            <div class="modal-footer">
                <a class="btn primary sponsor" href="${sponsor_list.sponsor_link}" target="_blank">
                    ${trans_legacy[lang].settings.home.sponsor.name}
                </a>
            </div>
        `),
        type: 'sponsor'
    });
}

unsafeWindow._sponsor_manage = function() {
    sponsor_manage();
}
function sponsor_manage() {
    if (sponsor_list.sponsors_one_time && sponsor_list.sponsors_one_time.includes(auth.name)) {
        dialog({
            id: 'sponsor_manage',
            title: trans_legacy[lang].settings.home.sponsor.header,
            body: (`
                <div class="modal-vertical-inner support-inner">
                    <div class="bleh-icon sponsor-heart"></div>
                    <h1>${trans_legacy[lang].settings.home.sponsor.status.yes}</h1>
                    <p>${trans_legacy[lang].settings.home.sponsor.status.one_time}</p>
                </div>
            `),
            type: 'sponsor'
        });
    } else {
        dialog({
            id: 'sponsor_manage',
            title: trans_legacy[lang].settings.home.sponsor.header,
            body: (`
                <div class="modal-vertical-inner support-inner">
                    <div class="bleh-icon sponsor-heart"></div>
                    <h1>${trans_legacy[lang].settings.home.sponsor.status.yes}</h1>
                    <p>${trans_legacy[lang].settings.home.sponsor.status.badge}</p>
                </div>
                <div class="modal-footer">
                    <a class="btn primary sponsor" href="${root}user/${sponsor_list.sponsor_account}" target="_blank">
                        ${trans_legacy[lang].settings.home.sponsor.manage}
                    </a>
                </div>
            `),
            type: 'sponsor'
        });
    }
}

export function bleh_sponsor_page() {
    document.body.style.removeProperty('--hue-album');
    document.body.style.removeProperty('--sat-album');
    document.body.style.removeProperty('--lit-album');

    let adaptive_skin_container = document.querySelector('.adaptive-skin-container:not([data-bleh])');

    if (adaptive_skin_container == null)
        return;
    adaptive_skin_container.setAttribute('data-bleh','true');

    // initial
    adaptive_skin_container.innerHTML = '';

    log('internal bleh sponsor', 'page');
    page.type = 'bleh_sponsor';
    page.subpage = '';

    sponsor();
}