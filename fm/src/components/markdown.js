//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {auth, root} from "../build/page";
import {html} from "lighterhtml";
import {patch_wiki_contents} from "../pages/wiki.js";
import {redirect} from "./music.js";
import showdown from "showdown";
import DOMPurify from "dompurify";
import {expand_avatar} from "../avatar.js";
import { tl, trans } from '../build/trans.js';
import { dialog } from './dialog.js';

export function markdown(text, {
    allow_headers = false,
    allow_links = true,
    line_breaks = true,
    allow_banners = false,
    in_dialog = false,
    allow_icons = false
}={}) {
    const ALLOWED_TAGS = [
        'div', 'p', 'span', 'em', 'u', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'code', 'pre', 'img', 'blockquote',
        'h1', 'h2', 'h3', 'h4', 'h5'
    ];
    const ALLOWED_ATTR = [
        'href', 'class', 'target', 'src', 'alt', 'title', 'style'
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

    // this should be like as safe as can be
    // you can't escape the boundaries due to the regex
    const icons = () => [{
        type: 'lang',
        regex: /\[icon=([a-zA-Z-]+)\]/g,
        replace: (_, icon) => {
            return `<span class="bleh-icon in-markdown" style="--icon: var(--icon-16-${icon})">A</span>`;
        }
    }];

    let extensions = [
        aligner()
    ];

    if (allow_banners) extensions.push(banner());
    if (allow_icons) extensions.push(icons());

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

        let func = () => expand_avatar(image.src, image.alt);
        if (in_dialog) func = () => open(image.src);

        const container = html.node`
            <div class="markdown-image" onclick=${func} />
        `;

        image.after(container);
        container.appendChild(image);
    });

    return body;
}

export function markdown_prompt({
    allow_headers = false,
    allow_links = true,
    line_breaks = true,
    allow_banners = false,
    in_dialog = false
}={}) {
    const examples = [
        {
            name: tl(trans.supports_markdown.bold.name),
            string: tl(trans.supports_markdown.bold.string)
        },
        {
            name: tl(trans.supports_markdown.italics.name),
            string: tl(trans.supports_markdown.italics.string)
        },
        {
            name: tl(trans.supports_markdown.bold_italics.name),
            string: tl(trans.supports_markdown.bold_italics.string)
        },
        {
            name: tl(trans.supports_markdown.underlined.name),
            string: tl(trans.supports_markdown.underlined.string)
        },
        {
            name: 'Fancy link',
            string: '[example >~<](https://katelyn.moe)'
        },
        {
            name: 'Simple link',
            string: `https://last.fm${root}user/${auth.name}`
        },
        {
            name: 'Mentioned user',
            string: `@${auth.name}`
        },
        {
            name: 'Image',
            string: `![alt text](${auth.avatar})`,
            string_display: '![alt text](image url here)'
        },
        {
            name: 'Banner',
            string: '[banner=image_url_here]',
            hide_if: !allow_banners,
            explain: 'Applies a custom banner to your profile, visible to all users'
        },
        {
            name: 'Left-alignment',
            string: '[left]text[/left]'
        },
        {
            name: 'Center-alignment',
            string: '[center]text[/center]'
        },
        {
            name: 'Right-alignment',
            string: '[right]text[/right]'
        }
    ]

    dialog({
        id: 'markdown',
        title: tl(trans.supports_markdown),
        body: html.node`
            <p>You can write fancy text here using Markdown, which lets you make your words pretty with simple shortcuts.</p>
            <table class="fancy-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>How</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    ${examples.map(example => {
                        if (example.hide_if) return html.node``;

                        return html.node`
                            <tr>
                                <td>${example.name}</td>
                                <td><code>${example.string_display ? example.string_display : example.string}</code></td>
                                ${example.explain ? html.node`
                                    <td>
                                        <div class="icon-combo">
                                            <div class="bleh-icon" data-type="info" style="--icon: var(--mask)" />
                                            ${example.explain}
                                        </div>
                                    </td>
                                ` : html.node`
                                    <td class="markdown-body">${markdown(example.string, {in_dialog: true})}</td>
                                `}
                            </tr>
                        `;
                    })}
                </tbody>
            </table>
        `
    });
}

function local_restriction(text) {
    if (text.textContent.trim().startsWith('Due to local laws, we are temporarily'))
        text.classList.add('local-restriction');
}
