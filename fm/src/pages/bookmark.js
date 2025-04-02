import { basic_page_structure } from "../components/structure";

export function bleh_bookmarks() {
    basic_page_structure();

    let content_top = document.body.querySelector('.content-top');
    if (content_top)
        content_top.classList.add('legacy-content-top');
}