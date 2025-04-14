import { log } from "../build/log";
import { dialogs, page } from "../build/page";
import { lang, trans_legacy, trans, tl } from "../build/trans";

export function load_dialogs() {
    let dialogs = document.createElement('div');
    dialogs.classList.add('bleh-modals');

    document.body.appendChild(dialogs);

    page.structure.dialogs = dialogs;
}
export function dialog({
    id = '',
    title = null,
    subtitle = null,
    body = document.createElement('div').innerHTML,
    dismiss = true,
    type = '',
    has_overlays = true,
    replace = false,
    replace_if_possible = false,
    replace_id = '',
    allow_scroll = false
}) {
    log(`creating ${id}`, 'window', 'info', {
        id: id,
        title: title,
        subtitle: subtitle,
        body: body,
        dismiss: dismiss,
        type: type,
        has_overlays: has_overlays,
        replace: replace,
        replace_id: replace_id,
        allow_scroll: allow_scroll
    });

    let modal;

    if (replace_if_possible && Object.keys(dialogs).length > 0) {
        replace = true;

        for (let dialog in dialogs) {
            replace_id = dialog;
            break;
        }
    }

    if (!replace || replace && !dialogs.hasOwnProperty(replace_id)) {
        modal = document.createElement('div');
        modal.classList.add('bleh-modal');
    } else {
        log(`window set to replace ${replace_id}`, 'window');

        modal = dialogs[replace_id].instance;
        delete dialogs[replace_id];

        modal.innerHTML = '';
    }

    modal.setAttribute('data-modal-id', id);
    modal.setAttribute('data-modal-has-overlays', has_overlays);

    if (type != '')
        modal.setAttribute('data-modal-type', type);

    if (title != null) {
        let modal_title = document.createElement('div');
        modal_title.classList.add('bleh-modal-title');
        modal_title.innerHTML = (`
            <h1>${title}</h1>
            ${(subtitle != null) ? `<p class="bleh-modal-subtitle">${subtitle}</p>` : ''}
        `);

        modal.appendChild(modal_title);
    }

    if (dismiss) {
        let modal_close = document.createElement('button');
        modal_close.classList.add('modal-close-button');
        modal_close.setAttribute('onclick', `_dialog_rm({id: "${id}"})`);

        modal.appendChild(modal_close);

        // allow clicking out of the modal to close
        page.structure.dialogs.setAttribute('onclick', '_dialog_rm({all: true, modal_bg: true})');
    } else {
        page.structure.dialogs.removeAttribute('onclick');
    }

    let modal_body = document.createElement('div');
    modal_body.classList.add('bleh-modal-body');
    modal_body.setAttribute('data-allow-scroll', allow_scroll);
    modal_body.innerHTML = body;

    modal.appendChild(modal_body);

    dialogs[id] = {
        instance: modal
    };

    page.structure.dialogs.appendChild(modal);
    page.structure.dialogs.classList.add('has-dialog');

    return modal;
}
unsafeWindow._dialog_rm = function({
    id = null,
    all = false,
    modal_bg = false
}) {
    dialog_rm({
        id: id,
        all: all,
        modal_bg: modal_bg
    });
}
export function dialog_rm({
    id = null,
    all = false,
    modal_bg = false
}) {
    if (all) {
        // prevents clicks inside modal being broken
        if (modal_bg) {
            console.log(event);
            if (event.target.classList[0] != 'bleh-modals')
                return;
        }

        log('requested kill all', 'window');
        console.info(dialogs);
        for (let dialog in dialogs) {
            dialog_rm({
                id: dialog
            });
        }

        return;
    }

    if (id == null)
        return;

    if (page.structure.dialogs == null)
        return;

    if (dialogs.hasOwnProperty(id)) {
        let dialog = dialogs[id];

        if (!page.structure.dialogs.contains(dialog.instance))
            return;

        log(`queuing ${id} to kill`, 'window');

        dialog.instance.classList.add('to-remove');

        setTimeout(function() {
            page.structure.dialogs.removeChild(dialog.instance);
        }, 400);

        delete dialogs[id];

        if (JSON.stringify(dialogs) == '{}') {
            page.structure.dialogs.classList.remove('has-dialog');
        }
    }
}

