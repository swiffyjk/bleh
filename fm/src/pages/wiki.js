function bleh_wiki() {
    // make a new panel
    let wiki_panel = document.createElement('section');
    wiki_panel.classList.add('wiki-panel');
    wiki_panel.innerHTML = page.structure.main.innerHTML;

    page.structure.main.innerHTML = '';
    page.structure.main.appendChild(wiki_panel);
    page.structure.main.classList.add('not-a-panel');

    let original_edit_button = page.structure.main.querySelector('.qa-wiki-edit');
    let original_version_history = page.structure.main.querySelector('.wiki-history-link--desktop a');

    let new_edit_panel;
    if (original_edit_button != null) {
        new_edit_panel = document.createElement('section');
        new_edit_panel.classList.add('view-all-panel');
        new_edit_panel.innerHTML = (`
            <a class="btn view-all-button back wiki-edit-button" href="${original_edit_button.getAttribute('href')}">
                ${original_edit_button.textContent}
            </a>
        `);

        page.structure.side.insertBefore(new_edit_panel, page.structure.side.firstElementChild);
    }

    if (original_version_history != null) {
        let new_version_panel = document.createElement('section');
        new_version_panel.classList.add('view-all-panel');
        new_version_panel.innerHTML = (`
            <a class="btn view-all-button back wiki-history-button" href="${original_version_history.getAttribute('href')}">
                ${original_version_history.textContent}
            </a>
        `);

        if (original_edit_button != null)
            new_edit_panel.after(new_version_panel);
        else
            page.structure.side.insertBefore(new_version_panel, page.structure.side.firstElementChild);
    }


    // author
    let wiki_author = wiki_panel.querySelector('.wiki-author');
    // this cant be null i believe but still
    if (wiki_author != null) {
        let h2 = wiki_panel.querySelector('h2.text-18');

        let sub_text = document.createElement('div');
        sub_text.classList.add('sub-text', 'space-below');
        sub_text.innerHTML = (`
            <div class="breadcrumb-origin prominent">
                ${(h2 != null) ? h2.innerHTML : page.structure.container.querySelector('.content-top-header').textContent}
            </div>
            <div class="wiki-author-side">
                ${wiki_author.innerHTML}
            </div>
        `);

        wiki_panel.insertBefore(sub_text, wiki_panel.firstElementChild);
        if (h2 != null)
            wiki_panel.removeChild(h2);
    }

    let wiki = wiki_panel.querySelector('.wiki');

    if (wiki == null)
        return;

    patch_wiki_contents(wiki);
}

function bleh_wiki_history() {
    let breadcrumb_root = page.structure.container.querySelector('.subpage-breadcrumb');
    let breadcrumb_name = page.structure.container.querySelector('.subpage-title');

    // tags
    if (breadcrumb_root == null) {
        breadcrumb_root = page.structure.container.querySelector('.content-top-back-link');
        breadcrumb_name = page.structure.container.querySelector('.content-top-header');
    }

    let sub_text = document.createElement('div');
    sub_text.classList.add('sub-text', 'space-below');
    sub_text.innerHTML = (`
        <div class="breadcrumb">
            ${breadcrumb_root.querySelector('a').outerHTML}
            <div class="breadcrumb-name prominent">
                ${breadcrumb_name.textContent}
            </div>
        </div>
    `);

    breadcrumb_root.style.setProperty('display', 'none');
    breadcrumb_name.style.setProperty('display', 'none');


    let buffer_container = page.structure.container.querySelector('.row ~ .buffer-4');

    // tags
    if (buffer_container == null)
        buffer_container = page.structure.container.querySelector('.wiki-history');

    let wiki_history_table = buffer_container.querySelector('.wiki-history-table');

    // nav
    let pagination = buffer_container.querySelector('.pagination');


    // put this in col-main
    let wiki_panel = document.createElement('section');
    wiki_panel.classList.add('wiki-history-panel');

    wiki_panel.appendChild(sub_text);
    wiki_panel.appendChild(wiki_history_table);

    page.structure.main.appendChild(wiki_panel);
    buffer_container.style.setProperty('display', 'none');

    if (pagination != null)
        wiki_panel.appendChild(pagination);


    // latest
    let latest_version_panel = document.createElement('section');
    latest_version_panel.classList.add('view-all-panel');
    latest_version_panel.innerHTML = (`
        <a class="btn view-all-button back wiki-latest-button" href="${sub_text.querySelector('a').getAttribute('href')}">
            ${trans[lang].wiki.latest}
        </a>
    `);

    page.structure.side.appendChild(latest_version_panel);


    // entries
    let entries = page.structure.main.querySelectorAll('.wiki-history-entry');
    entries.forEach((entry) => {
        let author = entry.querySelector('.wiki-history-author');
        let avatar = author.querySelector('.wiki-history-author-avatar');
        let name = author.querySelector('.link-block-target');

        if (name != null && avatar != null) {
            let badge = patch_avatar(avatar, name.textContent, 'wiki');

            if (badge.type == 'avatar-status-dot--staff')
                entry.classList.add('staff-shout');
        }
    });
}

