import { log } from '../build/log';
import { ff } from '../sku';

export function hoshino(artwork, name, sister, link = null) {
    if (!ff('hoshino')) return;

    let oracle_cache =
        JSON.parse(localStorage.getItem('bleh_oracle_cache')) || {};

    const name_lower = name.toLowerCase();
    const sister_lower = sister.toLowerCase();

    const album_name = oracle_cache[sister_lower]?.[name_lower]?.track?.name;
    const album_sister =
        oracle_cache[sister_lower]?.[name_lower]?.track?.sister;
    const href = oracle_cache[sister_lower]?.[name_lower]?.track?.link;

    if (!album_name || !album_sister) {
        log('no cache to be used', 'hoshino', 'info', {
            artwork,
            name,
            sister
        });
        return;
    }

    const art = load_hoshino_artwork(album_name, album_sister);

    artwork.src = art;
    log(`loaded cover art ${art}`, 'hoshino', 'info', {
        art,
        artwork,
        name,
        sister
    });

    artwork.setAttribute('data-hoshino', true);
    artwork.alt = album_name;

    if (link && href) {
        link.setAttribute('href', href);
    }
}

function load_hoshino_artwork(name, sister) {
    let hoshino_cache =
        JSON.parse(localStorage.getItem('bleh_hoshino_cache')) || {};

    const name_lower = name.toLowerCase();
    const sister_lower = sister.toLowerCase();

    const artwork = hoshino_cache[sister_lower]?.[name_lower];

    log(`loaded artwork ${artwork} from cache`, 'hoshino', 'info', {
        name,
        sister
    });
    return artwork;
}

export function save_hoshino_artwork(artwork, name, sister) {
    let hoshino_cache =
        JSON.parse(localStorage.getItem('bleh_hoshino_cache')) || {};

    const name_lower = name.toLowerCase();
    const sister_lower = sister.toLowerCase();

    if (!hoshino_cache[sister_lower]) hoshino_cache[sister_lower] = {};

    if (!artwork || artwork.endsWith('c6f59c1e5e7240a4c0d427abd71f3dbb.jpg')) {
        delete hoshino_cache[sister_lower][name_lower];

        log('cleared artwork from cache', 'hoshino', 'info', {
            artwork,
            name,
            sister
        });
        localStorage.setItem(
            'bleh_hoshino_cache',
            JSON.stringify(hoshino_cache)
        );
        return;
    }

    hoshino_cache[sister_lower][name_lower] = artwork;

    log(`saved artwork ${artwork} to cache`, 'hoshino', 'info', {
        artwork,
        name,
        sister
    });
    localStorage.setItem('bleh_hoshino_cache', JSON.stringify(hoshino_cache));
}
