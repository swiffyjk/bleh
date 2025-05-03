// https://stackoverflow.com/questions/46432335/hex-to-hsl-convert-javascript
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

export function rgb_to_hsl(r, g, b) {
    let hex = rgb_to_hex(r, g, b);
    return hex_to_hsl(hex);
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#5624139
export function comp_to_hex(comp) {
    let hex = comp.toString(16);
    return (hex.length == 1) ? '0' + hex : hex;
}
export function rgb_to_hex(r, g, b) {
    return '#' + comp_to_hex(r) + comp_to_hex(g) + comp_to_hex(b);
}

// saturation should not exceed 2, definitely not
// reaching 3 or even 4 in some cases
export function clamp_sat(sat) {
    if (sat > 1.5)
        return 1.5;

    return sat;
}

export function clean_number(string) {
    return parseInt(string
    .replaceAll(',','')
    .replaceAll('.','')
    );
}

export function sanitise(text, method='+') {
    return encodeURI(text
    .replaceAll(' ', method)
    .replaceAll('/', '%2F'));
}
export function sanitise_text(text) {
    return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
export function desanitise(text) {
    return decodeURI(text
    .replaceAll('+', ' ')
    .replaceAll('%2F', '/'));
}


export function return_artist_from_track(url, is_album) {
    let split = url.split('/');
    let length = (split.length - 1);

    // lets treat unicode properly
    if (is_album)
        return desanitise(split[length - 1]);
    else
        return desanitise(split[length - 2]);
}

export function return_artist_from_generic(url) {
    let split = url.split('/');
    let length = (split.length - 1);

    // lets treat unicode properly
    if (split[length - 1] != '_')
        return decodeURI(desanitise(split[length - 1]));
    else
        return decodeURI(desanitise(split[length - 2]));
}