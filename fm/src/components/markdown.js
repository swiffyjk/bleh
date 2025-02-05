function markdown(text) {
    let converter = new showdown.Converter({
        emoji: true,
        excludeTrailingPunctuationFromURLs: true,
        ghMentions: true,
        ghMentionsLink: `${root}user/{u}`,
        headerLevelStart: 5,
        noHeaderId: true,
        openLinksInNewWindow: true,
        requireSpaceBeforeHeadingText: true,
        simpleLineBreaks: true,
        simplifiedAutoLink: true,
        strikethrough: true,
        underline: true,
        ghCodeBlocks: false,
        smartIndentationFix: true
    });
    let parsed_body = converter.makeHtml(text
    .replace(/([@])([a-zA-Z0-9_]+)/g, `[$1$2](${root}user/$2)`)
    .replace(/\[artist\]([a-zA-Z0-9]+)\[\/artist\]/g, `[$1](${root}music/$1)`)
    .replace(/\[album artist=([a-zA-Z0-9]+)\]([a-zA-Z0-9\s]+)\[\/album\]/g, `[$2](${root}music/$1/$2)`)
    .replace(/\[track artist=([a-zA-Z0-9]+)\]([a-zA-Z0-9\s]+)\[\/track\]/g, `[$2](${root}music/$1/_/$2)`)
    .replace(/https:\/\/open\.spotify\.com\/user\/([A-Za-z0-9]+)\?si=([A-Za-z0-9]+)/g, '[@$1](https://open.spotify.com/user/$1)')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;'));

    return parsed_body;
}