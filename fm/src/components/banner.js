import {auth, page, root} from "../build/page.js";
import {render} from "lighterhtml";
import {markdown} from "./markdown.js";

export function load_banner(name = page.name) {
    let banners = JSON.parse(localStorage.getItem('bleh_profile_banners')) || {};

    if (banners[name]) {
        if (banners[name] == 'none')
            return;

        return banners[name];
    } else {
        request_banner(name);
    }
}

function bio_parse(text, cache = false) {
    let temp = document.createElement('div');

    render(temp, markdown(text.textContent, {
        allow_headers: true
    }))

    let banner = temp.querySelector('img[alt="banner"]');
    if (banner) {
        save_banner_to_cache(banner.getAttribute('src'), name);
        return banner.getAttribute('src');
    } else {
        save_banner_to_cache('none');
        return 'none';
    }
}

function request_banner(name = page.name) {
    fetch(`${root}user/${name}`)
        .then(function (response) {
            console.log('returned', response, response.text);

            return response.text();
        })
        .then(function (html) {
            let doc = new DOMParser().parseFromString(html, 'text/html');
            console.log('DOC', doc);

            let about_me_sidebar = doc.querySelector('.about-me-sidebar');
            if (about_me_sidebar) {
                let about_me_text = about_me_sidebar.querySelector('p');
                return bio_parse(about_me_text, true);
            } else {
                save_banner_to_cache('none');
                return 'none';
            }
        });
}

export function save_banner_to_cache(img, name = page.name) {
    let banners = JSON.parse(localStorage.getItem('bleh_profile_banners')) || {};

    let banners_o = Object.keys(banners);
    if (banners_o.length > 150) {
        // remove first item of object
        let keys = Reflect.ownKeys(banners);
        if (banners[keys[0]] != auth.name)
            delete banners[keys[0]];
        else
            delete banners[keys[1]];

        // then move this to the bottom
        delete banners[page.name];
        banners[page.name] = img;
    } else {
        banners[page.name] = img;
    }

    localStorage.setItem('bleh_profile_banners', JSON.stringify(banners));
}
