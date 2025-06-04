//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {log} from "../build/log";
import {page} from "../build/page";
import {html} from "lighterhtml";
import {tl, trans} from "../build/trans.js";

export function load_notifications() {
    if (!page.structure.notifications) {
        let notification_host = html.node`
            <div class="bleh-notifications" />
        `;
        page.structure.notifications = notification_host;
        document.body.appendChild(notification_host);
    }
}

/**
 * @deprecated Automatically redirects to notify
 * @see notify
 */
export function deliver_notif(content, persist=false, has_icon=false, append_class=null, action='') {
    // redirect
    return notify({
        id: 'legacy_notification',
        title: content,
        icon: 'icon-16-info',
        classname: append_class
    });
}

/**
 * Delivers a top-right flyout notification
 * @param {string|null} id - Unique identifier
 * @param {string|null} title - Bold header
 * @param {string|null} body - Main content
 * @param {string|null} icon - Accompanying icon name e.g., icon-16-x
 * @param {string|null} classname - Unique classname for styling
 * @param {boolean} persist - Automatically dismiss or wait on action?
 * @param {'generic'|'error'|'success'} type - Generic type preset
 * @returns Notification element
 */
export function notify({
    id,
    title,
    body,
    icon,
    classname,
    actions = [],
    persist = false,
    type = 'generic'
}) {
    log(`creating ${title}`, 'notification', 'info', {
        id: id,
        title: title,
        body: body,
        icon: icon,
        classname: classname,
        persist: persist,
        type: type
    });

    if (type === 'error')
        icon = 'icon-16-x';
    else if (type === 'success')
        icon = 'icon-16-check';

    if (!icon)
        icon = 'icon-16-info';

    let bar;

    let notif = html.node`
        <div
            class=${[
                'bleh-notification',
                icon ? 'with-icon' : '',
                classname ? classname : ''
                ].join(' ')}
            data-type=${type}
            style=${[
                icon ? `--mask: var(--${icon})` : '',
                ].join(';')}
        >
            <div class="notification-information">
                 <div class="notification-title">${title}</div>
                ${(body) ? html.node`
                <div class="notification-body">${body}</div>
                ` : ''}
            </div>
            ${(!persist) ? html.node`
            <div class="notification-progress" ref=${el => bar = el}></div>
            ` : ''}
            <div class="notification-actions">
                ${(actions.length > 0) ? actions.map(action => html.node`
                <button class="notification-action" data-type=${action.type} onclick=${action.action}>${action.text}</button>
                `) : ''}
                <button class="notification-action" data-type="close" onclick=${() => notify_rm(notif)}>${tl(trans.close)}</button>
            </div>
        </div>
    `;
    page.structure.notifications.appendChild(notif);

    if (persist)
        return notif;

    setTimeout(function() {
        bar.style.setProperty('left', '100%');
    }, 1);

    setTimeout(function() {
        notify_rm(notif);
    }, 3000);

    return notif;
}
unsafeWindow._notify_rm = function(notif) {
    notify_rm(notif);
}
function notify_rm(notif) {
    notif.classList.add('fade-out');
    setTimeout(function() {
        page.structure.notifications.removeChild(notif);
    }, 400);
}