function bleh_wiki_editor() {
    // make a new panel
    let wiki_edit_panel = document.createElement('section');
    wiki_edit_panel.classList.add('wiki-edit-panel');
    wiki_edit_panel.innerHTML = page.structure.main.innerHTML;

    page.structure.main.innerHTML = '';
    page.structure.main.appendChild(wiki_edit_panel);
    page.structure.main.classList.add('not-a-panel');

    let breadcrumb_root = page.structure.container.querySelector('.subpage-breadcrumb');
    let breadcrumb_name = page.structure.container.querySelector('.subpage-title');

    // probably moved to a content-top by bleh prior
    if (breadcrumb_name == null) {
        breadcrumb_name = page.structure.content_top.querySelector('.content-top-header');

        if (breadcrumb_name != null) {
            page.structure.content_top.style.setProperty('display', 'none');
        }
    }

    // tags
    if (breadcrumb_root == null) {
        breadcrumb_root = page.structure.container.querySelector('.content-top-back-link');
        breadcrumb_name = page.structure.container.querySelector('.content-top-header');
    }

    let sub_text = document.createElement('div');
    sub_text.classList.add('sub-text', 'space-below');
    sub_text.innerHTML = (`
        <div class="breadcrumb">
            ${breadcrumb_root.querySelector('a').outerHTML}
            <div class="breadcrumb-name prominent">
                ${breadcrumb_name.textContent}
            </div>
        </div>
    `);

    breadcrumb_root.style.setProperty('display', 'none');
    breadcrumb_name.style.setProperty('display', 'none');

    wiki_edit_panel.insertBefore(sub_text, wiki_edit_panel.firstElementChild);

    let wiki_syntax = document.createElement('section');
    wiki_syntax.classList.add('bleh--blank-panel', 'wiki-syntax-panel');
    wiki_syntax.innerHTML = (`
        <h3 class="text-18">${trans[lang].wiki.syntax.name}</h3>
        <div class="syntax-listing">
            <div class="syntax-listing-item">
                <div class="code-side">[artist]julie[/artist]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="${root}music/julie" target="_blank">julie</a>`)}</div>
            </div>
            <div class="syntax-listing-item">
                <div class="code-side">[album artist=julie]pushing daisies[/album]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="${root}music/julie/pushing+daisies" target="_blank">pushing daisies</a>`)}</div>
            </div>
            <div class="syntax-listing-item">
                <div class="code-side">[track artist=julie]very little effort[/track]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="${root}music/julie/_/very+little+effort" target="_blank">very little effort</a>`)}</div>
            </div>
        </div>
        <div class="sep"></div>
        <div class="syntax-listing">
            <div class="syntax-listing-item">
                <div class="code-side">[url]https://cutensilly.org/bleh/fm[/url]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="https://cutensilly.org/bleh/fm" target="_blank">https://cutensilly.org/bleh/fm</a>`)}</div>
            </div>
            <div class="syntax-listing-item">
                <div class="code-side">[url=https://cutensilly.org/bleh/fm]blehhh[/url]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="https://cutensilly.org/bleh/fm" target="_blank">blehhh</a>`)}</div>
            </div>
        </div>
        <div class="sep"></div>
        <div class="syntax-listing">
            <div class="syntax-listing-item">
                <div class="code-side">[tag]grunge[/tag]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a href="${root}tag/grunge" target="_blank">grunge</a>`)}</div>
            </div>
            <div class="syntax-listing-item">
                <div class="code-side">[user]${auth.name}[/user]</div>
                <div class="detail-side">${trans[lang].wiki.syntax.links_to.replace('{link}', `<a class="mention" href="${root}user/${auth.name}" target="_blank">@${auth.name}</a>`)}</div>
            </div>
        </div>
    `);

    page.structure.side.innerHTML = '';

    // latest
    let latest_version_panel = document.createElement('section');
    latest_version_panel.classList.add('view-all-panel');
    latest_version_panel.innerHTML = (`
        <a class="btn view-all-button back wiki-latest-button" href="${sub_text.querySelector('a').getAttribute('href')}">
            ${trans[lang].wiki.latest}
        </a>
    `);

    page.structure.side.appendChild(latest_version_panel);


    // presets
    let wiki_presets_panel = document.createElement('section');
    wiki_presets_panel.classList.add('wiki-presets-panel');

    wiki_presets_panel.innerHTML = (`
        <h3 class="text-18">${trans[lang].wiki.presets.name}</h3>
        <div class="presets">
            <div class="preset">“</div>
            <div class="preset">”</div>
            <div class="preset">—</div>
            <div class="preset">‘</div>
            <div class="preset">’</div>
            <div class="preset">-</div>
        </div>
    `);

    page.structure.side.appendChild(wiki_presets_panel);

    page.structure.side.appendChild(wiki_syntax);


    // rules
    let rules = page.structure.main.querySelector('.wiki-style-rules');

    let rules_panel = document.createElement('section');
    rules_panel.classList.add('rules-panel');
    rules_panel.innerHTML = rules.innerHTML;

    page.structure.side.appendChild(rules_panel);
}


