import {html, render} from "lighterhtml";
import {page, root} from "../build/page";
import {sanitise, sanitise_text} from "../build/tools";
import {tl, trans, trans_legacy} from "../build/trans";
import {expand_avatar} from "../avatar";

export function bleh_about_artist() {
    let legacy_container = page.structure.main.querySelector('.about-artist');

    if (!legacy_container)
        return;

    let avatar = legacy_container.querySelector('.gallery-preview-image--0 img');
    let listeners = legacy_container.querySelector('.about-artist-listeners');
    let tags = legacy_container.querySelector('.about-artist-tags');

    let wiki = legacy_container.querySelector('.wiki-block.visible-lg');
    if (wiki != null)
        wiki.classList.remove('visible-lg');

    let about_artist_container = legacy_container.parentElement;
    about_artist_container.classList.add('about-artist-container');

    render(about_artist_container, html`
        <div class="about-artist-panel">
            <div class="avatar-side">
                ${(avatar != null) ? html.node`<img src="${avatar.getAttribute('src')}"><a onclick=${() => expand_avatar(avatar.getAttribute('src').replace('/300x300/', '/ar0/'))} class="bleh--avatar-clickable-link"></a>` : html.node`<img class="missing-artist">`}
            </div>
            <div class="info-side">
                <div class="sub-text">${tl(trans.about)}</div>
                <h1><a href="${root}music/${sanitise(page.sister)}">${sanitise_text(page.sister)}</a></h1>
                ${(listeners != null) ? html.node([listeners.outerHTML]) : ''}
                ${(tags != null) ? html.node([tags.outerHTML]) : ''}
                ${(wiki != null) ? html.node([wiki.outerHTML]) : ''}
            </div>
        </div>
        ${(page.sister_others.length > 0) ? html.node`<div class="sep"></div><div class="sub-text">${trans_legacy.en.music.about_guests}</div>` : ''}
    `)

    // there are guest features
    if (page.sister_others.length > 0) {
        about_artist_container.appendChild(html.node`
            <div class="about-guest-features-panel">
                ${page.sister_others.map((guest) => {
                    return html.node`
                        <a class="about-guest-feature" href="${root}music/${sanitise(guest)}">
                            ${guest}
                        </a>
                    `
                })}
            </div>
        `);
    }

    page.structure.side.appendChild(about_artist_container);
}
