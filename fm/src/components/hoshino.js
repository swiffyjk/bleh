import { log } from '../build/log';
import { ff } from '../sku';

export function hoshino(artwork, name, sister, link = null) {
    if (!ff('hoshino')) return;

    let oracle_cache =
        JSON.parse(localStorage.getItem('bleh_oracle_cache')) || {};

    const name_lower = name.toLowerCase();
    const sister_lower = sister.toLowerCase();

    const art = oracle_cache[sister_lower]?.[name_lower]?.track?.artwork;
    const href = oracle_cache[sister_lower]?.[name_lower]?.track?.link;
    const alt = oracle_cache[sister_lower]?.[name_lower]?.track?.name;

    if (!art) {
        log('no cache to be used', 'hoshino', 'info', {
            artwork,
            name,
            sister
        });
        return;
    }

    artwork.src = art;
    log(`loaded cover art ${art}`, 'hoshino', 'info', {
        art,
        artwork,
        name,
        sister
    });

    artwork.setAttribute('data-hoshino', true);

    if (alt) {
        artwork.alt = alt;
    }

    if (link && href) {
        link.setAttribute('href', href);
    }
}
