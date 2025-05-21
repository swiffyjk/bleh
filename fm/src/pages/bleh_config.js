import { settings, settings_base } from "../build/config";
import { log } from "../build/log";
import { album_track_corrections, artist_corrections, ranks } from "../build/music";
import { auth, page, root, theme_preview } from "../build/page";
import { stored_season } from "../build/seasonal";
import { sponsor_list } from "../build/sponsor";
import { hex_to_hsl, clamp_sat, sanitise_text } from '../build/tools';
import { lang, lang_info, trans_legacy, trans, tl } from "../build/trans";
import { load_badges } from '../components/badge';
import { dialog, dialog_legacy, dialog_rm, kill_window } from "../components/dialog";
import { correct_artist, correct_item_by_artist, name_includes } from '../components/lotus';
import { markdown } from '../components/markdown';
import { notify } from "../components/notify";
import { create_settings_template, load_settings, refresh_all, update_params } from "../config";
import { version } from "../main";
import { update_page } from "../page";
import { seasonal_timer_end, seasonal_timer_start } from "../seasonal";
import { ff } from "../sku";


export function bleh_settings() {
    page.name = auth.name;
    page.type = 'bleh_settings';
    page.subpage = '';

    update_page();

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);

    let params = new URLSearchParams(document.location.search);
    page.requested.tab = params.get('tab');
    page.requested.setting = params.get('setting');


    // go wild
    let nav = document.createElement('nav');
    nav.classList.add('navlist', 'secondary-nav', 'navlist--more', 'redesigned-navigation', 'bleh-settings-navigation');

    nav.innerHTML = (`
        <ul class="navlist-items">
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="home" onclick="_change_settings_page('home')">
                    ${tl(trans.home)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="themes" onclick="_change_settings_page('themes')">
                    ${tl(trans.appearance)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="music" onclick="_change_settings_page('music')">
                    ${tl(trans.music)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="customise" onclick="_change_settings_page('customise')">
                    ${tl(trans.layout)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="profiles" onclick="_change_settings_page('profiles')">
                    ${tl(trans.profiles)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="seasonal" data-season="${stored_season.id}" onclick="_change_settings_page('seasonal')">
                    ${tl(trans.seasonal.name)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="text" onclick="_change_settings_page('text')">
                    ${tl(trans.text)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="accessibility" onclick="_change_settings_page('accessibility')">
                    ${tl(trans.accessibility)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="performance" onclick="_change_settings_page('performance')">
                    ${tl(trans.troubleshooting)}
                </a>
            </li>
            <li class="navlist-item secondary-nav-item">
                <a class="secondary-nav-item-link bleh--nav" data-bleh-page="sku" onclick="_change_settings_page('sku')">
                    shhh...
                </a>
            </li>
        </ul>
    `);

    page.structure.side.innerHTML = (`
        <div class="cta first priority sponsor colourful">
            ${(auth.sponsor) ? (`
            <strong>${tl(trans.you_are_a_sponsor)}</strong>
            <a class="see-more" onclick="_sponsor_manage()">${tl(trans.manage_sponsor)}</a>
            `) : (`
            <strong>${tl(trans.news_sponsor_cta)}</strong>
            <a class="see-more" onclick="_sponsor()">${tl(trans.sponsor)}</a>
            `)}
        </div>
        <section class="side-actions">
            <button class="btn side-action" data-type="import" onclick="_import_settings()">
                ${tl(trans.import)}
            </button>
            <button class="btn side-action" data-type="export" onclick="_export_settings()">
                ${tl(trans.export)}
            </button>
            <button class="btn side-action" data-type="reset" onclick="_reset_settings()">
                ${tl(trans.reset)}
            </button>
        </section>
        <div class="bleh--panel">
            ${(ff('skip_to_setting')) ? (`
            <h4>${tl(trans.skip_to)}</h4>
            <div class="skip-to-list"></div>
            `) : ''}
        </div>
    `);


    page.structure.container.insertBefore(nav, page.structure.row);

    if (!page.requested.tab)
        change_settings_page('themes');
    else
        change_settings_page(page.requested.tab);

    if (page.requested.setting) {
        scroll_to_setting(page.requested.setting);
    }
}

