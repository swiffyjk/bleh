//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {root} from "../build/page";
import {html} from "lighterhtml";
import {patch_wiki_contents} from "../pages/wiki.js";
import {redirect} from "./music.js";
import showdown from "showdown";
import DOMPurify from "dompurify";
import {tl, trans} from "../build/trans.js";

export function markdown(text, {
    allow_headers = false,
    allow_links = true,
    line_breaks = true,
    allow_banners = false
}={}) {
    const ALLOWED_TAGS = [
        'div', 'p', 'span', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'code', 'img'
    ];
    const ALLOWED_ATTR = [
        'href', 'class', 'target', 'src', 'alt', 'title'
    ];


    const banner = () => [{
        type: 'lang',
        regex: /\[banner=([^\]]+)\]/g,
        replace: (_, url) => {
            try {
                const safe = new URL(url);
                if (!['http:', 'https:'].includes(safe.protocol)) return '';

                const escaped = safe.href.replace(/"/g, '&quot;');

                const image = `<img src="${escaped}" alt="banner" loading="lazy">`;

                return DOMPurify.sanitize(image, {
                    ALLOWED_TAGS: ['img'],
                    ALLOWED_ATTR: ['src', 'alt', 'loading']
                });
            } catch {
                return '';
            }
        }
    }];


    // supports
    // ::: center
    // ::: left
    // ::: right
    const aligner = () => [{
        type: 'lang',
        regex: /\[(center|left|right)]\s*([\s\S]*?)\s*\[\/\1]/g,
        replace: (_, align, content) => {
            const inner = converter.makeHtml(content.trim());

            const clean = DOMPurify.sanitize(inner, {
                ALLOWED_TAGS,
                ALLOWED_ATTR
            });
            return `<div class="text-${align}">${clean}</div>`;
        }
    }];

    let extensions = [
        aligner()
    ];

    if (allow_banners) extensions.push(banner());

    const converter = new showdown.Converter({
        extensions,
        emoji: true,
        excludeTrailingPunctuationFromURLs: true,
        ghMentions: true,
        ghMentionsLink: `${root}user/{u}`,
        headerLevelStart: (allow_headers) ? 3 : 5,
        noHeaderId: true,
        openLinksInNewWindow: true,
        requireSpaceBeforeHeadingText: true,
        simpleLineBreaks: line_breaks,
        simplifiedAutoLink: allow_links,
        strikethrough: true,
        underline: true,
        ghCodeBlocks: false,
        smartIndentationFix: true
    });
    const markdown = text
    .replace(/([@])([a-zA-Z0-9_]+)/g, `[$1$2](${root}user/$2)`)
    .replace(
        /\[artist\]([^[\]]+)\[\/artist\]/g,
        (match, artist) =>
            `[${artist}](${root}music/${redirect()}${encodeURIComponent(artist)})`
    )
    .replace(
        /\[album artist=([^[\]]+)\]([^[\]]+)\[\/album\]/g,
        (match, artist, album) =>
            `[${album}](${root}music/${redirect()}` +
            `${encodeURIComponent(artist)}/${encodeURIComponent(album)})`
    )
    .replace(
        /\[track artist=([^[\]]+)\]([^[\]]+)\[\/track\]/g,
        (match, artist, track) =>
            `[${track}](${root}music/${redirect()}` +
            `${encodeURIComponent(artist)}/_/${encodeURIComponent(track)})`
    )
    .replace(
        /\[url=([^[\]]+)\]([^[\]]+)\[\/url\]/g,
        (match, url, text) =>
            `[${text}](${encodeURI(url)})`
    )
    .replace(
        /\[url\]([^[\]]+)\[\/url\]/g,
        (match, url) =>
            `[${url}](${encodeURI(url)})`
    )
    .replace(
        /https:\/\/open\.spotify\.com\/user\/([A-Za-z0-9]+)\?si=([A-Za-z0-9]+)/g,
        '[Spotify](https://open.spotify.com/user/$1)');

    const raw_html = converter.makeHtml(markdown);

    const parsed = DOMPurify.sanitize(raw_html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR
    });

    const body = html.node([parsed]);

    patch_wiki_contents(body);

    // funny local restriction message
    local_restriction(body);
    body.querySelectorAll('p').forEach((text) => {
        local_restriction(text);
    });

    // add lazy-loading to images
    body.querySelectorAll('img').forEach((image) => {
        image.setAttribute('loading', 'lazy');

        let open;
        const container = html.node`
            <div class="markdown-image">
                <div class="image-interactions">
                    ${() => {
                        const button = html.node`
                            <a class="btn chibi icon" data-type="info" rel=${el => open = el} href=${image.src} target="_blank">
                                ${tl(trans.open)}
                            </a>
                        `;

                        tippy(button, {
                            content: image.src
                        });
                        
                        return button;
                    }}
                </div>
            </div>
        `;

        image.after(container);
        container.appendChild(image);
    });

    return body;
}

function local_restriction(text) {
    if (text.textContent.trim().startsWith('Due to local laws, we are temporarily'))
        text.classList.add('local-restriction');
}
