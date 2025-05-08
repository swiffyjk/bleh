import { log } from "../build/log";
import { page } from "../build/page";

export function load_notifications() {
    let prev_notif = document.getElementById('bleh-notifications');
    if (prev_notif == null) {
        let notifs = document.createElement('div');
        notifs.classList.add('bleh-notifications');
        page.structure.notifications = notifs;
        document.body.appendChild(notifs);
    }
}

export function deliver_notif(content, persist=false, has_icon=false, append_class='', action='') {
    let notif = document.createElement('button');
    notif.classList.add('bleh-notification');
    notif.setAttribute('onclick', '_kill_notif(this)');
    notif.textContent = content;

    page.structure.notifications.appendChild(notif);

    if (has_icon)
        notif.classList.add('btn--has-icon');

    if (append_class != '')
        notif.classList.add(append_class);

    if (action != '')
        notif.setAttribute('onclick', action);

    if (persist)
        return;

    setTimeout(function() {
        kill_notif(notif);
    }, 3500);
}

unsafeWindow._notify = function({
    title = null,
    body = null,
    icon = null,
    classname = null,
    action = null,
    persist = false,
    type = null
}) {
    notify({
        title: title,
        body: body,
        icon: icon,
        classname: classname,
        action: action,
        persist: persist,
        type: type
    });
}
export function notify({
    id = null,
    title = null,
    body = null,
    icon = null,
    classname = null,
    action = null,
    persist = false,
    type = 'generic'
}) {
    log(`creating ${title}`, 'notification', 'info', {
        id: id,
        title: title,
        body: body,
        icon: icon,
        classname: classname,
        action: action,
        persist: persist,
        type: type
    });

    let notif = document.createElement('button');
    notif.classList.add('bleh-notification');
    notif.setAttribute('data-type', type);
    notif.setAttribute('onclick', '_notify_rm(this)');

    if (!body) {
        notif.innerHTML = (`
            <div class="notification-title margin-below">${title}</div>
        `);
    } else {
        notif.innerHTML = (`
            <div class="notification-title">${title}</div>
            <div class="notification-body margin-below">${body}</div>
        `);
    }

    page.structure.notifications.appendChild(notif);

    if (type == 'error')
        icon = 'icon-16-x';

    if (type == 'success')
        icon = 'icon-16-check';

    if (!icon)
        icon = 'icon-16-info';

    if (icon) {
        notif.classList.add('icon');
        notif.style.setProperty('--mask', `var(--${icon})`);
    }

    if (classname)
        notif.classList.add(classname);

    if (action)
        notif.setAttribute('onclick', action);

    if (persist)
        return;

    let bar = document.createElement('div');
    bar.classList.add('notification-progress');
    notif.appendChild(bar);

    setTimeout(function() {
        bar.style.setProperty('left', '100%');
    }, 1);

    setTimeout(function() {
        notify_rm(notif);
    }, 10000);
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

unsafeWindow._kill_notif = function(notif) {
    kill_notif(notif);
}
function kill_notif(notif) {
    notify_rm(notif);
}