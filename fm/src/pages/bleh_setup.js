import { register_activity } from "../activity";
import { settings } from "../build/config";
import { log } from "../build/log";
import { auth, page, root } from "../build/page";
import { stored_season } from "../build/seasonal";
import { lang, trans } from "../build/trans";
import { request_changelog } from "../changelog";
import { dialog, dialog_rm } from "../components/dialog";
import { notify } from "../components/notify";
import { refresh_all } from "../config";
import { version } from "../main";
import { ff } from "../sku";
import { display_colour_presets } from "./bleh_config";

export function bleh_setup() {
    document.body.style.removeProperty('--hue-album');
    document.body.style.removeProperty('--sat-album');

    console.info('bleh - loading first-time setup');

    let adaptive_skin_container = document.querySelector('.adaptive-skin-container:not([data-bleh])');

    if (adaptive_skin_container == null)
        return;
    adaptive_skin_container.setAttribute('data-bleh','true');

    // initial
    adaptive_skin_container.innerHTML = '';
    if (!ff('page_title'))
        document.title = 'bleh setup | Last.fm';

    log('internal bleh setup', 'page');
    page.type = 'bleh_setup';
    page.subpage = '';


    // go wild
    adaptive_skin_container.innerHTML = (`
        <div class="bleh--page-outer">
            <div class="bleh--page-inner bleh-setup-container"></div>
        </div>
    `);

    document.body.classList.add('bleh-setup');
    document.body.style.setProperty('background-image', `url(${auth.avatar})`);
    document.body.style.setProperty('background-size', 'cover');

    let masthead = document.body.querySelector('.masthead');
    masthead.classList.add('in-setup');

    bleh_setup_start();
}

