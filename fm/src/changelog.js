import { log } from "./build/log";
import { root } from "./build/page";
import { lang, trans_legacy } from "./build/trans";
import { dialog } from "./components/dialog";
import { deliver_notif } from "./components/notify";
import { ff } from "./sku";

unsafeWindow._query_changelog = function() {
    if (!ff('changelogs')) {
        deliver_notif('not just yet..');
        return;
    }

    let changelog = localStorage.getItem('bleh_changelog');
    let changelog_expire = new Date(localStorage.getItem('bleh_changelog_expire'));

    let current_time = new Date();

    if (changelog == null) {
        log('not cached, fetching', 'changelog');
        request_changelog();
    } else {
        if (changelog_expire < current_time)
            request_changelog();
        else
            open_changelog(JSON.parse(changelog));
    }
}

export function request_changelog(open_after = true) {
    let button = document.body.querySelector('[data-bleh-page="changelog"]');
    if (button != null)
        button.setAttribute('disabled', '');

    let xhr = new XMLHttpRequest();
    let url = `https://katelyynn.github.io/bleh/fm/changelog/changelog.json?${Math.random()}`;
    xhr.open('GET',url,true);

    xhr.onload = function() {
        log(`responded with ${xhr.status}`, 'changelog');

        if (xhr.status != 200) {
            log('request has been cancelled, will request again in 1h', 'changelog');
            api_expire.setHours(api_expire.getHours() + 1);
        }

        // set expire date
        let api_expire = new Date();

        if (xhr.status == 200) {
            if (open_after) {
                try {
                    open_changelog(JSON.parse(this.response));

                    // save to cache for next page load
                    localStorage.setItem('bleh_changelog', this.response);
                    api_expire.setHours(api_expire.getHours() + 2);
                    log(`cached until ${api_expire}`, 'changelog');

                    localStorage.setItem('bleh_changelog_expire', api_expire);
                } catch(e) {
                    deliver_notif('The changelog is currently unavailable due to errors, try again later.', true);
                    console.error(e);
                }
            }
        }

        if (button != null)
            button.removeAttribute('disabled');
    }

    xhr.send();
}

function open_changelog(changelog) {
    let window = dialog({
        id: 'changelog',
        title: trans_legacy[lang].changelog.name,
        subtitle: trans_legacy[lang].changelog.subtitle.replace('{u}', `<a class="mention" href="${root}user/cutensilly">@cutensilly</a>`),
        body: (`
            <div class="changelog-list"></div>
            <div class="modal-footer">
                <a class="btn primary skip" href="#latest_major_release">
                    ${trans_legacy[lang].changelog.view_major}
                </a>
            </div>
        `),
        type: 'changelog',
        allow_scroll: true
    });

    let changelog_list = window.querySelector('.changelog-list');

    let index = 0;
    for (let version in changelog) {
        if (version == 'updated' || version == 'latest')
            continue;

        let version_item = document.createElement('div');
        version_item.classList.add('changelog-version-item');
        version_item.setAttribute('data-changelog-type', changelog[version].type);
        version_item.setAttribute('data-changelog-latest', (index == 0) ? 'true' : 'false');
        version_item.setAttribute('data-changelog-version', version);
        version_item.innerHTML = (`
            <div class="version-item-header">
                <div class="sub-text">
                    <div class="breadcrumb">
                        <div class="breadcrumb-origin">
                            ${version}
                        </div>
                        <div class="breadcrumb-name">
                            ${trans_legacy[lang].changelog.type[changelog[version].type]}
                        </div>
                    </div>
                    ${(index == 0) ? (`
                    <!--<div class="latest-line">
                        <div>${trans_legacy[lang].changelog.latest}</div>
                    </div>-->
                    `) : ''}
                </div>
                <h3>${changelog[version].name}</h3>
                ${(version == '2025.0113') ? `<h4 class="header-over">${changelog[version].name}</h4>` : ''}
            </div>
        `);

        if (changelog[version].type == 'major')
            version_item.setAttribute('id', 'latest_major_release');

        let body = document.createElement('div');
        body.classList.add('version-item-body', 'markdown-body');

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
        let parsed_text = converter.makeHtml(changelog[version].bio
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
        body.innerHTML = parsed_text;

        version_item.appendChild(body);

        changelog_list.appendChild(version_item);

        index += 1;
    }
}

unsafeWindow._update_local_changelog_cache = function(json) {
    localStorage.setItem('bleh_changelog', JSON.stringify(json));
}