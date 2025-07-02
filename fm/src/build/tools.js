//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

// https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
import {log} from "./log.js";
import {notify} from "../components/notify.js";
import {tl, trans} from "./trans.js";

/**
 * Converts hex to {h, s, l}
 * @param {string} hex
 * @returns {{h: number, s: number, l: number}}
 */
export function hex_to_hsl(hex) {
    let result = new RegExp(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = s * 100;
    s = Math.round(s);
    l = l * 100;
    l = Math.round(l);

    console.log('converted', hex, 'to', h, s, l);

    return {
        h: h,
        s: s,
        l: l
    };
}

/**
 * Converts (r, g, b) to {h, s, l}
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{h: number, s: number, l: number}}
 */
export function rgb_to_hsl(r, g, b) {
    let hex = rgb_to_hex(r, g, b);
    return hex_to_hsl(hex);
}

/**
 * Converts (r, g, b) to hex
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
export function rgb_to_hex(r, g, b) {
    return '#' + comp_to_hex(r) + comp_to_hex(g) + comp_to_hex(b);
}
// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#5624139
function comp_to_hex(comp) {
    let hex = comp.toString(16);
    return (hex.length == 1) ? '0' + hex : hex;
}

/**
 * Clamps maximum saturation to 1.5
 * @param {number} sat
 * @returns {string}
 */
export function clamp_sat(sat) {
    if (sat > 1.5)
        return 1.5.toString();

    return sat.toFixed(2);
}

export function clamp_lit(sat, lit) {
    if (sat >= 1.3 && lit < 0.8)
        return 0.8;
}

/**
 * Removes commas and dots from a string and returns the number
 * @param {string} string
 * @returns {number}
 */
export function clean_number(string) {
    return parseInt(string
    .replaceAll(',','')
    .replaceAll('.','')
    );
}

/**
 * Sanitise text for use in URLs
 * @param {string} text - Text to sanitise
 * @param {string} method - String to replace spaces with, defaults to '+'
 * @returns {string}
 * @see desanitise
 */
export function sanitise(text, method='+') {
    return encodeURI(text
    .replaceAll(' ', method)
    .replaceAll('/', '%2F'));
}

/**
 * Aggressive text sanitisation to prevent XSS
 * @param {string} text - Text to sanitise
 * @returns {string}
 */
export function sanitise_text(text) {
    return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Desanitise text from URLs
 * @param {string} text - Sanitised text
 * @param {string} method - String spaces were replaced with, defaults to '+'
 * @returns {string}
 * @see sanitise
 */
export function desanitise(text, method='+') {
    return decodeURI(text
    .replaceAll(method, ' ')
    .replaceAll('%2F', '/'));
}


/**
 * Return the artist from an album or track URL
 * @param {string} url - Link to an album or track
 * @param {boolean} is_album - Is this an album?
 * @returns {string}
 * @see return_artist_from_generic
 */
export function return_artist_from_track(url, is_album) {
    let split = url.split('/');
    let length = (split.length - 1);

    if (is_album)
        return desanitise(split[length - 1]);
    else
        return desanitise(split[length - 2]);
}

/**
 * Returns the artist from a URL of an unknown type (album or track)
 * @param {string} url - Link to an album or track
 * @returns {string}
 * @see return_artist_from_track
 */
export function return_artist_from_generic(url) {
    let split = url.split('/');
    let length = (split.length - 1);

    // artist/_/name in the url means it is a track
    if (split[length - 1] != '_')
        return desanitise(split[length - 1]);
    else
        return desanitise(split[length - 2]);
}

/**
 * Interpolates a hue value to transition smoothly around the hsl 360 scale
 * @param current
 * @param next
 * @param proximity
 * @returns {number}
 */
export function interpolate_hue(current, next, proximity) {
    // normalise
    current = ((current % 360) + 360) % 360;
    next = ((next % 360) + 360) % 360;

    let diff = next - current;

    // choose the shortest path
    if (diff > 180) {
        // go counter-clockwise instead
        diff -= 360;
    } else if (diff < -180) {
        // go clockwise instead
        diff += 360;
    }

    let interpolated = current + (diff * proximity);

    // normalise once more
    return ((interpolated % 360) + 360) % 360;
}

/**
 * Lazy loads an element by waiting until the user scrolls into view
 * @param {HTMLElement} elem - Element
 * @param {Function} func - Function when the element is scrolled into view
 * @param {Object} options - Any options to pass
 */
export function lazy(elem, func, options = {}) {
    const {
        threshold = 0.1,
        rootMargin = '50px'
    } = options;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                log('now allowing load', 'lazy', 'info', {elem: elem, options: options});
                func(elem);
                observer.unobserve(elem);
            }
        });
    }, { threshold, rootMargin });

    observer.observe(elem);
}

/**
 * Copies text to the clipboard
 * @param {string} text
 */
export function copy(text) {
    navigator.clipboard.writeText(text).then(() => {
        log('copied', 'copy', 'info', {text: text});
        notify({
            id: 'copy',
            title: tl(trans.copied_to_clipboard),
            icon: 'icon-16-copy'
        });
    });
}

export function download_with_progress(url, func) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                func(percent);
                log(`downloading ${percent}%`, 'download', 'info', {url: url});
            }
        }

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
                log(`downloaded ${url}`, 'download');
            } else {
                reject(new Error(`download failed: ${xhr.status}`));
                log(`download failed: ${xhr.status}`, 'download', 'error', {url: url});
            }
        }

        xhr.onerror = () => {
            reject(new Error('network error'));
            log('network error', 'download', 'error', {url: url});
        };
        xhr.send();
    });
}
