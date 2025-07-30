//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {root} from "../build/page";
import {html} from "lighterhtml";
import {patch_wiki_contents} from "../pages/wiki.js";
import {redirect} from "./music.js";

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
    .replace(/https:\/\/open\.spotify\.com\/user\/([A-Za-z0-9]+)\?si=([A-Za-z0-9]+)/g, '[Spotify](https://open.spotify.com/user/$1)')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;'));

    let body = html.node([parsed_body]);

    patch_wiki_contents(body);

    local_restriction(body);
    let texts = body.querySelectorAll('p');
    texts.forEach((text) => {
        local_restriction(text);
    });

    return body;
}

function local_restriction(text) {
    if (text.textContent.trim().startsWith('Due to local laws, we are temporarily'))
        text.classList.add('local-restriction');
}