unsafeWindow._setup = function() {
    bleh_setup_start();
}
function bleh_setup_start() {
    let modal = dialog({
        id: 'bleh_setup_start',
        body: (`
            <div class="setup-sides">
                <div class="setup-preview">
                    <div class="setup-icon setup-icon-main setup-icon-home"></div>
                </div>
                <div class="setup-body">
                    <div class="setup-body-main">
                        <h1>${trans[lang].setup.start.name.replace('{m}', `<a class="mention" href="${root}user/${auth.name}">@${auth.name}</a>`)}</h1>
                        <h4>${trans[lang].setup.start.pick_theme}</h4>
                        <div class="primary-selections">
                            <div class="btn primary-selection" id="toggle-theme-light" data-toggle="theme" data-toggle-value="light" onclick="_update_item('theme', 'light')">
                                <h5>${trans[lang].settings.themes.light.name}</h5>
                            </div>
                            <div class="btn primary-selection" id="toggle-theme-dark" data-toggle="theme" data-toggle-value="dark" onclick="_update_item('theme', 'dark')">
                                <h5>${trans[lang].settings.themes.dark.name}</h5>
                            </div>
                            <div class="btn primary-selection" id="toggle-theme-darker" data-toggle="theme" data-toggle-value="darker" onclick="_update_item('theme', 'darker')">
                                <h5>${trans[lang].settings.themes.darker.name}</h5>
                            </div>
                            <div class="btn primary-selection" id="toggle-theme-oled" data-toggle="theme" data-toggle-value="oled" onclick="_update_item('theme', 'oled')">
                                <h5>${trans[lang].settings.themes.oled.name}</h5>
                            </div>
                        </div>
                        <div class="alert alert-info">${trans[lang].setup.start.change_later}</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn skip" onclick="_setup_skip()">
                            ${trans[lang].settings.skip}
                        </button>
                        <button class="btn primary continue" onclick="_setup_appearance()">
                            ${trans[lang].settings.continue}
                        </button>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'setup',
        replace_if_possible: true
    });

    refresh_all(modal);
}

unsafeWindow._setup_accessibility = function() {
    dialog({
        id: 'bleh_setup_accessibility',
        body: (`
            <div class="setup-sides">
                <div class="setup-preview">
                    <div class="setup-icon setup-icon-main setup-icon-accessibility"></div>
                </div>
                <div class="setup-body">
                    <div class="setup-body-main">
                        <h1>${trans[lang].settings.accessibility.name}</h1>
                        <div class="toggle-container" id="container-reduced_motion">
                            <button class="btn reset" onclick="_reset_item('reduced_motion')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.accessibility.reduced_motion.name}</h5>
                                <p>${trans[lang].settings.accessibility.reduced_motion.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-reduced_motion" onclick="_update_item('reduced_motion')" aria-checked="false">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="inner-preview pad flex">
                            <div class="shout js-shout js-link-block" data-kate-processed="true">
                                <h3 class="shout-user">
                                    <a>${auth.name}</a>
                                </h3>
                                <span class="avatar shout-user-avatar avatar--bleh-missing">
                                    <img src="" alt="Your avatar" loading="lazy">
                                </span>
                                <a class="shout-permalink shout-timestamp">
                                    <time datetime="2024-06-05T02:33:39+01:00" title="Wednesday 5 Jun 2024, 2:33am">
                                        5 Jun 2:33am
                                    </time>
                                </a>
                                <div class="shout-body">
                                    <p>${trans[lang].settings.accessibility.shout_preview}</p>
                                </div>
                            </div>
                        </div>
                        <div class="toggle-container" id="container-accessible_name_colours">
                            <button class="btn reset" onclick="_reset_item('accessible_name_colours')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.accessibility.accessible_name_colours.name}</h5>
                                <p>${trans[lang].settings.accessibility.accessible_name_colours.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-accessible_name_colours" onclick="_update_item('accessible_name_colours')" aria-checked="false">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container" id="container-underline_links">
                            <button class="btn reset" onclick="_reset_item('underline_links')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.accessibility.underline_links.name}</h5>
                                <p>${trans[lang].settings.accessibility.underline_links.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-underline_links" onclick="_update_item('underline_links')" aria-checked="false">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn back" disabled>
                            ${trans[lang].settings.back}
                        </button>
                        <div class="btn-fill"></div>
                        <button class="btn primary continue" onclick="_setup_skip()">
                            ${trans[lang].settings.finish}
                        </button>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'setup',
        replace_if_possible: true
    });
    refresh_all();
}

unsafeWindow._setup_appearance = function() {
    dialog({
        id: 'bleh_setup_appearance',
        body: (`
            <div class="setup-sides">
                <div class="setup-preview">
                    <div class="setup-icon setup-icon-main setup-icon-appearance">
                        <div class="setup-colour-behind for-appearance-0"></div>
                        <div class="setup-colour-behind for-appearance-1"></div>
                        <div class="setup-colour-behind for-appearance-2"></div>
                    </div>
                </div>
                <div class="setup-body">
                    <div class="setup-body-main">
                        <h1>${trans[lang].settings.appearance.name}</h1>
                        <h4>${trans[lang].settings.customise.colours.name}</h4>
                        <div class="inner-preview pad">
                            <table class="chartlist chartlist--with-image chartlist--with-loved chartlist--with-artist" style="margin: var(--card-gap) 0 !important">
                                <tbody>
                                    <tr class="chartlist-row chartlist-row--now-scrobbling chartlist-row--with-artist" style="transition: none !important">
                                        <td class="chartlist-image">
                                            <a class="cover-art"><img src="${auth.avatar}" loading="lazy"></a>
                                        </td>
                                        <td class="chartlist-loved">
                                            <button class="chartlist-love-button" data-toggle-button-current-state="unloved"></button>
                                        </td>
                                        <td class="chartlist-name">
                                            <a>Song title</a>
                                        </td>
                                        <td class="chartlist-artist">
                                            <a>${auth.name}</a>
                                        </td>
                                        <td class="chartlist-timestamp chartlist-timestamp--lang-en">
                                            <span class="chartlist-now-scrobbling">
                                                <a>Scrobbling now</a>
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="btn-row">
                                <button class="btn">${trans[lang].settings.examples.button}</button>
                                <button class="btn primary">${trans[lang].settings.examples.button}</button>
                                <div class="chartlist-count-bar">
                                    <a class="chartlist-count-bar-link">
                                        <span class="chartlist-count-bar-slug" style="width: 60%"></span>
                                        <span class="chartlist-count-bar-value">44,551</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="view-buttons colour-buttons view-buttons-middle" id="colour_custom"></div>
                        <div class="swatch-group">
                            <div id="colour_red" class="palette options colours"></div>
                            <div id="colour_orange" class="palette options colours"></div>
                            <div id="colour_yellow" class="palette options colours"></div>
                            <div id="colour_green" class="palette options colours"></div>
                            <div id="colour_lime" class="palette options colours"></div>
                            <div id="colour_aqua" class="palette options colours"></div>
                            <div id="colour_blue" class="palette options colours"></div>
                            <div id="colour_purple" class="palette options colours"></div>
                            <div id="colour_pink" class="palette options colours"></div>
                        </div>
                    </div>
                    <div class="alert alert-info">${trans[lang].setup.music.change_later}</div>
                    <div class="modal-footer">
                        <button class="btn back" onclick="_setup()">
                            ${trans[lang].settings.back}
                        </button>
                        <div class="btn-fill"></div>
                        <button class="btn skip" onclick="_setup_skip()">
                            ${trans[lang].settings.skip}
                        </button>
                        <button class="btn primary continue" onclick="_setup_corrections()">
                            ${trans[lang].settings.continue}
                        </button>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'setup',
        replace_if_possible: true
    })

    display_colour_presets();
    refresh_all();
}

unsafeWindow._setup_corrections = function() {
    dialog({
        id: 'bleh_setup_corrections',
        body: (`
            <div class="setup-sides">
                <div class="setup-preview">
                    <div class="setup-icon setup-icon-main setup-icon-corrections"></div>
                </div>
                <div class="setup-body">
                    <div class="setup-body-main">
                        <h1>${trans[lang].settings.music.name}</h1>
                        <p>${trans[lang].settings.corrections.bio}</p>
                        <div class="alert alert-info">${trans[lang].setup.music.change_later}</div>
                        <h4>${trans[lang].settings.corrections.formatting}</h4>
                        <div class="toggle-container" id="container-format_guest_features" onclick="_update_item('format_guest_features')">
                            <button class="btn reset" onclick="_reset_item('format_guest_features')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.corrections.format_guest_features.name}</h5>
                                <p>${trans[lang].settings.corrections.format_guest_features.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-format_guest_features" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container hide-if-format-guest-disabled" id="container-show_guest_features" onclick="_update_item('show_guest_features')">
                            <button class="btn reset" onclick="_reset_item('show_guest_features')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.corrections.show_guest_features.name}</h5>
                                <p>${trans[lang].settings.corrections.show_guest_features.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-show_guest_features" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container" id="container-corrections" onclick="_update_item('corrections')">
                            <button class="btn reset" onclick="_reset_item('corrections')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.corrections.toggle.name}</h5>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-corrections" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <h4>${trans[lang].settings.music.header}</h4>
                        <div class="toggle-container" id="container-stacked_chartlist_info" onclick="_update_item('stacked_chartlist_info')">
                            <button class="btn reset" onclick="_reset_item('stacked_chartlist_info')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.corrections.stacked_chartlist_info.name}</h5>
                                <p>${trans[lang].settings.corrections.stacked_chartlist_info.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-stacked_chartlist_info" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container hide-if-no-bulk-edit" id="container-show_bulk_edit_album" onclick="_update_item('show_bulk_edit_album')">
                            <button class="btn reset" onclick="_reset_item('show_bulk_edit_album')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.music.show_bulk_edit_album.name}</h5>
                                <p>${trans[lang].settings.music.show_bulk_edit_album.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-show_bulk_edit_album" aria-checked="false">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn back" onclick="_setup_appearance()">
                            ${trans[lang].settings.back}
                        </button>
                        <div class="btn-fill"></div>
                        <button class="btn skip" onclick="_setup_skip()">
                            ${trans[lang].settings.skip}
                        </button>
                        <button class="btn primary continue" onclick="_setup_seasons()">
                            ${trans[lang].settings.continue}
                        </button>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'setup',
        replace_if_possible: true
    });
    refresh_all();
}

unsafeWindow._setup_seasons = function() {
    dialog({
        id: 'bleh_setup_seasons',
        body: (`
            <div class="setup-sides">
                <div class="setup-preview">
                    <div class="setup-icon setup-icon-main setup-icon-seasons"></div>
                </div>
                <div class="setup-body">
                    <div class="setup-body-main">
                        <h1>${trans[lang].settings.customise.seasonal.name}</h1>
                        <div class="seasonal-inner">
                            <div class="current-season-box" data-season="${stored_season.id}">
                                <div class="current-season-info">
                                    <div class="bleh-icon bleh-seasonal-icon" data-season="${stored_season.id}"></div>
                                    <h4>${trans[lang].settings.customise.seasonal.listing[stored_season.id]}</h4>
                                </div>
                                <div class="glacier-library-top season-top">
                                    <div class="glacier-library-metadata">
                                        ${(stored_season.id != 'none' && stored_season.start && stored_season.end) ? (`
                                        <div class="glacier-library-metadata-item">
                                            <div class="sub-text">${trans[lang].settings.customise.seasonal.started}</div>
                                            <div class="glacier-library-metadata-item-value" id="current_season_start">${moment(stored_season.start.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).from(stored_season.now)}</div>
                                        </div>
                                        <div class="glacier-library-metadata-item">
                                            <div class="sub-text">${trans[lang].settings.customise.seasonal.ends_in}</div>
                                            <div class="glacier-library-metadata-item-value" id="current_season">${moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}</div>
                                        </div>
                                        `) : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="info-box no-padding">
                            <div class="bleh-icon bleh-info-icon"></div>
                            ${trans[lang].settings.customise.seasonal.info}
                        </div>
                        <!--<p>${trans[lang].settings.customise.seasonal.bio}</p>
                        <div class="inner-preview pad click-thru">
                            <div class="current-season-container">
                                <div class="current-season" data-season="${stored_season.id}" id="current_season">
                                    ${(stored_season.id != 'none')
                                    ? trans[lang].settings.customise.seasonal.marker.current.replace('{season}', trans[lang].settings.customise.seasonal.listing[stored_season.id])
                                    : (settings.seasonal) ? trans[lang].settings.customise.seasonal.marker.none : trans[lang].settings.customise.seasonal.marker.disabled}
                                </div>
                                <div class="current-season-started" id="current_season_start">
                                    ${(stored_season.id != 'none')
                                    ? trans[lang].settings.customise.seasonal.marker.started
                                    : ''}
                                </div>
                            </div>
                        </div>-->
                        <h4>${trans[lang].settings.configure}</h4>
                        <div class="toggle-container" id="container-seasonal" onclick="_update_item('seasonal')">
                            <button class="btn reset" onclick="_reset_item('seasonal')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.customise.seasonal.option.name}</h5>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-seasonal" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="sep"></div>
                        <div class="toggle-container hide-if-seasonal-disabled" id="container-seasonal_particles" onclick="_update_item('seasonal_particles')">
                            <button class="btn reset" onclick="_reset_item('seasonal_particles')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.customise.seasonal.particles.name}</h5>
                                <p>${trans[lang].settings.customise.seasonal.particles.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-seasonal_particles" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container hide-if-seasonal-disabled" id="container-seasonal_particles_reduced" onclick="_update_item('seasonal_particles_reduced')">
                            <button class="btn reset" onclick="_reset_item('seasonal_particles_reduced')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.customise.seasonal.show_less_particles.name}</h5>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-seasonal_particles_reduced" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="toggle-container hide-if-seasonal-disabled" id="container-seasonal_particles_fps" onclick="_update_item('seasonal_particles_fps')">
                            <button class="btn reset" onclick="_reset_item('seasonal_particles_fps')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.customise.seasonal.fps_particles.name}</h5>
                                <p>${trans[lang].settings.customise.seasonal.fps_particles.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-seasonal_particles_fps" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                        <div class="sep"></div>
                        <div class="toggle-container hide-if-seasonal-disabled" id="container-seasonal_overlays" onclick="_update_item('seasonal_overlays')">
                            <button class="btn reset" onclick="_reset_item('seasonal_overlays')">${trans[lang].settings.reset}</button>
                            <div class="heading">
                                <h5>${trans[lang].settings.customise.seasonal.overlays.name}</h5>
                                <p>${trans[lang].settings.customise.seasonal.overlays.bio}</p>
                            </div>
                            <div class="toggle-wrap">
                                <button class="toggle" id="toggle-seasonal_overlays" aria-checked="true">
                                    <div class="dot"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn back" onclick="_setup_corrections()">
                            ${trans[lang].settings.back}
                        </button>
                        <div class="btn-fill"></div>
                        <button class="btn skip" onclick="_setup_skip()">
                            ${trans[lang].settings.skip}
                        </button>
                        <button class="btn primary continue" onclick="_setup_accessibility()">
                            ${trans[lang].settings.continue}
                        </button>
                    </div>
                </div>
            </div>
        `),
        dismiss: false,
        type: 'setup',
        replace_if_possible: true
    })
    refresh_all();
}

unsafeWindow._setup_skip = function() {
    dialog_rm({
        all: true
    });
    document.location.href = `${root}user/${auth.name}`;
}


/**
     * notify user if new update and stores in localStorage for next time
     * @returns if first-time installing, redirect to setup
     */
export function notify_if_new_update() {
    let last_version_used = localStorage.getItem('bleh_last_version_used') || '';

    // enter first-time setup
    if (last_version_used == '') {
        window.location.href = `${root}bleh/setup`;
        localStorage.setItem('bleh_last_version_used', version.build);
        register_activity('install_bleh', [], `${root}bleh`);
        return;
    }

    // otherwise, it's a usual update
    if (last_version_used != version.build) {
        notify({
            title: trans[lang].messaging.update.replace('{v}', `${version.build}.${version.sku}`),
            persist: true,
            icon: 'icon-16-download'
        });
        register_activity('update_bleh', [{name: version.build, type: 'bleh'}], `${root}bleh`);
        localStorage.setItem('bleh_last_version_used', version.build);

        request_changelog();
    }
}