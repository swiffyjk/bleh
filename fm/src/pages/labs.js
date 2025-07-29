import {auth, page, root} from "../build/page.js";

export function bleh_labs() {
    if (page.subpage != 'overview') return;

    let quilt = document.body.querySelector('[data-analytics-action="LaunchAlbumQuilt"]');
    if (quilt) {
        page.avatar = auth.avatar;
        page.name = auth.name;

        quilt.setAttribute('href', `${root}bleh/minis/collage?redirect=true`);
        quilt.removeAttribute('target');
    }
}