export function dialog_legacy(id, title, inner_content, dismiss = false, classname='', allow_scroll = false) {
    log(`created ${id} - '${title}'`, 'window', 'info', {content: [inner_content], dismiss: dismiss, classname: classname});

    let background = document.createElement('div');
    background.classList.add('popup_background');
    background.setAttribute('id',`bleh--window-${id}--background`);
    background.style = 'opacity: 0.8; visibility: visible; background-color: rgb(0, 0, 0); position: fixed; inset: 0px;';
    background.setAttribute('data-kate-processed','true');

    let wrapper = document.createElement('div');
    wrapper.classList.add('popup_wrapper','popup_wrapper_visible');
    wrapper.setAttribute('id',`bleh--window-${id}--wrapper`);
    wrapper.style = 'opacity: 1; visibility: visible; position: fixed; overflow: auto; width: 100%; height: 100%; top: 0px; left: 0px; text-align: center;';
    wrapper.setAttribute('data-kate-processed','true');


    // dialog
    let dialog = document.createElement('div');
    dialog.classList.add('modal-dialog');
    dialog.setAttribute('id',`bleh--window-${id}--dialog`);
    dialog.style = 'opacity: 1; visibility: visible; pointer-events: auto; display: inline-block; outline: none; text-align: left; position: relative; vertical-align: middle;';
    dialog.setAttribute('data-kate-processed','true');

    if (classname != '')
        dialog.classList.add(`modal-dialog--${classname}`);

    // content
    let content = document.createElement('div');
    content.classList.add('modal-content');
    content.setAttribute('id',`bleh--window-${id}--content`);
    content.setAttribute('data-kate-processed','true');

    if (dismiss) {
        let actions = document.createElement('div');
        actions.classList.add('modal-actions');
        actions.setAttribute('id',`bleh--window-${id}--actions`);
        actions.setAttribute('data-kate-processed','true');

        background.setAttribute('onclick', `_kill_window('${id}')`);

        actions.innerHTML = (`
            <div class="modal-buttons">
                <button class="modal-action-button modal-dismiss" onclick="_kill_window('${id}')">
                    ${trans_legacy[lang].settings.close}
                </button>
            </div>
        `);

        content.insertBefore(actions, content.firstElementChild);
    }

    // share content
    let share = document.createElement('div');
    share.classList.add('modal-share-content');
    share.setAttribute('id',`bleh--window-${id}--share`);
    share.setAttribute('data-kate-processed','true');

    // body
    let body = document.createElement('div');
    body.classList.add('modal-body');
    body.setAttribute('id',`bleh--window-${id}--body`);
    body.setAttribute('data-kate-processed','true');

    if (classname != '')
        body.classList.add(`modal--${classname}`);

    // title
    let header = document.createElement('h2');
    header.classList.add('modal-title');
    header.innerHTML = title;
    header.setAttribute('data-kate-processed','true');

    // inner content
    let inner_content_em = document.createElement('div');
    inner_content_em.classList.add('modal-inner-content');
    inner_content_em.innerHTML = inner_content;
    inner_content_em.setAttribute('data-kate-processed','true');

    if (allow_scroll)
        inner_content_em.classList.add('allow-scroll');


    let align = document.createElement('div');
    align.classList.add('popup_align');
    align.setAttribute('id',`bleh--window-${id}--align`);
    align.style = 'display: inline-block; vertical-align: middle; height: 100%;';
    align.setAttribute('data-kate-processed','true');


    body.appendChild(header);
    body.appendChild(inner_content_em)
    share.appendChild(body);
    content.appendChild(share);
    dialog.appendChild(content);
    wrapper.appendChild(dialog);
    wrapper.appendChild(align);


    document.body.appendChild(background);
    document.body.appendChild(wrapper);

    return wrapper;
}

// kill a window
export function kill_window(id, replacing = false) {
    try {
        if (replacing) {
            log(`killed ${id}`, 'window');
            document.body.removeChild(document.getElementById(`bleh--window-${id}--background`));
            document.body.removeChild(document.getElementById(`bleh--window-${id}--wrapper`));
        } else {
            // not replacing, can transition out
            log(`queuing ${id} to kill`, 'window');

            let background = document.getElementById(`bleh--window-${id}--background`);
            let window = document.getElementById(`bleh--window-${id}--wrapper`);

            background.classList.add('window-removing');
            window.classList.add('window-removing');

            setTimeout(function() {
                document.body.removeChild(background);
                document.body.removeChild(window);
            }, 270);
        }
    } catch(e) {
        log(`kill failed, ${id} does not exist`, 'window');
    }
}

unsafeWindow._kill_window = function(id) {
    kill_window(id);
}