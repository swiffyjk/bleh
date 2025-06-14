import {html, render} from "lighterhtml";
import {tl, trans} from "./build/trans.js";
import {sponsor_list} from "./build/sponsor.js";
import {root} from "./build/page.js";
import {sponsor} from "./sponsor.js";

export function bleh_footer() {
    let footer = document.body.querySelector('footer');

    let extras = html.node`
        <div class="footer-extras">
            ${footer.querySelector('.footer-top')}
            ${footer.querySelector('.footer-bottom')}
        </div>
    `;

    let kate = 'katelyn';
    if (sponsor_list && sponsor_list.special)
        kate = sponsor_list.special[0];

    render(footer, html`
        <div class="footer-credit">
            ${{html: tl(trans.made_with_love).replace('{u}', `<a href="${root}user/${kate}">${kate}</a>`).replace('{h}', `<span class="bleh-icon heart sponsor-related">${tl(trans.love_lower)}</span>`)}}
        </div>
        <div class="footer-web">
            <a href="https://github.com/katelyynn/bleh" target="_blank">${tl(trans.view_source)}</a>
            <a href="https://github.com/katelyynn/bleh/issues/new/choose" target="_blank">${tl(trans.report_issue)}</a>
            <a class="more" onclick=${() => extras.toggleAttribute('aria-expanded')}><span class="bleh-icon" /></a>
        </div>
        ${extras}
    `);

    let heart = footer.querySelector('.heart');
    heart.addEventListener('click', () => sponsor());

    tippy(heart, {
        content: tl(trans.sponsor)
    });
}