export function render_setting_page(page_id) {
    if (page_id == 'themes') {
        register_skip_to([
            {
                id: 'hue_from_album',
                name: tl(trans.hue_from_album.name)
            },
            {
                id: 'colourful_tracks',
                name: tl(trans.colourful_tracks.name)
            }
        ]);

        return (`
            <div class="bleh--panel">
                <h4>${tl(trans.themes.name)}</h4>
                <div class="setting-items full">
                    <div class="side-left full even-more">
                        <button class="btn theme-item" data-bleh-theme="light" data-bleh--theme_type="light" onclick="change_theme_from_settings('light')">
                            <div class="preview-container">
                            <div class="preview" data-bleh--theme="light" data-bleh--theme_type="light">
                                ${theme_preview}
                            </div>
                            </div>
                            <div class="text">
                                <h5>${tl(trans.themes.light)}</h5>
                            </div>
                        </button>
                        <button class="btn theme-item" data-bleh-theme="ink" data-bleh--theme_type="light" onclick="change_theme_from_settings('ink')">
                            <div class="preview-container">
                            <div class="preview" data-bleh--theme="ink" data-bleh--theme_type="light">
                                ${theme_preview}
                            </div>
                            </div>
                            <div class="text">
                                <h5>${tl(trans.themes.ink)}</h5>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="setting-items full">
                    <div class="side-left full even-more">
                        <button class="btn theme-item" data-bleh-theme="dark" onclick="change_theme_from_settings('dark')">
                            <div class="preview-container">
                            <div class="preview" data-bleh--theme="dark">
                                ${theme_preview}
                            </div>
                            </div>
                            <div class="text">
                                <h5>${tl(trans.themes.dark)}</h5>
                            </div>
                        </button>
                        <button class="btn theme-item" data-bleh-theme="darker" onclick="change_theme_from_settings('darker')">
                            <div class="preview-container">
                            <div class="preview" data-bleh--theme="darker">
                                ${theme_preview}
                            </div>
                            </div>
                            <div class="text">
                                <h5>${tl(trans.themes.darker)}</h5>
                            </div>
                        </button>
                        <button class="btn theme-item" data-bleh-theme="oled" onclick="change_theme_from_settings('oled')">
                            <div class="preview-container">
                            <div class="preview" data-bleh--theme="oled">
                                ${theme_preview}
                            </div>
                            </div>
                            <div class="text">
                                <h5>${tl(trans.themes.oled)}</h5>
                            </div>
                        </button>
                    </div>
                </div>
                ${(ff('high_contrast')) ? (`
                <div class="setting" data-type="toggle" id="container-high_contrast" onclick="_update_item('high_contrast')">
                    <button class="btn reset" onclick="_reset_item('high_contrast')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.high_contrast.name}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-high_contrast" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                `) : ''}
                <h4>${tl(trans.colours)}</h4>
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
                <div class="setting" data-type="toggle" id="container-hue_from_album" onclick="_update_item('hue_from_album')">
                    <button class="btn reset" onclick="_reset_item('hue_from_album')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.hue_from_album.name)}</h5>
                        <p>${tl(trans.hue_from_album.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-hue_from_album" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-colourful_tracks" onclick="_update_item('colourful_tracks')">
                    <button class="btn reset" onclick="_reset_item('colourful_tracks')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.colourful_tracks.name)}</h5>
                        <p>${tl(trans.colourful_tracks.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-colourful_tracks" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                ${(ff('card_saturation')) ? (`
                <div class="setting hide-if-light-theme" data-type="slider" id="container-sat_bg">
                    <button class="btn reset" onclick="_reset_item('sat_bg')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.card_background_saturation.name)}</h5>
                        <p>${tl(trans.card_background_saturation.body)}</p>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-sat_bg"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="3" value="0" step="0.1" id="slider-sat_bg" oninput="_update_item('sat_bg', this.value)">
                        <p id="value-sat_bg">0</p>
                    </div>
                </div>
                `) : ''}
                <div class="sep"></div>
                <div class="setting" data-type="text" id="container-font">
                    <div class="heading">
                        <h5>${tl(trans.font.name)}</h5>
                        <p>${tl(trans.font.body)}</p>
                    </div>
                    <div class="input-container content-form">
                        <input type="text" maxlength="120" id="text-font" value="${settings.font}" placeholder="${tl(trans.enter_font_names)}">
                        <button class="bbtn chibi icon primary submit" onclick="_save_font()">${tl(trans.save)}</button>
                    </div>
                </div>
                <div class="setting" data-type="slider" id="container-font_weight">
                    <button class="btn reset" onclick="_reset_item('font_weight')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.font_weight.name)}</h5>
                        <p>${tl(trans.font_weight.body)}</p>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-font_weight"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="900" value="0" step="10" id="slider-font_weight" oninput="_update_item('font_weight', this.value)">
                        <p id="value-font_weight">0</p>
                    </div>
                </div>
                <div class="setting" data-type="slider" id="container-font_weight_medium">
                    <button class="btn reset" onclick="_reset_item('font_weight_medium')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.font_weight_medium.name)}</h5>
                        <p>${tl(trans.font_weight_medium.body)}</p>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-font_weight_medium"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="900" value="0" step="10" id="slider-font_weight_medium" oninput="_update_item('font_weight_medium', this.value)">
                        <p id="value-font_weight_medium">0</p>
                    </div>
                </div>
                <div class="setting" data-type="slider" id="container-font_weight_bold">
                    <button class="btn reset" onclick="_reset_item('font_weight_bold')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.font_weight_bold.name)}</h5>
                        <p>${tl(trans.font_weight_bold.body)}</p>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-font_weight_bold"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="900" value="0" step="10" id="slider-font_weight_bold" oninput="_update_item('font_weight_bold', this.value)">
                        <p id="value-font_weight_bold">0</p>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-font_emoji" onclick="_update_item('font_emoji')">
                    <button class="btn reset" onclick="_reset_item('font_emoji')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.font_emoji.name)}</h5>
                        <p>${tl(trans.font_emoji.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-font_emoji" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'customise') {
        register_skip_to([
            {
                id: 'profile_avi_background',
                name: trans_legacy.en.settings.customise.profile_header.see_type
            },
            {
                id: 'profile_header_own',
                name: trans_legacy.en.settings.customise.profile_header.view_on
            },
            {
                id: 'show_your_progress',
                name: trans_legacy.en.settings.customise.show_your_progress.name
            }
        ]);

        return (`
            <div class="bleh--panel check-artist-hover">
                <h4 class="top-header">${tl(trans.layout)}</h4>
                <h4>${trans_legacy.en.settings.layout.header}</h4>
                <div class="inner-preview pad">
                    <div class="profile-mockup artist">
                        <div class="mockup-header">
                            <div class="mockup-avatar-wrap">
                                <img class="mockup-avatar" src="https://lastfm.freetls.fastly.net/i/u/avatar170s/383d6c03304e720075d0050e8a6a4644">
                            </div>
                            <div class="mockup-info">
                                <div class="mockup-subtext"></div>
                                <div class="mockup-name"></div>
                            </div>
                        </div>
                        <div class="mockup-container">
                            <div class="mockup-col-main">
                                <div class="mockup-panel"></div>
                                <div class="mockup-panel main"></div>
                            </div>
                            <div class="mockup-col-sidebar">
                                <div class="mockup-panel"></div>
                                <div class="mockup-panel main"></div>
                            </div>
                        </div>
                        <div class="profile-mockup-background" style="background-image: url(https://lastfm.freetls.fastly.net/i/u/avatar170s/383d6c03304e720075d0050e8a6a4644);"></div>
                    </div>
                </div>
                <div class="setting" data-type="options">
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.layout.avatar_action.name}</h5>
                        <p>${trans_legacy.en.settings.layout.avatar_action.bio}</p>
                    </div>
                    <div class="primary-selections artist-hover-image">
                        <div class="btn primary-selection" id="toggle-default_avatar_action-expand" data-toggle="default_avatar_action" data-toggle-value="expand" onclick="_update_item('default_avatar_action', 'expand')">
                            <h5>${tl(trans.expand)}</h5>
                        </div>
                        <div class="btn primary-selection" id="toggle-default_avatar_action-gallery" data-toggle="default_avatar_action" data-toggle-value="gallery" onclick="_update_item('default_avatar_action', 'gallery')">
                            <h5>${tl(trans.photos)}</h5>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${trans_legacy.en.settings.customise.profile_header.name}</h4>
                <div class="inner-preview pad">
                    <div class="profile-mockup">
                        <div class="mockup-header">
                            <img class="mockup-avatar" src="${auth.avatar}">
                            <div class="mockup-info">
                                <div class="mockup-subtext"></div>
                                <div class="mockup-name"></div>
                            </div>
                        </div>
                        <div class="mockup-container">
                            <div class="mockup-col-main">
                                <div class="mockup-panel main"></div>
                            </div>
                            <div class="mockup-col-sidebar">
                                <div class="mockup-panel mockup-obsession-panel">
                                    <img class="mockup-obsession-art" src="https://lastfm.freetls.fastly.net/i/u/64s/510546e3b6df7504392274c528c77780.jpg">
                                    <div class="mockup-obsession-name"></div>
                                </div>
                                <div class="mockup-panel main"></div>
                            </div>
                        </div>
                        <div class="profile-mockup-background from-avatar" style="background-image: url(${auth.avatar});"></div>
                        <div class="profile-mockup-background from-track" style="background-image: url(https://lastfm.freetls.fastly.net/i/u/avatar170s/df927f4f88034b7f9a651636b965c9d7);"></div>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-profile_avi_background" onclick="_update_item('profile_avi_background')">
                    <button class="btn reset" onclick="_reset_item('profile_avi_background')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.profile_header.see_type}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-profile_avi_background" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <h4>${trans_legacy.en.settings.customise.profile_header.view_on}</h4>
                <div class="setting" data-type="toggle" id="container-profile_header_own" onclick="_update_item('profile_header_own')">
                    <button class="btn reset" onclick="_reset_item('profile_header_own')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.profile_header.for_own}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-profile_header_own" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-profile_header_others" onclick="_update_item('profile_header_others')">
                    <button class="btn reset" onclick="_reset_item('profile_header_others')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.profile_header.for_others}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-profile_header_others" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="toggle" id="container-show_your_progress" onclick="_update_item('show_your_progress')">
                    <button class="btn reset" onclick="_reset_item('show_your_progress')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.show_your_progress.name}</h5>
                        <p>${trans_legacy.en.settings.customise.show_your_progress.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_your_progress" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="toggle" id="container-rain" onclick="_update_item('rain')">
                    <button class="btn reset" onclick="_reset_item('rain')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.rain.name}</h5>
                        <p>${trans_legacy.en.settings.customise.rain.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-rain" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'seasonal') {
        register_skip_to([]);

        return (`
            <div class="bleh--panel">
                <div class="seasonal-inner">
                    <div class="sub-text">${tl(trans.seasonal_timeline)}</div>
                    <h4>${moment(stored_season.now).format('MMMM Do YYYY')}</h4>
                    <div class="current-season-box" data-season="${stored_season.id}">
                        <div class="current-season-info">
                            <div class="bleh-icon bleh-seasonal-icon" data-season="${stored_season.id}"></div>
                            <h4>${tl(trans.seasonal.listing[stored_season.id])}</h4>
                        </div>
                        <div class="glacier-library-top season-top">
                            <div class="glacier-library-metadata">
                                ${(stored_season.id != 'none' && stored_season.start && stored_season.end) ? (`
                                <div class="glacier-library-metadata-item">
                                    <div class="sub-text">${tl(trans.started)}</div>
                                    <div class="glacier-library-metadata-item-value" id="current_season_start">${moment(stored_season.start.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).from(stored_season.now)}</div>
                                </div>
                                <div class="glacier-library-metadata-item">
                                    <div class="sub-text">${tl(trans.ends_in)}</div>
                                    <div class="glacier-library-metadata-item-value" id="current_season">${moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}</div>
                                </div>
                                `) : (settings.seasonal) ? (`
                                <div class="glacier-library-metadata-item">
                                    <div class="sub-text">${tl(trans.next_in)}</div>
                                    <div class="glacier-library-metadata-item-value" id="next_season_start">${moment(stored_season.next_start.replace('y0', (stored_season.next_is_new_year) ? stored_season.year + 1 : stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}</div>
                                </div>
                                `) : ''}
                            </div>
                        </div>
                    </div>
                </div>
                ${(settings.seasonal) ? (`
                <div class="alert alert-info">
                    ${tl(trans.seasonal_offset).replace('{offset}', `<strong>${stored_season.offset}</strong>`)}
                </div>
                `) : ''}
                <h4>${tl(trans.settings)}</h4>
                <div class="setting" data-type="toggle" id="container-seasonal" onclick="_update_item('seasonal')">
                    <button class="btn reset" onclick="_reset_item('seasonal')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.seasonal.option.name}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-seasonal" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="options">
                    <div class="heading">
                        <h5>${tl(trans.seasonal_particles.name)}</h5>
                        <p>${tl(trans.seasonal_particles.body)}</p>
                    </div>
                    <div class="primary-selections">
                        <div class="btn primary-selection no-icon" id="toggle-seasonal_particles-all" data-toggle="seasonal_particles" data-toggle-value="all" onclick="_update_item('seasonal_particles', 'all')">
                            <h5>${tl(trans.all_particles)}</h5>
                        </div>
                        <div class="btn primary-selection no-icon" id="toggle-seasonal_particles-less" data-toggle="seasonal_particles" data-toggle-value="less" onclick="_update_item('seasonal_particles', 'less')">
                            <h5>${tl(trans.less_particles)}</h5>
                        </div>
                        <div class="btn primary-selection no-icon" id="toggle-seasonal_particles-none" data-toggle="seasonal_particles" data-toggle-value="none" onclick="_update_item('seasonal_particles', 'none')">
                            <h5>${tl(trans.no_particles)}</h5>
                        </div>
                    </div>
                </div>
                <div class="setting hide-if-seasonal-disabled" data-type="toggle" id="container-seasonal_particles_fps" onclick="_update_item('seasonal_particles_fps')">
                    <button class="btn reset" onclick="_reset_item('seasonal_particles_fps')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.seasonal.fps_particles.name}</h5>
                        <p>${trans_legacy.en.settings.customise.seasonal.fps_particles.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-seasonal_particles_fps" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting hide-if-seasonal-disabled" data-type="toggle" id="container-seasonal_overlays" onclick="_update_item('seasonal_overlays')">
                    <button class="btn reset" onclick="_reset_item('seasonal_overlays')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.customise.seasonal.overlays.name}</h5>
                        <p>${trans_legacy.en.settings.customise.seasonal.overlays.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-seasonal_overlays" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
        `);
    } else if (page_id == 'performance') {
        register_skip_to([]);

        return (`
            <div class="bleh--panel">
                <div class="alert alert-danger">${tl(trans.beware_notice)}</div>
                <div class="setting" data-type="text" id="container-branch">
                    <div class="heading">
                        <h5>${tl(trans.branch.name)}</h5>
                        <p>${tl(trans.branch.body)}</p>
                    </div>
                    <div class="input-container content-form">
                        <input type="text" maxlength="120" id="text-branch" value="${settings.branch}" placeholder="${tl(trans.enter_branch_name)}">
                        <button class="bbtn chibi icon primary submit" onclick="_save_branch()">${tl(trans.save)}</button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-dev" onclick="_update_item('dev')">
                    <button class="btn reset" onclick="_reset_item('dev')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.performance.dev.name}</h5>
                        <p>${trans_legacy.en.settings.performance.dev.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-dev" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>Refresh theme</h5>
                        <p>Force download the latest version of the stylesheet</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="bleh--btn primary" onclick="_force_refresh_theme()">Refresh</button>
                    </div>
                </div>
                <div class="sep"></div>
                <h4>Debug information</h4>
                <ul>
                    <li>Theme loading is currently ${!settings.dev}</li>
                    <li><span class="lotus lotus-name lotus-name-small">lotus</span> is currently ${settings.corrections}</li>
                    <br>
                    <li>Theme will expire at <span class="time">${moment(localStorage.getItem('bleh_cached_style_timeout')).format('HH:mm:ss Z')}</span></li>
                    <li><span class="lotus lotus-name lotus-name-small">lotus</span> (artist) will expire at <span class="time">${moment(localStorage.getItem('lotus_artist_expire')).format('HH:mm:ss Z')}</span></li>
                    <li><span class="lotus lotus-name lotus-name-small">lotus</span> (album_track) will expire at <span class="time">${moment(localStorage.getItem('lotus_album_track_expire')).format('HH:mm:ss Z')}</span></li>
                    <br>
                    <li>It is currently <span class="time">${moment().format('HH:mm:ss Z')}</span></li>
                    <br>
                    <li>Has the timeout expired? ${new Date(localStorage.getItem('bleh_cached_style_timeout')) < new Date()}</li>
                </ul>
                <div class="sep"></div>
                <h4>Debugging interactions</h4>
                <button class="continue" onclick="_notify({
                id: 'test',
                title: 'testing!',
                body: 'haaaiaiii test bodyyy.......'
                })">Deliver notification</button>
                <button class="continue" onclick="_notify({
                id: 'test',
                title: 'testing!',
                body: 'haaaiaiii test bodyyy.......',
                persist: true
                })">Deliver persistent notification</button>
                <div class="sep"></div>
                <h4>Manage flags</h4>
                <button class="continue" onclick="_change_settings_page('sku')">Open sku page</button>
            </div>
            `);
    } else if (page_id == 'profiles') {
        register_skip_to([
            {
                id: 'profile_shortcut',
                type: 'text',
                name: tl(trans.profile_shortcut.name)
            },
            {
                id: 'activities',
                name: tl(trans.activity_tracking.name)
            }
        ]);

        return (`
            <div class="bleh--panel sponsor-badge-panel" data-sponsoring="${auth.sponsor}">
                <div class="profile-container">
                    <div class="avatar-side small">
                        <div class="avatar">
                            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}" loading="lazy">
                        </div>
                    </div>
                    <div class="info-side">
                        <div class="header-info">
                            <div class="sub-text">${tl(trans.you)}</div>
                            <div class="header standalone title-container">
                                <h1>${auth.name}</h1>
                                <div class="badges">
                                    ${(auth.pro) ? (`
                                    <span class="label user-status-subscriber">${tl(trans.badges['user-status-subscriber'].name)}</span>
                                    `) : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${(ff('api')) ? (`
                <h4>${trans_legacy.en.settings.profiles.api.name}</h4>
                <div class="alert alert-info">${trans_legacy.en.settings.profiles.api.bio}</div>
                <div class="setting" data-type="text" id="container-api_key">
                    <button class="btn reset" onclick="_reset_item('api_key')">${tl(trans.reset)}</button>
                    <div class="heading content-form">
                        <div class="input-container">
                            <input type="password" maxlength="120" id="text-api_key" value="${settings.api_key}" placeholder="${trans_legacy.en.settings.profiles.api.placeholder}">
                            <button class="btn primary save" onclick="_save_api_key()">${tl(trans.save)}</button>
                            <a class="btn-add" href="${root}api/account/create" target="_blank">${trans_legacy.en.settings.create}</a>
                        </div>
                    </div>
                </div>
                `) : ''}
                <div class="sep"></div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>${tl(trans.sponsor_data).replace('{v}', `<span class="version-link sponsor-related">${sponsor_list.latest}</span>`)}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="see-more update-check sponsor-related" onclick="_sponsor_check()">${tl(trans.update_check)}</button>
                    </div>
                </div>
                <div class="setting" data-type="text" id="container-profile_shortcut">
                    <div class="heading content-form">
                        <h5>${tl(trans.profile_shortcut.name)}</h5>
                        <p>${tl(trans.profile_shortcut.body)}</p>
                    </div>
                    <div class="avatar-container">
                        <div class="avatar-inner" id="avatar-profile_shortcut">
                            <img id="avatar_src-profile_shortcut" src="${localStorage.getItem('bleh_profile_shortcut_avi') || ''}">
                        </div>
                    </div>
                    <div class="input-container content-form">
                        <input type="text" maxlength="40" id="text-profile_shortcut" value="${settings.profile_shortcut}" placeholder="${tl(trans.enter_username)}">
                        <button class="btn chibi icon primary submit" onclick="_save_profile_shortcut()">${tl(trans.save)}</button>
                    </div>
                </div>
                <div class="setting" data-type="slider" id="container-avatar_radius">
                    <button class="btn reset" onclick="_reset_item('avatar_radius')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.avatar_radius)}</h5>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-avatar_radius"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="50" value="0" step="1" id="slider-avatar_radius" oninput="_update_item('avatar_radius', this.value)">
                        <p id="value-avatar_radius">0</p>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-bio_markdown" onclick="_update_item('bio_markdown')">
                    <button class="btn reset" onclick="_reset_item('bio_markdown')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.markdown_profiles.name)}</h5>
                        <p>${tl(trans.markdown_profiles.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-bio_markdown" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.notes)}</h4>
                <div class="profile-notes">
                    <div class="loading-data-container">
                        <div class="loading-data-text failed">${tl(trans.no_notes)}</div>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.activity)}</h4>
                <p>${tl(trans.what_are_activities)}</p>
                <div class="inner-preview pad">
                    <div class="preview-card activity-preview">

                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activities" onclick="_update_item('activities')">
                    <button class="btn reset" onclick="_reset_item('activities')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.activity_tracking.name)}</h5>
                        <p>${tl(trans.activity_tracking.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activities" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>${tl(trans.clear_history)}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="see-more" onclick="_clear_activity_history()">
                            ${tl(trans.clear)}
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="toggle" id="container-activity_shout" onclick="_update_item('activity_shout')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-shoutbox)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.shouts)}</h5>
                        <p>${tl(trans.activity.types.shout)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_shout" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_image" onclick="_update_item('activity_image')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-gallery-vertical)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.photos)}</h5>
                        <p>${tl(trans.activity.types.image)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_image" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_obsess" onclick="_update_item('activity_obsess')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-obsession)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.obsessions)}</h5>
                        <p>${tl(trans.activity.types.obsess)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_obsess" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_love" onclick="_update_item('activity_love')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-heart)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.love)}</h5>
                        <p>${tl(trans.activity.types.love)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_love" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_bookmark" onclick="_update_item('activity_bookmark')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-bookmark)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.bookmarks)}</h5>
                        <p>${tl(trans.activity.types.bookmark)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_bookmark" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_wiki" onclick="_update_item('activity_wiki')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-bio)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.wiki)}</h5>
                        <p>${tl(trans.activity.types.wiki)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_wiki" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-activity_install" onclick="_update_item('activity_install')">
                    <div class="icon">
                        <div class="bleh-icon" style="--icon: var(--icon-16-download)"></div>
                    </div>
                    <div class="heading">
                        <h5>${tl(trans.installation)}</h5>
                        <p>${tl(trans.activity.types.install)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-activity_install" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'accessibility') {
        register_skip_to([]);

        return (`
            <div class="bleh--panel">
                <h4 class="top-header">${tl(trans.accessibility)}</h4>
                <div class="setting" data-type="toggle" id="container-reduced_motion" onclick="_update_item('reduced_motion')">
                    <button class="btn reset" onclick="_reset_item('reduced_motion')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.accessibility.reduced_motion.name}</h5>
                        <p>${trans_legacy.en.settings.accessibility.reduced_motion.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-reduced_motion" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="inner-preview pad flex">
                    <div class="shout js-shout js-link-block" data-kate-processed="true">
                        <h3 class="shout-user">
                            <a>${auth.name}</a>
                        </h3>
                        <span class="avatar shout-user-avatar">
                            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}" loading="lazy">
                        </span>
                        <a class="shout-permalink shout-timestamp">
                            <time datetime="2024-06-05T02:33:39+01:00" title="Wednesday 5 Jun 2024, 2:33am">
                                5 Jun 2:33am
                            </time>
                        </a>
                        <div class="shout-body">
                            <p>${trans_legacy.en.settings.accessibility.shout_preview}</p>
                        </div>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-toggle_icon" onclick="_update_item('toggle_icon')">
                    <button class="btn reset" onclick="_reset_item('toggle_icon')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.settings.accessibility.toggle_icon.name}</h5>
                        <p>${trans_legacy.en.settings.accessibility.toggle_icon.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-toggle_icon" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'text') {
        register_skip_to([]);

        return (`
            <div class="bleh--panel">
                <h4 class="top-header">${trans_legacy.en.settings.text.name}</h4>
                <div class="inner-preview pad flex">
                    <div class="shout js-shout js-link-block" data-kate-processed="true">
                        <h3 class="shout-user">
                            <a>${auth.name}</a>
                        </h3>
                        <span class="avatar shout-user-avatar">
                            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}" loading="lazy">
                        </span>
                        <a class="shout-permalink shout-timestamp">
                            <time datetime="2024-06-05T02:33:39+01:00" title="Wednesday 5 Jun 2024, 2:33am">
                                5 Jun 2:33am
                            </time>
                        </a>
                        <div class="shout-body if-markdown-on">
                            ${markdown(tl(trans.markdown_shouts.preview))}
                        </div>
                        <div class="shout-body if-markdown-off">
                            <p>${tl(trans.markdown_shouts.preview)}</p>
                        </div>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-shout_markdown" onclick="_update_item('shout_markdown')">
                    <button class="btn reset" onclick="_reset_item('shout_markdown')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.markdown_shouts.name)}</h5>
                        <p>${tl(trans.markdown_shouts.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-shout_markdown" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="sep"></div>
                <div class="setting" data-type="toggle" id="container-accessible_name_colours" onclick="_update_item('accessible_name_colours')">
                    <button class="btn reset" onclick="_reset_item('accessible_name_colours')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.accessible_name_colours.name)}</h5>
                        <p>${tl(trans.accessible_name_colours.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-accessible_name_colours" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-underline_links" onclick="_update_item('underline_links')">
                    <button class="btn reset" onclick="_reset_item('underline_links')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.underline_links.name)}</h5>
                        <p>${tl(trans.underline_links.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-underline_links" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.language)}</h4>
                <div class="languages" id="languages"></div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>${tl(trans.submit_language.name)}</h5>
                        <p>${tl(trans.submit_language.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <a class="see-more" href="https://github.com/katelyynn/bleh/wiki" target="_blank">${tl(trans.help_contribute)}</a>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'sku') {
        register_skip_to([]);

        return (`
            <div class="bleh--panel shh">
                <div class="sub-text">${version.build}.${version.sku}</div>
                ☆⌒(>w<)
            </div>
            <div class="bleh--panel">
                <h4>Manage active flags</h4>
                <div class="alert alert-danger">Be careful! Only manage these if you know what you are doing.</div>
                <div class="feature-flags" id="feature-flags"></div>
            </div>
            `);
    } else if (page_id == 'music') {
        register_skip_to([
            {
                id: 'corrections',
                name: tl(trans.correct_titles_with_lotus)
            },
            {
                id: 'format_guest_features',
                name: tl(trans.format_guest_features.name)
            },
            {
                id: 'stacked_chartlist_info',
                name: tl(trans.track_column_view)
            },
            {
                id: 'colourful_counts',
                name: tl(trans.colourful_counts.name)
            },
            {
                id: 'travis',
                name: tl(trans.redirect_messages.name)
            },
            {
                id: 'gloss',
                type: 'slider',
                name: tl(trans.gloss.name)
            },
            {
                id: 'grid_glow',
                name: tl(trans.grid_glow.name)
            },
            {
                id: 'gendered_tags',
                name: tl(trans.gendered_tags.name)
            }
        ]);

        console.info(artist_corrections, album_track_corrections);

        let preview_bar = 'background: linear-gradient(90deg';
        let preview_bar_text = '';

        // global sat/lit is used to substitute the values computed in h3 sat/lit
        // as they return eg. calc(0.85 * 50%), so we use global_sat to get 0.85
        // which can then be used in a .replace(global_sat, 'whatever we want')
        let global_sat = getComputedStyle(document.body).getPropertyValue('--sat');
        let global_lit = getComputedStyle(document.body).getPropertyValue('--lit');
        let h3_sat = getComputedStyle(document.body).getPropertyValue('--h3-sat');
        let h3_lit = getComputedStyle(document.body).getPropertyValue('--h3-lit');

        let maximum = 16_000;
        let max_rank = 11;

        //console.info(maximum, max_rank);
        for (let rank = 0; rank <= max_rank; rank++) {
            let this_rank = ranks[parseInt(rank)];
            //console.info(this_rank);

            let percent = ((this_rank.start / maximum) * 100);
            preview_bar = `${preview_bar}, hsl(${this_rank.hue}, ${h3_sat.replace(global_sat, this_rank.sat)}, ${h3_lit.replace(global_lit, this_rank.lit)}) ${percent}%`;

            if ((this_rank.start > 500 || this_rank.start == 0) && this_rank.start != 1500) {
                let text = `${this_rank.start}`;

                preview_bar_text = `${preview_bar_text}<div class="preview-bar-text-entry" style="left: ${percent}%">${text.replaceAll('_', ',')}</div>`;
            }
        }

        preview_bar = `${preview_bar});`;
        //console.info('preview bar', preview_bar, global_sat, h3_sat, global_lit, h3_lit);

        return (`
            <div class="bleh--panel lotus">
                <h4>${tl(trans.brand_version_number)
                .replace('{brand}', `<a class="lotus lotus-name" href="https://github.com/katelyynn/lotus" target="_blank">lotus</a>`)
                .replace('{number}', `<span class="version-link lotus">${(artist_corrections.version >= album_track_corrections.version) ? artist_corrections.version : album_track_corrections.version}</span>`)}</h4>
                <p>${tl(trans.what_is_lotus)}</p>
                <div class="inner-preview pad">
                    <div class="lotus-preview">
                        <div class="before">
                            <h1>mY aNtI-aIrCrAfT fRiEnD</h1>
                            <h2>jUlIe</h2>
                        </div>
                        <div class="after">
                            <h1>my anti-aircraft friend</h1>
                            <h2>julie</h2>
                        </div>
                    </div>
                </div>
                <div class="screen-row actions-only">
                    <div class="actions">
                        <button class="see-more update-check" onclick="_lotus_check()">${tl(trans.update_check)}</button>
                        <div class="fill"></div>
                        <button class="see-more expand" onclick="_open_correction_modal()">${tl(trans.view_all)}</button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-corrections" onclick="_update_item('corrections')">
                    <button class="btn reset" onclick="_reset_item('corrections')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.correct_titles_with_lotus)}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle lotus" id="toggle-corrections" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>${tl(trans.help_contribute)}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <a class="see-more" href="https://github.com/katelyynn/lotus/issues/new/choose" target="_blank">
                            ${tl(trans.suggest_correction)}
                        </a>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${trans_legacy.en.settings.corrections.formatting}</h4>
                <div class="inner-preview pad flex">
                    <section class="redesigned-header mockup redesigned-track-header no-top-margin">
                        <div class="avatar-side">
                            <img src="https://lastfm.freetls.fastly.net/i/u/avatar170s/8bd696cbd4aa4d4eb6d35393232f55e4.jpg">
                        </div>
                        <div class="info-side">
                            <div class="sub-text">${tl(trans.track)}</div>
                            <div class="title-container">
                                <h1 class="bleh--name-with-features">
                                    <div class="title">California Love</div>
                                    <div class="feat" data-bleh--tag-type="ft." data-bleh--tag-group="guests">ft. Dr. Dre, Roger Troutman</div>
                                    <div class="feat" data-bleh--tag-type="- remix" data-bleh--tag-group="mixes">Remix</div>
                                </h1>
                                <h1 class="bleh--name-without-features">
                                    California Love (ft. Dr. Dre, Roger Troutman) - Remix
                                </h1>
                            </div>
                            <h2>
                                <a class="header-new-crumb">2Pac</a><span class="bleh--name-with-features">, </span>
                                <a class="header-new-crumb bleh--name-with-features">Dr. Dre</a><span class="bleh--name-with-features">, </span>
                                <a class="header-new-crumb bleh--name-with-features">Roger Troutman</a>
                            </h2>
                        </div>
                    </section>
                </div>
                <div class="setting" data-type="toggle" id="container-format_guest_features" onclick="_update_item('format_guest_features')">
                    <button class="btn reset" onclick="_reset_item('format_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.format_guest_features.name)}</h5>
                        <p>${tl(trans.format_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-format_guest_features" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting hide-if-format-guest-disabled" id="container-show_guest_features" onclick="_update_item('show_guest_features')">
                    <button class="btn reset" onclick="_reset_item('show_guest_features')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.show_guest_features.name)}</h5>
                        <p>${tl(trans.show_guest_features.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_guest_features" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="inner-preview pad flex">
                    <section class="redesigned-header mockup redesigned-album-header no-top-margin">
                        <div class="avatar-side">
                            <img src="https://lastfm.freetls.fastly.net/i/u/avatar170s/def68d94aae8e52ef2d1c0c9d3e16ff4.jpg">
                        </div>
                        <div class="info-side">
                            <div class="sub-text">${tl(trans.album)}</div>
                            <div class="title-container">
                                <h1>
                                    <div class="title">my anti-aircraft friend</div>
                                    <div class="feat" data-bleh--tag-type="(remaster" data-bleh--tag-group="remasters">Remastered</div>
                                </h1>
                            </div>
                            <h2>
                                <a class="header-new-crumb">julie</a>
                            </h2>
                        </div>
                    </section>
                </div>
                <div class="setting hide-if-format-guest-disabled" data-type="toggle" id="container-show_remaster_tags" onclick="_update_item('show_remaster_tags')">
                    <button class="btn reset" onclick="_reset_item('show_remaster_tags')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.show_remaster_tags)} <div class="new-badge">${tl(trans.beta)}</div></h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_remaster_tags" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4 class="top-header">${tl(trans.music)}</h4>
                <h4>${tl(trans.tracklist)}</h4>
                <div class="inner-preview pad">
                    <div class="tracks">
                        <div class="track realtime">
                            <div class="cover"></div>
                            <div class="info">
                                <div class="title"></div>
                                <div class="artist"></div>
                                <div class="album"></div>
                            </div>
                            <div class="time"></div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="info">
                                <div class="title"></div>
                                <div class="artist"></div>
                            </div>
                            <div class="time"></div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="info">
                                <div class="title"></div>
                                <div class="artist"></div>
                            </div>
                            <div class="time"></div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="info">
                                <div class="title"></div>
                                <div class="artist"></div>
                            </div>
                            <div class="time"></div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="info">
                                <div class="title"></div>
                                <div class="artist"></div>
                            </div>
                            <div class="time"></div>
                        </div>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-stacked_chartlist_info" onclick="_update_item('stacked_chartlist_info')">
                    <button class="btn reset" onclick="_reset_item('stacked_chartlist_info')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.track_column_view)}</h5>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-stacked_chartlist_info" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting hide-if-no-bulk-edit" data-type="toggle" id="container-show_bulk_edit_album" onclick="_update_item('show_bulk_edit_album')">
                    <button class="btn reset" onclick="_reset_item('show_bulk_edit_album')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.show_bulk_edit_album.name)}</h5>
                        <p>${tl(trans.show_bulk_edit_album.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-show_bulk_edit_album" aria-checked="false">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-glacier_library_graphs" onclick="_update_item('glacier_library_graphs')">
                    <button class="btn reset" onclick="_reset_item('glacier_library_graphs')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.glacier_graphs.name)}</h5>
                        <p>${tl(trans.glacier_graphs.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-glacier_library_graphs" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="inner-preview pad">
                    <div class="personal-stats-preview-bar-container">
                        <div class="personal-stats-preview-bar" style="${preview_bar}"></div>
                        <div class="personal-stats-preview-text">${preview_bar_text}</div>
                    </div>
                    <div class="sep"></div>
                    <div class="tracks">
                        <div class="track">
                            <div class="cover"></div>
                            <div class="title"></div>
                            <div class="bar">
                                <div class="fill not-colourful-example" style="width: 100%"></div>
                                <div class="fill colourful colourful-example" style="width: 100%; --hue: -16.888749999999998; --sat: 1.5; --lit: 0.875"></div>
                            </div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="title"></div>
                            <div class="bar">
                                <div class="fill not-colourful-example" style="width: 85%"></div>
                                <div class="fill colourful colourful-example" style="width: 85%; --hue: 0.21863999999999972; --sat: 1.399218; --lit: 0.891406"></div>
                            </div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="title"></div>
                            <div class="bar">
                                <div class="fill not-colourful-example" style="width: 60%"></div>
                                <div class="fill colourful colourful-example" style="width: 60%; --hue: 18.77; --sat: 1.425; --lit: 0.9175833333333334"></div>
                            </div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="title"></div>
                            <div class="bar">
                                <div class="fill not-colourful-example" style="width: 30%"></div>
                                <div class="fill colourful colourful-example" style="width: 30%; --hue: 50.769767441860466; --sat: 1.361813953488372; --lit: 0.943406976744186"></div>
                            </div>
                        </div>
                        <div class="track">
                            <div class="cover"></div>
                            <div class="title"></div>
                            <div class="bar">
                                <div class="fill not-colourful-example" style="width: 5%"></div>
                                <div class="fill colourful colourful-example" style="width: 5%; --hue: 92.42; --sat: 1.35; --lit: 0.925"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-colourful_counts" onclick="_update_item('colourful_counts')">
                    <div class="heading">
                        <h5>${tl(trans.colourful_counts.name)}</h5>
                        <p>${tl(trans.colourful_counts.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-colourful_counts" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.redirections)}</h4>
                <div class="setting" data-type="toggle" id="container-travis" onclick="_update_item('travis')">
                    <div class="heading">
                        <h5>${tl(trans.redirect_messages.name)}</h5>
                        <p>${tl(trans.redirect_messages.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-travis" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
                <div class="setting" data-type="toggle">
                    <div class="heading">
                        <h5>${tl(trans.legacy_redirects.name)}</h5>
                        <p>${tl(trans.legacy_redirects.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <a class="see-more" href="${root}settings/website" target="_blank">
                            ${tl(trans.change_now)}
                        </a>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.artwork)}</h4>
                <div class="inner-preview pad">
                    <div class="palette albums" style="height: fit-content">
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/1569198c4cf0a3b2ff8728975e8359fa.jpg')"></div>
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/b897255bf422baa93a42536af293f9f8.jpg')"></div>
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/def68d94aae8e52ef2d1c0c9d3e16ff4.jpg')"></div>
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/510546e3b6df7504392274c528c77780.jpg')"></div>
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/49cc807f69d59746b6b04be3434e6637.jpg')"></div>
                        <div class="album-cover swatch" style="background-image: url('https://lastfm.freetls.fastly.net/i/u/770x0/dd76702cea38c838a3090dd9496d92d9.jpg')"></div>
                    </div>
                </div>
                <div class="setting" data-type="slider" id="container-gloss">
                    <button class="btn reset" onclick="_reset_item('gloss')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.gloss.name)}</h5>
                        <p>${tl(trans.gloss.body)}</p>
                    </div>
                    <div class="slider">
                        <div class="slider-track" id="slider-track-gloss"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                        <input type="range" min="0" max="1" value="0" step="0.05" id="slider-gloss" oninput="_update_item('gloss', this.value)">
                        <p id="value-gloss">0</p>
                    </div>
                </div>
                <div class="setting" data-type="toggle" id="container-grid_glow" onclick="_update_item('grid_glow')">
                    <button class="btn reset" onclick="_reset_item('grid_glow')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.grid_glow.name)}</h5>
                        <p>${tl(trans.grid_glow.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-grid_glow" aria-checked="true" type="button">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${trans_legacy.en.settings.customise.display.name}</h4>
                <div class="inner-preview pad flex">
                    <section class="catalogue-tags">
                        <ul class="tags-list tags-list--global">
                            <li class="tag">
                                <a href="/tag/pop">pop</a>
                            </li>
                            <li class="tag">
                                <a href="/tag/country">country</a>
                            </li>
                            <li class="tag">
                                <a href="/tag/singer-songwriter">singer-songwriter</a>
                            </li>
                            <li class="tag">
                                <a href="/tag/female+vocalists">female vocalists</a>
                            </li>
                            <li class="tag">
                                <a href="/tag/synthpop">synthpop</a>
                            </li>
                        </ul>
                    </section>
                </div>
                <div class="setting" data-type="toggle" id="container-gendered_tags" onclick="_update_item('gendered_tags')">
                    <button class="btn reset" onclick="_reset_item('gendered_tags')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${tl(trans.gendered_tags.name)}</h5>
                        <p>${tl(trans.gendered_tags.body)}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-gendered_tags" aria-checked="true">
                            <div class="dot"></div>
                        </button>
                    </div>
                </div>
            </div>
            `);
    }
}

function register_skip_to(list = null) {
    if (!ff('skip_to_setting'))
        return;

    if (list == null)
        return;

    let panel = page.structure.side.querySelector('.skip-to-list');
    panel.innerHTML = '';

    list.forEach((item) => {
        let button = document.createElement('button');
        button.classList.add('skip-to-item');
        button.setAttribute('onclick', `_scroll_to_setting('${item.id}')`);
        button.textContent = item.name;

        if (item.type != null)
            button.setAttribute('data-type', item.type);

        panel.appendChild(button);
    });
}

unsafeWindow._scroll_to_setting = function(id) {
    scroll_to_setting(id);
}

function scroll_to_setting(id) {
    let setting = document.body.querySelector(`#container-${id}`);

    if (setting != null) {
        let y = setting.getBoundingClientRect().top + window.scrollY - 300;
        window.scroll({
            top: y,
            behavior: 'smooth'
        });
    }
}

unsafeWindow._change_settings_page = function(page, setting = null) {
    change_settings_page(page, setting);
}

function change_settings_page(page_id, setting = null) {
    page.structure.main.innerHTML = '';

    if (ff('bleh_settings_tabs')) {
        let btns = document.querySelectorAll('.bleh--nav');
        btns.forEach((btn) => {
            console.log(btn.getAttribute('data-bleh-page'),page_id);
            if (btn.getAttribute('data-bleh-page') != page_id) {
                btn.classList.remove('secondary-nav-item-link--active');
            } else {
                btn.classList.add('secondary-nav-item-link--active');
            }
        });
    } else {
        let btns = document.querySelectorAll('.bleh--btn');
        btns.forEach((btn) => {
            console.log(btn.getAttribute('data-bleh-page'),page_id);
            if (btn.getAttribute('data-bleh-page') != page_id) {
                btn.classList.remove('active');
            } else {
                btn.classList.add('active');
            }
        });
    }

    if (page_id == 'home' || page_id == 'seasonal')
        seasonal_timer_start();
    else
        seasonal_timer_end();

    page.structure.main.innerHTML = render_setting_page(page_id);

    if (page_id == 'themes') {
        show_theme_change_in_settings();
        display_colour_presets();
        refresh_all();
    } else if (page_id == 'customise' || page_id == 'performance' || page_id == 'accessibility' || page_id == 'text' || page_id == 'seasonal' || page_id == 'music' || page_id == 'activities') {
        refresh_all();
    } else if (page_id == 'profiles') {
        init_profile_notes();
        init_profile_page();
        activity_preview();
        refresh_all();
    } else if (page_id == 'sku') {
        bleh_sku_page();
    }

    if (page_id == 'text')
        prepare_language_page();

    if (page_id == 'music') {
        tippy(document.getElementById('container-show_bulk_edit_album'), {
            content: trans_legacy.en.settings.music.show_bulk_edit_album.require
        });
    }

    if ((page_id == 'seasonal' || page_id == 'home') && settings.seasonal && stored_season.id != 'none' && stored_season.start && stored_season.end) {
        tippy(document.getElementById('current_season'), {
            content: new Date(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).toLocaleString(lang)
        });
        tippy(document.getElementById('current_season_start'), {
            content: new Date(stored_season.start.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).toLocaleString(lang)
        });
        tippy(document.getElementById('next_season_start'), {
            content: new Date(stored_season.next_start.replace('y0', (stored_season.next_is_new_year) ? stored_season.year + 1 : stored_season.year).replace('{offset}', stored_season.offset)).toLocaleString(lang)
        });
    }

    if (setting != null) {
        let setting_container = document.body.querySelector(`#container-${setting}`);

        if (setting_container != null) {
            let y = setting_container.getBoundingClientRect().top + window.scrollY - 300;
            window.scroll({
                top: y,
                behavior: 'smooth'
            });
        }
    }
}

export function show_theme_change_in_settings(theme = '') {
    if (theme != '')
        settings.theme = theme;

    let btns = document.querySelectorAll('.theme-item');
    btns.forEach((btn) => {
        console.log(btn.getAttribute('data-bleh-theme'),settings.theme);
        if (btn.getAttribute('data-bleh-theme') != settings.theme) {
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
        }
    });
}
export function show_theme_change_in_menu(theme = '', element = document.body) {
    if (theme != '')
        settings.theme = theme;

    let btns = element.querySelectorAll('.theme-item-in-menu');
    btns.forEach((btn) => {
        console.log(btn.getAttribute('data-bleh-theme'),settings.theme);
        if (btn.getAttribute('data-bleh-theme') != settings.theme) {
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
        }
    });
}


export function load_skus() {
    for (let flag in version.feature_flags) {
        let current_state = version.feature_flags[flag].default;

        if (settings.feature_flags[flag] != null)
            current_state = settings.feature_flags[flag];

        document.documentElement.setAttribute(`data-ff--${flag}`, current_state);
    }
}

function bleh_sku_page() {
    let flags_container = document.getElementById('feature-flags');

    for (let flag in version.feature_flags) {
        let current_state = version.feature_flags[flag].default;

        if (settings.feature_flags[flag] != undefined)
            current_state = settings.feature_flags[flag];

        let feature_flag_element = document.createElement('div');
        feature_flag_element.classList.add('setting');
        feature_flag_element.setAttribute('data-type', 'toggle');
        feature_flag_element.setAttribute('onclick', `_update_flag_toggle('${flag}', this)`);
        feature_flag_element.innerHTML = (`
            <div class="heading">
                <h5>${version.feature_flags[flag].name}</h5>
                ${(version.feature_flags[flag].notice) ? `<p>${version.feature_flags[flag].notice}</p>` : ''}
                <div class="info-row">
                    <div class="new-badge flag-${version.feature_flags[flag].default}">${version.feature_flags[flag].default}</div><p class="date">${version.feature_flags[flag].date}</p><p>${flag}</p>
                </div>
            </div>
            <div class="toggle-wrap">
                <button id="feature-flag-toggle-${flag}" class="toggle" aria-checked="${current_state}">
                    <div class="dot"></div>
                </button>
            </div>
        `);

        flags_container.appendChild(feature_flag_element);

        document.documentElement.setAttribute(`data-ff--${flag}`, current_state);
    }
}

unsafeWindow._update_flag_toggle = function(flag, container) {
    update_flag_toggle(flag, container);
}
function update_flag_toggle(flag, container) {
    let button = container.querySelector('.toggle');
    if (!button)
        return;

    let current_state = version.feature_flags[flag].default;
    if (settings.feature_flags[flag] != undefined) current_state = settings.feature_flags[flag];

    if (current_state == true) {
        button.setAttribute('aria-checked', 'false');
        settings.feature_flags[flag] = false;
        document.documentElement.setAttribute(`data-ff--${flag}`, false);
    } else {
        button.setAttribute('aria-checked', 'true');
        settings.feature_flags[flag] = true;
        document.documentElement.setAttribute(`data-ff--${flag}`, true);
    }

    // save to settings
    localStorage.setItem('bleh', JSON.stringify(settings));
}


export function display_colour_presets() {
    let colours = {
        custom: [
            {
                type: 'default',
                sets: {
                    hue: 255,
                    sat: 1,
                    lit: 1
                },
                displays: {
                    hue: 'var(--hue-seasonal, 255)',
                    sat: 'var(--sat-seasonal, 1)',
                    lit: 'var(--lit-seasonal, 1)'
                }
            },
            {
                type: 'avatar',
                sets: {
                    hue: auth.sets.hue,
                    sat: auth.sets.sat,
                    lit: auth.sets.lit
                },
                requires_flag: 'colour_based_on_avatar'
            },
            {
                type: 'customise'
            }
        ],
        red: [
            {sets: {
                hue: 360,
                sat: 1.4,
                lit: 0.9
            }},
            {sets: {
                hue: 360,
                sat: 1.4,
                lit: 0.95
            }},
            {sets: {
                hue: 360,
                sat: 1.325,
                lit: 1
            }},
            {sets: {
                hue: 360,
                sat: 1.225,
                lit: 1
            }},
            {sets: {
                hue: 360,
                sat: 1.1,
                lit: 1
            }},
            {sets: {
                hue: 360,
                sat: 1.05,
                lit: 1.05
            }}
        ],
        orange: [
            {sets: {
                hue: 10,
                sat: 1.425,
                lit: 0.9
            }},
            {sets: {
                hue: 13,
                sat: 1.4,
                lit: 0.95
            }},
            {sets: {
                hue: 16,
                sat: 1.325,
                lit: 1
            }},
            {sets: {
                hue: 20,
                sat: 1.225,
                lit: 1
            }},
            {sets: {
                hue: 21,
                sat: 1.275,
                lit: 1
            }},
            {sets: {
                hue: 26,
                sat: 1.35,
                lit: 1.05
            }}
        ],
        yellow: [
            {sets: {
                hue: 22,
                sat: 1.3,
                lit: 0.9
            }},
            {sets: {
                hue: 24,
                sat: 1.2,
                lit: 0.95
            }},
            {sets: {
                hue: 27,
                sat: 1.16,
                lit: 1
            }},
            {sets: {
                hue: 32,
                sat: 1.1,
                lit: 1
            }},
            {sets: {
                hue: 36,
                sat: 1,
                lit: 1
            }},
            {sets: {
                hue: 41,
                sat: 1.05,
                lit: 1.05
            }}
        ],
        green: [
            {sets: {
                hue: 85,
                sat: 1.4,
                lit: 0.9
            }},
            {sets: {
                hue: 90,
                sat: 1.3,
                lit: 0.95
            }},
            {sets: {
                hue: 94,
                sat: 1.2,
                lit: 1
            }},
            {sets: {
                hue: 99,
                sat: 1.1,
                lit: 1
            }},
            {sets: {
                hue: 105,
                sat: 1.025,
                lit: 1
            }},
            {sets: {
                hue: 108,
                sat: 1,
                lit: 1.05
            }}
        ],
        lime: [
            {sets: {
                hue: 115,
                sat: 1.15,
                lit: 0.9
            }},
            {sets: {
                hue: 121,
                sat: 1.09,
                lit: 0.95
            }},
            {sets: {
                hue: 127,
                sat: 1.05,
                lit: 1
            }},
            {sets: {
                hue: 135,
                sat: 1.03,
                lit: 1
            }},
            {sets: {
                hue: 141,
                sat: 1,
                lit: 1
            }},
            {sets: {
                hue: 148,
                sat: 1,
                lit: 1.05
            }}
        ],
        aqua: [
            {sets: {
                hue: 212,
                sat: 1.45,
                lit: 0.9
            }},
            {sets: {
                hue: 207,
                sat: 1.375,
                lit: 0.95
            }},
            {sets: {
                hue: 200,
                sat: 1.3,
                lit: 1
            }},
            {sets: {
                hue: 195,
                sat: 1.25,
                lit: 1
            }},
            {sets: {
                hue: 190,
                sat: 1.2,
                lit: 1
            }},
            {sets: {
                hue: 185,
                sat: 1.1,
                lit: 1.05
            }}
        ],
        blue: [
            {sets: {
                hue: 233,
                sat: 1.4,
                lit: 0.9
            }},
            {sets: {
                hue: 230,
                sat: 1.3,
                lit: 0.95
            }},
            {sets: {
                hue: 226,
                sat: 1.25,
                lit: 1
            }},
            {sets: {
                hue: 220,
                sat: 1.2,
                lit: 1
            }},
            {sets: {
                hue: 217,
                sat: 1.15,
                lit: 1
            }},
            {sets: {
                hue: 212,
                sat: 1.025,
                lit: 1.05
            }}
        ],
        purple: [
            {sets: {
                hue: 246,
                sat: 1.32,
                lit: 0.9
            }},
            {sets: {
                hue: 244,
                sat: 1.2,
                lit: 0.95
            }},
            {sets: {
                hue: 246,
                sat: 1.12,
                lit: 1
            }},
            {sets: {
                hue: 249,
                sat: 1.11,
                lit: 1
            }},
            {sets: {
                hue: 253,
                sat: 1.07,
                lit: 1
            }},
            {sets: {
                hue: 256,
                sat: 1.01,
                lit: 1.03
            }}
        ],
        pink: [
            {sets: {
                hue: 346,
                sat: 1.3,
                lit: 0.9
            }},
            {sets: {
                hue: 340,
                sat: 1.225,
                lit: 0.95
            }},
            {sets: {
                hue: 335,
                sat: 1.175,
                lit: 1
            }},
            {sets: {
                hue: 325,
                sat: 1.12,
                lit: 1
            }},
            {sets: {
                hue: 317,
                sat: 1.05,
                lit: 1
            }},
            {sets: {
                hue: 309,
                sat: 1,
                lit: 1.05
            }}
        ]
    }
    let exclusives = {
        christmas: [
            {
                type: 'season',
                name: trans_legacy.en.settings.customise.seasonal.nonsense,
                sets: {
                    hue: 352,
                    sat: 1.8,
                    lit: 0.925
                }
            },
            {
                type: 'season',
                name: trans_legacy.en.settings.customise.seasonal.fruitcake,
                sets: {
                    hue: 24,
                    sat: 0.93,
                    lit: 1
                }
            },
            {
                type: 'season',
                name: trans_legacy.en.settings.customise.seasonal.mistletoe,
                sets: {
                    hue: 130,
                    sat: 0.45,
                    lit: 0.75
                }
            },
            {
                type: 'season',
                name: trans_legacy.en.settings.customise.seasonal.festival,
                sets: {
                    hue: 240,
                    sat: 1.4,
                    lit: 0.875
                }
            }
        ]
    }
    exclusives.new_years = exclusives.christmas;

    for (let type in colours) {
        let swatch_group = document.body.querySelector(`#colour_${type}`);

        if (!swatch_group)
            return;

        if (type != 'custom')
            colours[type].reverse();

        colours[type].forEach((colour) => {
            if (colour.requires_flag && version.feature_flags.hasOwnProperty(colour.requires_flag)) {
                if (!ff(colour.requires_flag))
                    return;
            }

            if (!colour.type)
                colour.type = 'colour';

            if (!colour.displays && colour.sets)
                colour.displays = colour.sets;

            let swatch = document.createElement('button');
            swatch.classList.add('swatch', 'btn');
            swatch.setAttribute('data-swatch-type', colour.type);

            if (type == 'custom')
                swatch.classList.add('view-item', 'colour-btn');

            if (type == 'custom')
                swatch.textContent = tl(trans[colour.type]);

            if (colour.type == 'default' && stored_season.id != 'none') {
                swatch.textContent = tl(trans.seasonal.name);

                if (exclusives.hasOwnProperty(stored_season.id)) {
                    swatch.setAttribute('onclick', '');
                    swatch.classList.add('select-button');

                    tippy(swatch, {
                        theme: 'menu',
                        content: '',
                        allowHTML: true,
                        placement: 'bottom',
                        interactive: true,
                        interactiveBorder: 10,
                        trigger: 'click',

                        onShow(instance) {
                            let content = instance.popper.querySelector('.tippy-content');

                            display_seasonal_exclusives(content, colours, exclusives);
                        }
                    });
                }
            }

            if (colour.type == 'customise') {
                swatch.classList.add('select-button');

                tippy(swatch, {
                    theme: 'window',
                    content: (`
                        <div class="dialog-settings">
                            <div class="alert alert-info seasonal-hsl-alert">
                                ${tl(trans.seasonal_warning)}
                            </div>
                            ${(ff('colour_based_on_hex')) ? (`
                            <div class="setting" data-type="text">
                                <div class="heading">
                                    <h5>${tl(trans.convert_from_hex)}</h5>
                                </div>
                                <div class="input-container content-form">
                                    <input type="color" maxlength="7" id="text-hex" placeholder="#ffffff">
                                    <button class="btn primary icon convert" onclick="_convert_hex()">${tl(trans.convert)}</button>
                                </div>
                            </div>
                            `) : ''}
                            <div class="setting dim-using-hue-gradient dim-during-seasonal" data-type="slider" id="container-hue">
                                <button class="btn reset" onclick="_reset_item('hue')">${tl(trans.reset)}</button>
                                <div class="heading">
                                    <h5>${tl(trans.hue)}</h5>
                                </div>
                                <div class="slider">
                                    <div class="slider-track" id="slider-track-hue"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                                    <input type="range" min="0" max="360" value="${settings.hue}" id="slider-hue" oninput="_update_item('hue', this.value)">
                                    <p id="value-hue">${settings.hue}${settings_base.hue.unit}</p>
                                    <div class="hint">
                                        <p style="left: 0">0</p>
                                        <p style="left: calc((255 / 360) * 100%)">255</p>
                                        <p style="left: 100%">360</p>
                                    </div>
                                </div>
                            </div>
                            <div class="setting dim-using-hue-gradient dim-during-seasonal" data-type="slider" id="container-sat">
                                <button class="btn reset" onclick="_reset_item('sat')">${tl(trans.reset)}</button>
                                <div class="heading">
                                    <h5>${tl(trans.sat)}</h5>
                                </div>
                                <div class="slider">
                                    <div class="slider-track" id="slider-track-sat"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                                    <input type="range" min="0" max="1.5" value="${settings.sat}" step="0.025" id="slider-sat" oninput="_update_item('sat', this.value)">
                                    <p id="value-sat">${settings.sat}${settings_base.sat.unit}</p>
                                    <div class="hint">
                                        <p style="left: 0">0</p>
                                        <p style="left: calc((1 / 1.5) * 100%)">1</p>
                                        <p style="left: 100%">1.5</p>
                                    </div>
                                </div>
                            </div>
                            <div class="setting dim-using-hue-gradient dim-during-seasonal" data-type="slider" id="container-lit">
                                <button class="btn reset" onclick="_reset_item('lit')">${tl(trans.reset)}</button>
                                <div class="heading">
                                    <h5>${tl(trans.lit)}</h5>
                                </div>
                                <div class="slider">
                                    <div class="slider-track" id="slider-track-lit"><div class="slider-fill"></div><div class="slider-nub"></div></div>
                                    <input type="range" min="0" max="1.5" value="${settings.lit}" step="0.025" id="slider-lit" oninput="_update_item('lit', this.value)">
                                    <p id="value-lit">${settings.lit}${settings_base.lit.unit}</p>
                                    <div class="hint">
                                        <p style="left: 0">0</p>
                                        <p style="left: calc((1 / 1.5) * 100%)">1</p>
                                        <p style="left: 100%">1.5</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `),
                    allowHTML: true,
                    placement: 'bottom',
                    interactive: true,
                    interactiveBorder: 10,
                    trigger: 'click',

                    onShow(instance) {
                        refresh_all(instance.popper);
                    }
                });
            }

            if (colour.sets) {
                colour.sets.accent_type = colour.type;

                swatch.setAttribute('onclick', `_update_params(${JSON.stringify(colour.sets)})`);

                swatch.style.setProperty('--hue-over', colour.displays.hue);
                swatch.style.setProperty('--sat-over', colour.displays.sat);
                swatch.style.setProperty('--lit-over', colour.displays.lit);

                tippy(swatch, {
                    theme: 'key_value',
                    content: (`
                        <span class="key">hue<span class="value">${colour.sets.hue}</span></span>
                        <span class="key">sat<span class="value">${colour.sets.sat}</span></span>
                        <span class="key">lit<span class="value">${colour.sets.lit}</span></span>
                    `),
                    allowHTML: true,
                    delay: [250, 0]
                });
            }

            swatch_group.appendChild(swatch);
        });
    }
}

function display_seasonal_exclusives(instance, colours, exclusives) {
    instance.innerHTML = '';

    exclusives[stored_season.id] = [
        {
            type: 'default',
            name: tl(trans.default),
            sets: {
                hue: 255,
                sat: 1,
                lit: 1
            },
            displays: {
                hue: 'var(--hue-seasonal, 255)',
                sat: 'var(--sat-seasonal, 1)',
                lit: 'var(--lit-seasonal, 1)'
            }
        },
        ...exclusives[stored_season.id]
    ];

    exclusives[stored_season.id].forEach((colour) => {
        colour.sets = {accent_type: colour.type, ...colour.sets};
        colour.displays = colour.sets;

        let item = document.createElement('button');
        item.classList.add('dropdown-menu-clickable-item', 'swatch');
        item.setAttribute('data-swatch-type', colour.type);
        item.textContent = colour.name;

        item.setAttribute('onclick', `_update_params(${JSON.stringify(colour.sets)})`);

        item.style.setProperty('--hue-over', colour.displays.hue);
        item.style.setProperty('--sat-over', colour.displays.sat);
        item.style.setProperty('--lit-over', colour.displays.lit);

        if (colour.displays.hue == settings.hue && colour.displays.sat == settings.sat && colour.displays.lit)
            item.setAttribute('aria-checked', 'true');

        instance.appendChild(item);
    });
}


function init_profile_page() {
    let profile_name_obj = document.body.querySelector('.title-container .badges');

    if (ff('badges')) {
        let stock_badges = profile_name_obj.querySelectorAll('.label');
        stock_badges.forEach((badge) => {
            if (badge.classList[1] == 'user-status-None')
                return;

            badge.classList.add('no-hover');

            tippy(badge, {
                theme: 'badge',
                placement: 'bottom',
                content: (`
                    <div class="badge-name">${badge.textContent}</div>
                    <div class="badge-reason">${tl(trans.badges[badge.classList[1]].reason)}</div>
                `),
                allowHTML: true
            });
        });
    }

    let badges = load_badges(auth.name);

    if (badges) {
        badges.forEach((this_badge) => {
            let badge = document.createElement('span');
            badge.classList.add('label', `user-status--bleh-${this_badge.type}`, `user-status--bleh-user-${page.name}`);
            badge.textContent = this_badge.name;
            profile_name_obj.appendChild(badge);

            if (ff('badges')) {
                badge.classList.add('no-hover');

                tippy(badge, {
                    theme: 'badge',
                    placement: 'bottom',
                    content: (`
                        <div class="badge-name">${this_badge.name}</div>
                        <div class="badge-reason">${tl(trans.badges[this_badge.reason].reason)}</div>
                    `),
                    allowHTML: true
                });
            }

            if (this_badge.type == 'sponsor')
                badge.setAttribute('onclick', '_sponsor()');
        });
    } else {
        let badge = document.createElement('span');
        badge.classList.add('label', 'user-status--bleh-missing');
        badge.textContent = tl(trans.badges.missing.name);
        profile_name_obj.appendChild(badge);

        if (ff('badges')) {
            badge.classList.add('no-hover');

            tippy(badge, {
                theme: 'badge',
                placement: 'bottom',
                content: (`
                    <div class="badge-name">${tl(trans.badges.missing.name)}</div>
                    <div class="badge-reason">${tl(trans.badges.missing.reason)}</div>
                `),
                allowHTML: true
            });
        }
    }
}

function init_profile_notes() {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};
    let profile_notes_table = page.structure.main.querySelector('.profile-notes');

    if (Object.keys(profile_notes).length == 0)
        return;

    profile_notes_table.classList = 'generic-table-list user-vertical-list take-space profile-notes';
    profile_notes_table.innerHTML = '';

    for (let user in profile_notes) {
        let profile_note = document.createElement('div');
        profile_note.classList.add('generic-table-list-entry', 'user-vertical-list-item');
        profile_note.setAttribute('id',`profile-note-row--${user}`);
        profile_note.innerHTML = (`
        <div class="name">
            <a class="mention" href="${root}user/${user}">@${user}</a>
        </div>
        <div class="text preview">
            <p id="profile-note-row-preview--${user}">${profile_notes[user]}</p>
        </div>
        <div class="actions">
            <button class="icon chibi edit" onclick="_edit_profile_note('${user}')">
                ${tl(trans.delete)}
            </button>
            <button class="delete icon delete-user-button danger-subtle" onclick="_delete_profile_note('${user}')">
                ${tl(trans.delete)}
            </button>
        </div>
        `);

        profile_notes_table.appendChild(profile_note);
    }
}

unsafeWindow._delete_profile_note = function(username) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};
    delete profile_notes[username];
    document.getElementById(`profile-note-row--${username}`).style.setProperty('display','none');

    localStorage.setItem('bleh_profile_notes',JSON.stringify(profile_notes));
}

unsafeWindow._edit_profile_note = function(username) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};

    dialog_legacy('edit_profile_note',trans_legacy.en.settings.profiles.notes.edit_user.replace('{u}', username),`
    <textarea id="bleh--profile-note" placeholder="Enter a local note for this user">${profile_notes[username]}</textarea>
    <div class="modal-footer">
        <button class="see-more cancel" onclick="_kill_window('edit_profile_note')">
            ${tl(trans.cancel)}
        </button>
        <div class="fill"></div>
        <button class="btn primary save" onclick="_save_profile_note_in_window('${username}')">
            ${tl(trans.save)}
        </button>
    </div>
    `, true);

    profile_notes[username] = document.getElementById('bleh--profile-note').value;

    localStorage.setItem('bleh_profile_notes',JSON.stringify(profile_notes));
}

unsafeWindow._save_profile_note_in_window = function(username) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};
    let value_to_save = document.getElementById('bleh--profile-note').value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    profile_notes[username] = value_to_save;

    document.getElementById(`profile-note-row-preview--${username}`).textContent = value_to_save;

    localStorage.setItem('bleh_profile_notes',JSON.stringify(profile_notes));
    kill_window('edit_profile_note');
}




export function prepare_corrections_page() {
    let corrections_table_artist = document.getElementById('corrections-artist');

    for (let artist in artist_corrections) {
        if (artist == 'version')
            continue;

        let correction = document.createElement('div');
        correction.classList.add('correction-row');
        correction.innerHTML = (`
        <div class="primary-name pre-transition">
            <h5>${artist}</h5>
        </div>
        <div class="arrow-divider"></div>
        <div class="primary-name post-transition">
            <h5>${artist_corrections[artist]}</h5>
        </div>
        `);

        corrections_table_artist.appendChild(correction);
    }

    //

    let corrections_table_albums_tracks = document.getElementById('corrections-albums_tracks');

    for (let artist in album_track_corrections) {
        if (artist == 'version')
            continue;

        let artist_row = document.createElement('div');
        artist_row.classList.add('artist-row');
        artist_row.innerHTML = (`
            <h5>${artist}</h5>
        `);

        corrections_table_albums_tracks.appendChild(artist_row);

        for (let media in album_track_corrections[artist]) {
            let correction = document.createElement('div');
            correction.classList.add('correction-row');
            correction.innerHTML = (`
            <div class="primary-name pre-transition">
                <h5>${media}</h5>
            </div>
            <div class="arrow-divider"></div>
            <div class="primary-name post-transition">
                <h5>${album_track_corrections[artist][media]}</h5>
            </div>
            `);

            corrections_table_albums_tracks.appendChild(correction);
        }
    }
}


function prepare_language_page() {
    let languages_table = document.getElementById('languages');

    for (let language in lang_info) {
        let lang_row = document.createElement('div');
        lang_row.classList.add('language-row');

        if (lang == language)
            lang_row.classList.add('active');

        let users = '';
        for (let user in lang_info[language].by)
            users = `${users}<a class="mention" href="${root}user/${lang_info[language].by[user]}" target="_blank">@${lang_info[language].by[user]}</a> `;

        lang_row.innerHTML = (`
        <div class="flag-container">
            <img src="https://katelyynn.github.io/bleh/fm/flags/${language}.svg" alt="flag for ${language}">
        </div>
        <div class="name">
            <h5>${lang_info[language].name}</h5>
            <p>${trans_legacy.en.settings.language.by.replace('{users}', users)}</p>
        </div>
        ${(lang_info[language].new ? (`
        <div class="badges">
            <div class="new-badge">${tl(trans.new)}</div>
        </div>
        `): '<div class="badges"></div>')}
        <div class="date">
            <p>${(lang_info[language].last_updated != 'latest') ? moment(lang_info[language].last_updated).fromNow() : lang_info[language].last_updated}</p>
        </div>
        `);

        if (lang_info[language].last_updated != 'latest') {
            tippy(lang_row.querySelector('.date'), {
                content: lang_info[language].last_updated
            });
        }

        languages_table.appendChild(lang_row);
    }
}


unsafeWindow._import_settings = function() {
    dialog({
        id: 'import_settings',
        title: tl(trans.import_settings),
        body: (`
            <p class="big-modal-alert alert-danger">${tl(trans.import_notice)}</p>
            <br>
            <textarea class="modal-text" id="import_area"></textarea>
            <div class="modal-footer">
                <button class="see-more cancel" onclick="_dialog_rm({id: 'import_settings'})">
                    ${tl(trans.cancel)}
                </button>
                <div class="fill"></div>
                <button class="btn primary download" onclick="_confirm_import()">
                    ${tl(trans.import)}
                </button>
            </div>
        `)
    });
}

unsafeWindow._confirm_import = function() {
    //localStorage.setItem('old_settings', localStorage.getItem('bleh'));

    let requesting_setting = document.getElementById('import_area').value;
    try {
        let try_parse = JSON.parse(requesting_setting);

        // can continue
        localStorage.setItem('bleh', requesting_setting);
        load_settings();

        dialog_rm({
            id: 'import_settings'
        });
    } catch(e) {
        // cannot continue, halt
        dialog({
            id: 'import_failed',
            title: trans_legacy.en.settings.actions.import.modals.failed.name,
            body: (`
                <p class="big-modal-alert alert-error">${trans_legacy.en.settings.actions.import.modals.failed.alert}</p>
                <div class="modal-footer">
                    <div class="fill"></div>
                    <button class="btn primary done" onclick="_dialog_rm({id: 'import_failed'})">
                        ${tl(trans.done)}
                    </button>
                </div>
            `)
        });
    }
}


// export settings
function export_settings() {
    dialog({
        id: 'export_settings',
        title: tl(trans.export_settings),
        body: (`
            <textarea class="modal-text">${JSON.stringify(settings)}</textarea>
            <div class="modal-footer">
                <div class="fill"></div>
                <button class="btn primary done" onclick="_dialog_rm({id: 'export_settings'})">
                    ${tl(trans.done)}
                </button>
            </div>
        `)
    });
}
unsafeWindow._export_settings = function() {
    export_settings();
}


// reset settings
unsafeWindow._reset_settings = function() {
    dialog({
        id: 'reset_settings',
        title: tl(trans.reset_settings),
        body: (`
            <div class="big-modal-alert alert-error">
                <strong>${tl(trans.reset_notice)}</strong>
                <a class="see-more" onclick="_export_settings()">${tl(trans.make_a_backup)}</a>
            </div>
            <div class="modal-footer">
                <button class="see-more cancel" onclick="_dialog_rm({id: 'reset_settings'})">
                    ${tl(trans.cancel)}
                </button>
                <div class="fill"></div>
                <button class="btn primary icon" data-type="reset" onclick="_confirm_reset()">
                    ${tl(trans.reset)}
                </button>
            </div>
        `)
    });
}

unsafeWindow._confirm_reset = function() {
    for (var member in settings) delete settings[member];
    Object.assign(settings, create_settings_template());
    load_settings(true);

    dialog_rm({
        id: 'reset_settings'
    });
}

unsafeWindow._save_font = function() {
    let font = document.getElementById('text-font').value;

    document.body.style.setProperty(`--${settings_base.font.css}`, font);
    document.documentElement.setAttribute(`data-bleh--font`, font);

    // save to settings
    settings.font = font;
    localStorage.setItem('bleh', JSON.stringify(settings));
}

unsafeWindow._save_branch = function() {
    let branch = document.getElementById('text-branch').value;

    // save to settings
    settings.branch = branch;
    localStorage.setItem('bleh', JSON.stringify(settings));
}

unsafeWindow._convert_hex = function() {
    let value = page.structure.main.querySelector('#text-hex').value;
    let hsl = hex_to_hsl(value);

    update_params({
        hue: hsl.h,
        sat: clamp_sat((hsl.s / 100) * 3),
        lit: (hsl.l / 100) + 0.35
    });
}

function activity_preview() {
    let preview = page.structure.main.querySelector('.activity-preview');

    let random_types = [
        'love', 'love', 'love',
        'unlove',
        'bookmark',
        'unbookmark',
        'obsess',
        'image_upload',
        'shout', 'shout',
        'wiki'
    ];
    let random_involved = [
        {
            name: 'Espresso',
            type: 'track',
            sister: 'Sabrina Carpenter'
        },
        {
            name: 'Busy Woman',
            type: 'track',
            sister: 'Sabrina Carpenter'
        },
        {
            name: 'I might say something stupid',
            type: 'track',
            sister: 'Charli xcx'
        },
        {
            name: 'Seigfried',
            type: 'track',
            sister: 'Frank Ocean'
        },
        {
            name: 'OLYMPIAN',
            type: 'track',
            sister: 'Playboi Carti'
        },
        {
            name: 'GODSTAINED',
            type: 'track',
            sister: 'Quadeca'
        },
        {
            name: 'hypochondriac',
            type: 'album',
            sister: 'brakence'
        },
        {
            name: 'my anti-aircraft friend',
            type: 'album',
            sister: 'julie'
        },
        {
            name: 'In Utero',
            type: 'album',
            sister: 'Nirvana'
        },
        {
            name: 'channel ORANGE',
            type: 'album',
            sister: 'Frank Ocean'
        },
        {
            name: 'Future',
            type: 'artist'
        },
        {
            name: 'Billie Eilish',
            type: 'artist'
        },
        {
            name: 'Swirlies',
            type: 'artist'
        },
        {
            name: 'Lucy Bedroque',
            type: 'artist'
        },
        {
            name: 'underscores',
            type: 'artist'
        },
        {
            name: 'Bladee',
            type: 'artist'
        },
        {
            name: 'Charli xcx',
            type: 'artist'
        },
        {
            name: 'Dawn FM',
            type: 'album',
            sister: 'The Weeknd'
        },
        {
            name: 'Random Access Memories',
            type: 'album',
            sister: 'Daft Punk'
        },
        {
            name: 'how i\'m feeling now',
            type: 'album',
            sister: 'Charli xcx'
        },
        {
            name: 'Revengeseekerz',
            type: 'album',
            sister: 'Jane Remover'
        },
        {
            name: 'Around The Fur',
            type: 'album',
            sister: 'Deftones'
        },
        {
            name: 'Exmilitary',
            type: 'album',
            sister: 'Death Grips'
        },
        {
            name: 'OFFLINE!',
            type: 'album',
            sister: 'JPEGMAFIA'
        },
        {
            name: 'TRUST! - OFFLINE',
            type: 'track',
            sister: 'JPEGMAFIA'
        },
        {
            name: 'Hotline Bling',
            type: 'track',
            sister: 'Drake'
        },
        {
            name: 'All Eyez On Me',
            type: 'track',
            sister: '2Pac'
        },
        {
            name: 'DOGTOOTH',
            type: 'track',
            sister: 'Tyler, The Creator'
        },
        {
            name: 'so american',
            type: 'track',
            sister: 'Olivia Rodrigo'
        },
        {
            name: 'I KNOW ?',
            type: 'track',
            sister: 'Travis Scott'
        },
        {
            name: 'Apple Pie',
            type: 'track',
            sister: 'Travis Scott'
        },
        {
            name: '34+35',
            type: 'track',
            sister: 'Ariana Grande'
        },
        {
            name: 'New Again',
            type: 'track',
            sister: 'Kanye West'
        },
        {
            name: 'Radio Friendly Unit Shifter',
            type: 'track',
            sister: 'Nirvana'
        },
        {
            name: 'Empty Out Your Pockets',
            type: 'track',
            sister: 'Juice WRLD'
        },
        {
            name: 'Party By Myself',
            type: 'track',
            sister: 'Juice WRLD'
        },
        {
            name: 'Death Race For Love',
            type: 'album',
            sister: 'Juice WRLD'
        },
        {
            name: 'Timeless',
            type: 'track',
            sister: 'The Weeknd'
        },
        {
            name: 'SKITZO',
            type: 'track',
            sister: 'The Weeknd'
        },
        {
            name: 'OPM BABI',
            type: 'track',
            sister: 'Playboi Carti'
        }
    ]

    make_random_activity(preview, random_types, random_involved);
    make_random_activity(preview, random_types, random_involved);
    make_random_activity(preview, random_types, random_involved);

    let timer = setInterval(function() {
        if (!preview) {
            clearInterval(timer);
            return;
        }

        make_random_activity(preview, random_types, random_involved);
    }, 2300);
}

function make_random_activity(preview, random_types, random_involved) {
    activity_preview_new(preview, {
        type: random_types[Math.floor(Math.random() * random_types.length)],
        date: new Date(),
        involved: [
            random_involved[Math.floor(Math.random() * random_involved.length)]
        ]
    });
}

function activity_preview_new(parent, activity) {
    let activity_item = document.createElement('a');
    activity_item.classList.add('activity-item', `activity--${activity.type}`);

    let involved_text = '';

    activity.involved.forEach((involved) => {
        let name = involved.name;
        let sister = involved.sister;

        if (involved.type == 'track' && settings.format_guest_features) {
            let formatted_title = name_includes(name, sister);

            let song_title;
            let song_tags;
            if (formatted_title) {
                song_title = formatted_title[0];
                song_tags = formatted_title[1];
                sister = formatted_title[2];
            }

            // parse tags into text
            let song_tags_text = '';
            for (let song_tag in song_tags) {
                song_tags_text = `${song_tags_text}<div class="feat" data-bleh--tag-type="${song_tags[song_tag].type}" data-bleh--tag-group="${song_tags[song_tag].group}">${sanitise_text(song_tags[song_tag].text)}</div>`;
            }

            // combine
            name = `<div class="title">${sanitise_text(song_title).trim()}</div>${song_tags_text}`;
        } else if ((involved.type == 'album' || involved.type == 'track') && settings.corrections) {
            name = correct_item_by_artist(name, sister);
            sister = correct_artist(sister);
        }  else if (involved.type == 'artist' && settings.corrections) {
            sister = correct_artist(sister);
        }

        if (involved_text != '')
            involved_text = `${involved_text}, <a class="involved--${involved.type}">${name}</a>`;
        else
            involved_text = `${involved_text}<a class="involved--${involved.type}">${name}</a>`;
    });

    activity_item.innerHTML = (`
        <div class="type">${tl(trans.activity.listing[activity.type])}<div class="date">${moment(activity.date).fromNow(true)}</div></div>
        <div class="name">${involved_text}</div>
    `);

    parent.insertBefore(activity_item, parent.firstElementChild);

    if (parent.childElementCount > 3)
        parent.removeChild(parent.lastElementChild);
}