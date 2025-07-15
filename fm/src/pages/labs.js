import {auth, page, root} from "../build/page.js";

export function bleh_labs() {
    if (page.subpage != 'overview') return;

    let quilt = document.body.querySelector('[data-analytics-action="LaunchAlbumQuilt"]');
    if (quilt) {
        page.avatar = auth.avatar;
        page.name = auth.name;

        quilt.removeAttribute('href');
        quilt.onclick = () => {
            window.location.href = `${root}user/${auth.name}?collage`;
        }
        /*quilt.onclick = () => collage({
            redirect: true
        });*/
    }
}
