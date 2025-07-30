import {root} from "../build/page.js";
import {desanitise} from "../build/tools.js";
import {correct_artist, correct_item_by_artist} from "./lotus.js";
import {html, render} from "lighterhtml";
import {tl, trans} from "../build/trans.js";

export function bleh_notification_list(list) {
    list.classList = 'notification-list';

    let notifications = list.querySelectorAll('.inbox-notifications__item');
    notifications.forEach((notification) => {
        let active = notification.classList.contains('inbox-notifications__item--highlight');

        notification.classList = 'notification';
        if (active) notification.classList.add('active');

        const link = notification.querySelector('.inbox-notifications__item-link');
        const href = link.getAttribute('href');

        let type = 'shoutbox';
        let context = {
            name: '',
            sister: ''
        }
        let involved = [];

        const strongs = link.querySelectorAll('strong');

        let split = href.replace(root, '').split('/');

        const avatar = notification.querySelector('.avatar');
        avatar.classList = 'avatar';

        const time = notification.querySelector('time');

        let is_reply = false;
        let others_included = 0;

        if (href.endsWith('/obsessions/set')) {
            type = 'obsession';
            context.name = split[1];
        } else if (href.endsWith('/listening-report/month')) {
            type = 'report';
            context.name = split[1];
        } else if (href.startsWith(`${root}user/`)) {
            context.name = split[1];

            strongs.forEach((strong, index) => {
                if (index == strongs.length - 1 && strongs.length > 1) {
                    obtain_additional_info(strong.previousSibling.textContent);

                    return;
                }

                involved.push(strong.textContent);
            });
        } else if (href.startsWith(`${root}music/`)) {
            if (split[2] == '+shoutbox') {
                context.name = correct_artist(desanitise(split[1]));
            } else if (split[2] == '_') {
                context.sister = correct_artist(desanitise(split[1]));
                context.name = correct_item_by_artist(desanitise(split[3]), context.sister);
            } else {
                context.sister = correct_artist(desanitise(split[1]));
                context.name = correct_item_by_artist(desanitise(split[2]), context.sister);
            }

            strongs.forEach((strong, index) => {
                if (index == strongs.length - 1) {
                    obtain_additional_info(strong.previousSibling.textContent);

                    return;
                }

                involved.push(strong.textContent);
            });
        } else if (href.startsWith(`${root}tag/`)) {
            context.name = split[1];

            strongs.forEach((strong, index) => {
                if (index == strongs.length - 1) {
                    obtain_additional_info(strong.previousSibling.textContent);

                    return;
                }

                involved.push(strong.textContent);
            });
        }

        console.info(split, context, type, involved);

        render(notification, html`
            <div class="notification-avatar">
                ${avatar}
            </div>
            <div class="notification-content">
                <div class="notification-title">
                    ${involved.join(', ')} and ${others_included} others ${is_reply ? 'reply' : 'shout'} in ${type}
                </div>
                <div class="notification-context">
                    on ${context.name}, ${context.sister}
                </div>
            </div>
            <div class="notification-time">
                ${time}
            </div>
        `);

        // we can use the last sibling to obtain info on if this is a reply or not and other users
        function obtain_additional_info(text) {
            const match = text.match(/\d+/);
            if (match) others_included = parseInt(match[0]);

            if (text.includes(tl(trans.notification_replied_ctx))) is_reply = true;
        }
    });
}
