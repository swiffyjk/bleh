import { settings } from '../build/config';
import { log } from '../build/log';
import { save_setting } from './settings';

export function dynamic_theming() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    match(media);

    media.addEventListener('change', match);
}

function match(media) {
    if (media.matches)
        apply_theme('night');
    else
        apply_theme('day');
}

function apply_theme(time) {
    log(`applying theme for time ${time}`, 'dynamic theming');
    save_setting('theme', settings[`theme_${time}`]);
}