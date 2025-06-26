//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {root} from "../build/page";
import {html} from "lighterhtml";

export function markdown(text, {
    allow_headers = false,
    allow_links = true,
    line_breaks = true
}={}) {
    let converter = new showdown.Converter({
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
    let parsed_body = converter.makeHtml(text
    .replace(/([@])([a-zA-Z0-9_]+)/g, `[$1$2](${root}user/$2)`)
    .replace(/\[artist\]([^[\]]+)\[\/artist\]/g, `[$1](${root}music/$1)`)
    .replace(/\[album artist=([^[\]]+)\]([^[\]]+)\[\/album\]/g, `[$2](${root}music/$1/$2)`)
    .replace(/\[track artist=([^[\]]+)\]([^[\]]+)\[\/track\]/g, `[$2](${root}music/$1/_/$2)`)
    .replace(/https:\/\/open\.spotify\.com\/user\/([A-Za-z0-9]+)\?si=([A-Za-z0-9]+)/g, '[Spotify](https://open.spotify.com/user/$1)')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;'));

    let body = html.node([parsed_body]);

    let links = body.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && link.textContent != href && /^(https?|mailto|ftp|sftp|tel):/.test(href)) {
            tippy(link, {
                content: href
            });
        }
    });

    return body;
}