// fix wiki on some devices
function patch_wiki() {
    // add info notes to things
    if (ff('show_wiki_label')) {
        let wiki_col = page.structure.main.querySelector('.wiki-column');
        let wiki_empty = false;

        if (!wiki_col)
            return;

        let wiki_block = wiki_col.querySelector('.wiki-block.visible-lg .wiki-block-inner-2');

        if (wiki_block == null) {
            wiki_block = wiki_col.querySelector('.wiki-block-cta');
            wiki_empty = true;
        }

        let read_more = wiki_block.querySelector('a:last-child');
        if (read_more) {
            read_more.classList.add('read-more');
            read_more.textContent = trans[lang].music.wiki_read;
        }

        let wiki_header = document.createElement('div');
        wiki_header.classList.add('sub-text');
        wiki_header.innerHTML = (`
            <p>${trans[lang].music.wiki.replace('{a}', page.name)}</p>
            <span class="right-links">
                <p><a class="wiki-edit-small" href="${document.location.href}/+wiki/edit">${trans[lang].music.wiki_edit}</a></p>
                ${(!wiki_empty) ? `<p>${read_more.outerHTML}</p>` : ''}
            </span>
        `);

        wiki_col.insertBefore(wiki_header, wiki_col.firstElementChild);


        if (!wiki_empty) {
            patch_wiki_contents(wiki_block);
        }
    }
}

function patch_wiki_contents(wiki_block) {
    let links = wiki_block.querySelectorAll('a');
    links.forEach((link) => {
        let href = link.getAttribute('href');
        let type;
        let name = link.textContent.trim();
        let sister;

        if (!href.startsWith(root)) {
            tippy(link, {
                content: link.getAttribute('href')
            });

            return;
        }

        if (href.endsWith('/+wiki'))
            return;

        href = href.replace(root, '').replace('music/', '');

        if (href.startsWith('tag/')) {
            type = 'tag';
        } else {
            let split = href.split('/');
            //console.info(href, split.length);

            if (split.length == 1) {
                type = 'artist';
            } else if (split.length == 2) {
                type = 'album';
                name = desanitise(split[1]);
                sister = desanitise(split[0]);
            } else if (split.length == 3) {
                type = 'track';
                name = desanitise(split[2]);
                sister = desanitise(split[0]);
            }
        }

        if (sister != undefined)
            tippy(link, {
                content: `${sister} - ${name}`
            });

        link.setAttribute('data-link-type', type);
    });
}