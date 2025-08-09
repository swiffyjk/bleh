//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {settings, settings_base} from "../build/config";
import {album_track_corrections, artist_corrections} from "../build/music";
import {api_key, auth, page, root, theme_preview} from "../build/page";
import {stored_season} from "../build/seasonal";
import {sponsor_list} from "../build/sponsor";
import {clamp_sat, download_with_progress, hex_to_hsl} from '../build/tools';
import {lang, lang_info, tl, trans, trans_legacy} from "../build/trans";
import {load_badges} from '../components/badge';
import {dialog, dialog_rm} from "../components/dialog";
import {correct_artist, correct_item_by_artist, name_includes} from '../components/lotus';
import {markdown} from '../components/markdown';
import {notify} from "../components/notify";
import {create_settings_template, load_settings, refresh_all, update_params} from "../config";
import {version} from "../main";
import {update_page} from "../page";
import {seasonal_timer_end, seasonal_timer_start} from "../seasonal";
import {ff} from "../sku";
import {html, render} from "lighterhtml"
import {save_setting, setting} from "../components/settings.js";
import {parse_scrobbles_as_rank} from "../components/colourful_counts.js";
import {input} from "../components/input.js";
import {share} from "../components/share.js";
import {start_update, update_check} from "../style.js";
import tippy from "tippy.js";
import moment from "moment";

export function bleh_settings() {
    page.name = auth.name;
    page.subpage = '';

    page.state.settings_page = '';

    update_page();

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);

    let params = new URLSearchParams(document.location.search);
    page.requested.tab = params.get('tab');
    page.requested.setting = params.get('setting');

    let path = window.location.pathname.split('/');
    let tab = path[path.length - 1];

    if (tab == 'bleh') tab = null;

    if (page.requested.tab && !tab) tab = page.requested.tab;

    const update_required = localStorage.getItem('bleh_update_required') || 'false';

    const tabs = {
        themes: {
            name: tl(trans.visual)
        },
        music: {
            name: tl(trans.music)
        },
        customise: {
            name: tl(trans.layout)
        },
        profiles: {
            name: tl(trans.profiles)
        },
        seasonal: {
            name: tl(trans.seasonal.name)
        },
        text: {
            name: tl(trans.text)
        },
        accessibility: {
            name: tl(trans.accessibility)
        },
        rabbit: {
            name: tl(trans.quick_switcher),
            icon: 'cmd'
        },
        fill: {
            type: 'fill'
        },
        update: {
            name: tl(trans.updates),
            icon: 'update',
            label: html.node`
                ${tl(trans.updates)}${update_required === 'true' ? html.node`<div class="new-badge">${tl(trans.new)}</div>` : ''}
            `,
            hide_if: !ff('update_center')
        },
        performance: {
            name: tl(trans.troubleshooting)
        },
        sku: {
            name: tl(trans.flags),
            password: settings.hu_tao
        }
    }


    // go wild
    let nav = html.node`
        <div class="toolbar">
            <nav class="navlist secondary-nav navlist--more redesigned-navigation bleh-settings-navigation">
                <ul class="navlist-items">
                    ${Object.entries(tabs).map(([id, tab]) => {
                        if (tab.hide_if) return;

                        if (tab.type && tab.type == 'fill') {
                            return html.node`
                                <div class="fill" />
                            `;
                        }

                        return html.node`
                            <li class="navlist-item secondary-nav-item">
                                <a class="secondary-nav-item-link bleh--nav" data-bleh-page=${id} data-type=${tab.icon} data-password=${tab.password} onclick=${() => change_settings_page(id)}>
                                    ${tab.label ? tab.label : tab.name}
                                </a>
                            </li>
                        `;
                    })}
                </ul>
            </nav>
        </div>
    `;


    render(page.structure.side, html`
        <div class="cta first priority sponsor colourful">
            ${(auth.sponsor) ? html.node`
            <strong>${tl(trans.you_are_a_sponsor)}</strong>
            <a class="see-more" onclick="_sponsor_manage()">${tl(trans.manage_sponsor)}</a>
            ` : html.node`
            <strong>${tl(trans.news_sponsor_cta)}</strong>
            <a class="see-more" onclick="_sponsor()">${tl(trans.sponsor)}</a>
            `}
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
            ${(ff('skip_to_setting')) ? html.node`
            <h4>${tl(trans.skip_to)}</h4>
            <div class="skip-to-list"></div>
            ` : ''}
        </div>
        <div class="bleh--panel">
            <h4>${tl(trans.about)}</h4>
            <p>${version.brand} ${version.build}.${version.sku}</p>
        </div>
    `);


    if (!ff('short'))
        page.structure.container.insertBefore(nav, page.structure.row);
    else
        page.structure.row.insertBefore(nav, page.structure.content);

    if (!tab)
        change_settings_page('themes');
    else
        change_settings_page(tab);

    if (page.requested.setting) {
        scroll_to_setting(page.requested.setting);
    }
}

function page_loading() {
    render(page.structure.main, html`
        <div class="bleh--panel">
            <div class="loading-data-container">
                <div class="loading-data-text">${tl(trans.loading)}</div>
            </div>
        </div>
    `);
}

export function render_setting_page(page_id) {
    if (page_id == 'themes') {
        if (auth.sets.hue == 255 && auth.sets.sat == 1 && auth.sets.lit == 1) {
            setTimeout(() => {
                render_setting_page('themes');
            }, 10);
            page_loading();
            return;
        }

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

        render(page.structure.main, html`
            <div class="bleh--panel">
                <h4>${tl(trans.appearance)}</h4>
                <div class="setting-group">
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.themes.name)}</h5>
                        </div>
                        <div class="info">
                            ${theme_bubbles}
                        </div>
                    </div>
                    ${ff('high_contrast') ? setting({id: 'high_contrast'}) : ''}
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.hue)}</h5>
                        </div>
                        <div class="info swatch-info">
                            <div id="colour_custom" class="swatch-group palette"></div>
                            <div class="sep swatch-sep" />
                            <div id="colour_palette" class="swatch-group palette"></div>
                        </div>
                    </div>
                    ${setting({id: 'hue_from_album'})}
                    ${setting({id: 'colourful_tracks'})}
                    ${ff('card_saturation') ? setting({id: 'sat_bg'}) : ''}
                </div>
                <h4>${tl(trans.fonts)}</h4>
                <div class="setting-group">
                    ${setting({id: 'font'})}
                    ${setting({id: 'font_weight'})}
                    ${setting({id: 'font_weight_medium'})}
                    ${setting({id: 'font_weight_bold'})}
                    ${setting({id: 'font_emoji'})}
                </div>
            </div>
            `);

        show_theme_change_in_settings();
        display_colour_presets();
        refresh_all();
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

        const banners = JSON.parse(localStorage.getItem('bleh_profile_banners')) || {};
        let banner = '';
        if (banners[page.name] && banners[page.name] != 'none') {
            banner = banners[page.name];
        }

        render(page.structure.main, html`
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
                        <div class="profile-mockup-background from-avatar" style="background-image: url(${auth.avatar.replace('/avatar42s/', '/avatar300s/')})"></div>
                        ${banner != '' ? html.node`
                        <div class="profile-mockup-background from-track" style="background-image: url(${banner})"></div>
                        ` : html.node`
                        <div class="profile-mockup-background from-track" style="background-image: url(https://lastfm.freetls.fastly.net/i/u/avatar300s/df927f4f88034b7f9a651636b965c9d7)"></div>
                        `}
                    </div>
                </div>
                <div class="setting-group">
                    <div class="setting" data-type="options">
                        <div class="heading">
                            <h5>${tl(trans.view_backgrounds_on)}</h5>
                        </div>
                        <div class="primary-selections">
                            ${setting({id: 'profile_header_own', standalone: true})}
                            ${setting({id: 'profile_header_others', standalone: true})}
                        </div>
                    </div>
                    ${setting({id: 'profile_avi_background'})}
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.profile_banner.name)}</h5>
                            <p>${tl(trans.profile_banner.body)}</p>
                            <p>${tl(trans.current_banner_value).replace('{v}', banner)}</p>
                        </div>
                        ${() => {
                            if (banner == '')
                                return html.node`
                                    <div class="info">
                                        <p>${tl(trans.none)}</p>
                                    </div>
                                `;

                            let banner_image = html.node`
                                <div class="banner-image" style="background-image: url(${banner})" />
                            `;

                            tippy(banner_image, {
                                content: banner
                            });

                            return banner_image;
                        }}
                    </div>
                </div>
                <div class="setting-group">
                    ${setting({id: 'show_your_progress'})}
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
            <div class="bleh--panel">
                <h4>something</h4>
                <div class="setting-group">
                    ${setting({id: 'branding_type'})}
                </div>
            </div>
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
                        <div class="profile-mockup-background" style="background-image: url(https://lastfm.freetls.fastly.net/i/u/avatar300s/383d6c03304e720075d0050e8a6a4644);"></div>
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
                <div class="setting-group">
                    ${setting({id: 'gendered_tags'})}
                </div>
            </div>
            `);
    } else if (page_id == 'seasonal') {
        register_skip_to([]);

        render(page.structure.main, html`
            <div class="bleh--panel">
                <div class="seasonal-inner">
                    <div class="sub-text">${tl(trans.seasonal_timeline)}</div>
                    <h4>${moment(stored_season.now).format('MMMM Do YYYY')}</h4>
                </div>
                <div class="setting-group">
                    ${setting({id: 'seasonal'})}
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.current_season)}</h5>
                        </div>
                        <div class="info">
                            <div class="icon-combo" data-season=${stored_season.id}>
                                <div class="bleh-icon bleh-seasonal-icon"></div>
                                <p>${tl(trans.seasonal.listing[stored_season.id])}</p>
                            </div>
                        </div>
                    </div>
                    ${(stored_season.id != 'none' && stored_season.start && stored_season.end) ? html.node`
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.started)}</h5>
                        </div>
                        <div class="info">
                            <p id="current_season_start">${moment(stored_season.start.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).from(stored_season.now)}</p>
                        </div>
                    </div>
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.ends_in)}</h5>
                        </div>
                        <div class="info">
                            <p id="current_season">${moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}</p>
                        </div>
                    </div>
                    ` : (settings.seasonal) ? html.node`
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.next_in)}</h5>
                        </div>
                        <div class="info">
                            <p id="next_season_start">${moment(stored_season.next_start.replace('y0', (stored_season.next_is_new_year) ? stored_season.year + 1 : stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true)}</p>
                        </div>
                    </div>
                    ` : ''}
                    ${(settings.seasonal) ? html.node`
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.calculated_offset)}</h5>
                        </div>
                        <div class="info">
                            <p>${stored_season.offset}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <h4>${tl(trans.settings)}</h4>
                <div class="setting-group">
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
            </div>
        `);
    } else if (page_id == 'performance') {
        register_skip_to([]);

        render(page.structure.main, html`
            <div class="bleh--panel">
                <div class="alert alert-danger">${tl(trans.beware_notice)}</div>
                <div class="setting-group">
                    ${setting({id: 'branch'})}
                    ${setting({id: 'dev'})}
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>Refresh theme</h5>
                            <p>Force download the latest version of the stylesheet</p>
                        </div>
                        <div class="toggle-wrap">
                            <button class="bleh--btn primary" onclick="_force_refresh_theme()">Refresh</button>
                        </div>
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
                <button class="continue" onclick=${() => notify({
                id: 'test',
                title: 'testing!',
                body: 'haaaiaiii test bodyyy.......'
                })}>Deliver notification</button>
                <button class="continue" onclick=${() => notify({
                id: 'test',
                title: 'testing!',
                body: 'haaaiaiii test bodyyy.......',
                persist: true
                })}>Deliver persistent notification</button>
                <button class="continue" onclick=${() => {
                    let notification = notify({
                        id: 'async',
                        title: 'progress',
                        body: 'downloading...',
                        progress: true
                    });

                    download_with_progress(`https://lastfm.freetls.fastly.net/i/u/ar0/6644c67eaa3669676252d3190f9b019f.jpg?a=${Math.random()}`, (percent) => {
                        notification.set_body(`downloading... ${percent}%`);
                        notification.set(percent);
                    }).then(async (blob) => {
                        const text = await blob.text();

                        notification.set_body('download complete');
                        notification.set(100);

                        console.info(text);
                    });
                }}>Deliver async progress notification</button>
                <div class="sep"></div>
                <h4>${tl(trans.development)}</h4>
                <button class="see-more" onclick=${() => {
                    if (settings.hu_tao == 'develop') {
                        change_settings_page('sku');
                    } else {
                        dialog({
                            id: 'hu_tao',
                            title: tl(trans.development),
                            body: html.node`
                                ${setting({id: 'hu_tao', text: false, focus: true})}
                            `
                        });
                    }
                }}>${tl(trans.manage_feature_flags)}</button>
            </div>
        `);
    } else if (page_id == 'profiles') {
        if (auth.pro === null || !page.state.quick_access_items) {
            setTimeout(() => {
                render_setting_page('profiles');
            }, 10);
            page_loading();
            return;
        }

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

        const auth_key = localStorage.getItem('bleh_auth');
        const auth_valid = localStorage.getItem('bleh_auth_valid');

        let badge_count = 0;

        let badges = load_badges(auth.name);
        if (badges) badge_count = badges.length;
        if (auth.pro) badge_count++;

        render(page.structure.main, html`
            <div class="bleh--panel sponsor-badge-panel" data-sponsoring="${auth.sponsor}">
                <h4>${tl(trans.profile)}</h4>
                <div class="setting-group">
                    <div class="setting" data-type="info">
                        <div class="avatar-container">
                            <div class="avatar-inner">
                                <img src=${auth.avatar} alt=${auth.name} />
                            </div>
                        </div>
                        <div class="heading">
                            <h5>${auth.name}</h5>
                        </div>
                        <div class="info">
                            <p>${tl(trans.profile_and_badges).replace('{c}', badge_count.toString())}</p>
                            ${badge_count > 0 ? html.node`
                            <button class="see-more" onclick=${() => {
                                dialog({
                                    id: 'badges',
                                    title: auth.name,
                                    body: html.node`
                                        <div class="generic-table-list badge-list">
                                            ${(badges) ? badges.map(badge => {
                                                let style;
                                                let classname = '';
                                                if (badge.icon && badge.hue && badge.sat && badge.lit) {
                                                    style = `--mask: url(${badge.icon}); --hue: ${badge.hue}; --sat: ${badge.sat}; --lit: ${badge.lit}`;
                                                } else {
                                                    classname = `user-status--bleh-${badge.type} user-status--bleh-user-${auth.name}`;
                                                }

                                                return html.node`
                                                    <div class="generic-table-list-entry badge-list-entry">
                                                        <div class="icon-container colourful ${classname}" style=${style}>
                                                            <div class="bleh-icon" style="--icon: var(--mask)" />
                                                        </div>
                                                        <div class="name colourful ${classname}" style=${style}>
                                                            ${badge.name}
                                                        </div>
                                                        <div class="text">
                                                            ${badge.reason}
                                                        </div>
                                                    </div>
                                                `;
                                            }) : ''}
                                            ${auth.pro ? html.node`
                                                <div class="generic-table-list-entry badge-list-entry">
                                                    <div class="icon-container colourful user-status-subscriber">
                                                        <div class="bleh-icon" style="--icon: var(--mask)" />
                                                    </div>
                                                    <div class="name colourful user-status-subscriber">
                                                        ${tl(trans.badges['user-status-subscriber'].name)}
                                                    </div>
                                                    <div class="text">
                                                        ${tl(trans.badges['user-status-subscriber'].reason)}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `
                                });
                            }}>${tl(trans.view)}</button>
                            ` : ''}
                        </div>
                    </div>
                    ${auth.sponsor ? html.node`
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.you_are_a_sponsor)}</h5>
                            <p>${tl(trans.sponsor_get_badge)}</p>
                        </div>
                        <div class="toggle-wrap">
                            <button class="btn primary icon sponsor" data-type="sponsor" onclick="_sponsor_manage()">
                                ${tl(trans.manage_sponsor)}
                            </button>
                        </div>
                    </div>
                    ` : html.node`
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.news_sponsor_cta)}</h5>
                            <p>${tl(trans.api.body)}</p>
                        </div>
                        <div class="toggle-wrap">
                            <button class="btn primary icon sponsor" data-type="sponsor" onclick="_sponsor()">
                                ${tl(trans.sponsor)}
                            </button>
                        </div>
                    </div>
                    `}
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.current_version)}</h5>
                        </div>
                        <div class="info">
                            <button class="see-more update-check sponsor-related" onclick="_sponsor_check()">
                                ${tl(trans.update_check)}
                            </button>
                            <p>${sponsor_list.latest}</p>
                        </div>
                    </div>
                </div>
                <div class="setting-group">
                    ${setting({id: 'navigation_items', list: page.state.quick_access_items})}
                    ${setting({id: 'navigation_language'})}
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.api.short)}</h4>
                <div class="setting-group">
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.api.name)}</h5>
                            <p>${tl(trans.api.body)}</p>
                        </div>
                        <div class="toggle-wrap">
                            <a class="btn primary icon connect" href="${root}api/auth?api_key=${api_key}&cb=${root}bleh/api">
                                ${tl(trans.connect)}
                            </a>
                        </div>
                    </div>
                    <div class="setting" data-type="info">
                        <div class="heading">
                            <h5>${tl(trans.api_status)}</h5>
                        </div>
                        <div class="info">
                            ${auth_key && auth_valid === 'true' ? html.node`
                            <p>${tl(trans.connected)}</p>
                            ` : html.node`
                            <p>${tl(trans.not_connected)}</p>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.other)}</h4>
                <div class="setting-group">
                    ${setting({id: 'profile_shortcut'})}
                    ${setting({id: 'avatar_radius'})}
                    ${setting({id: 'bio_markdown'})}
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.notes)}</h4>
                <div class="setting-group">
                    <div class="profile-notes">
                        <div class="loading-data-container">
                            <div class="loading-data-text failed">${tl(trans.no_notes)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.activity)}</h4>
                <p>${tl(trans.what_are_activities)}</p>
                <div class="inner-preview pad">
                    <div class="preview-card activity-preview" />
                </div>
                <div class="setting-group">
                    ${setting({id: 'activities'})}
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.clear_history)}</h5>
                        </div>
                        <div class="toggle-wrap">
                            <button class="see-more" onclick=${() => {
                                localStorage.removeItem('bwaa_recent_activity');
                                notify({
                                    id: 'cleared_history',
                                    title: tl(trans.cleared_activity_history),
                                    type: 'success'
                                });
                            }}>
                                ${tl(trans.clear)}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="setting-group">
                    ${setting({id: 'activity_shout'})}
                    ${setting({id: 'activity_image'})}
                    ${setting({id: 'activity_obsess'})}
                    ${setting({id: 'activity_love'})}
                    ${setting({id: 'activity_bookmark'})}
                    ${setting({id: 'activity_wiki'})}
                    ${setting({id: 'activity_install'})}
                </div>
            </div>
            `);
    } else if (page_id == 'accessibility') {
        register_skip_to([]);

        render(page.structure.main, html`
            <div class="bleh--panel">
                <h4 class="top-header">${tl(trans.accessibility)}</h4>
                <div class="setting-group">
                    ${setting({id: 'reduced_motion'})}
                    ${setting({id: 'underline_links'})}
                </div>
            </div>
            `);
    } else if (page_id == 'rabbit') {
        register_skip_to([]);

        render(page.structure.main, html`
            <div class="bleh--panel">
                <h4>${tl(trans.quick_switcher)}</h4>
                <div class="setting-group">
                    ${setting({id: 'rabbit'})}
                    ${setting({id: 'rabbit_search'})}
                    ${setting({id: 'rabbit_profile'})}
                    ${setting({id: 'rabbit_shortcut'})}
                    ${setting({id: 'rabbit_bleh_settings'})}
                </div>
            </div>
            `);
    } else if (page_id == 'text') {
        register_skip_to([]);

        render(page.structure.main, html`
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
                <div class="setting-group">
                    ${setting({id: 'shout_markdown'})}
                    ${setting({id: 'accessible_name_colours'})}
                    ${setting({id: 'underline_links'})}
                </div>
            </div>
            <div class="bleh--panel">
                <h4>${tl(trans.language)}</h4>
                <div class="languages" id="languages"></div>
                <div class="setting-group">
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.submit_language.name)}</h5>
                            <p>${tl(trans.submit_language.body)}</p>
                        </div>
                        <div class="toggle-wrap">
                            <a class="see-more" href="https://github.com/katelyynn/bleh/wiki" target="_blank">${tl(trans.help_contribute)}</a>
                        </div>
                    </div>
                </div>
            </div>
            `);
    } else if (page_id == 'sku') {
        register_skip_to([]);

        render(page.structure.main, html`
            <div class="bleh--panel">
                <div class="panel-intro">
                    <div class="sub-text">${version.build}.${version.sku}</div>
                    <h1>☆⌒(>w<)</h1>
                </div>
                <div class="sep" />
                <h4>${tl(trans.manage_feature_flags)}</h4>
                <div class="alert alert-danger">${tl(trans.beware_notice)}</div>
                <div class="setting-group">
                    ${Object.entries(version.feature_flags).reverse().map(([flag, details]) => {
                        let value = ff(flag);

                        let checkbox;
                        let state;

                        return html.node`
                            <div class="setting" data-type="toggle" onclick=${() => {
                                let current = checkbox.checked;

                                checkbox.checked = !current;
                                state.setAttribute('aria-checked', !current);

                                settings.feature_flags[flag] = !current;
                                document.documentElement.setAttribute(`data-ff--${flag}`, (!current).toString());
                                localStorage.setItem('bleh', JSON.stringify(settings));
                            }}>
                                <div class="heading">
                                    <h5>${details.name}</h5>
                                    ${details.notice ? html.node`<p>${{html: details.notice}}</p>` : ''}
                                    <div class="info-row">
                                        <div class="new-badge flag-${details.default}">${details.default}</div><p class="date">${details.date}</p><p>${flag}</p>
                                    </div>
                                </div>
                                <div class="toggle-wrap">
                                    <input type="checkbox" ref=${el => checkbox = el} value=${value} checked=${value} />
                                    <button class="toggle" aria-checked=${value} ref=${el => state = el}>
                                        <div class="dot" />
                                    </button>
                                </div>
                            </div>
                        `;
                    })}
                </div>
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

        function chartlist_bar(value, max) {
            let count_bar = html.node`
                <div class="chartlist-count-bar">
                    <a class="chartlist-count-bar-link">
                        <span class="chartlist-count-bar-slug" data-max-stat-value="${max}" data-stat-value="${value}" style="width: ${(max / max) * 100}%" />
                        <span class="chartlist-count-bar-value">${value.toLocaleString(lang)}</span>
                    </a>
                </div>
            `;

            let parsed_scrobble_as_rank = parse_scrobbles_as_rank(value);

            count_bar.setAttribute('data-bleh--scrobble-milestone', parsed_scrobble_as_rank.milestone);
            count_bar.style.setProperty('--hue-over', parsed_scrobble_as_rank.hue);
            count_bar.style.setProperty('--sat-over', parsed_scrobble_as_rank.sat);
            count_bar.style.setProperty('--lit-over', parsed_scrobble_as_rank.lit);

            return count_bar;
        }

        let bars;

        render(page.structure.main, html`
            <div class="bleh--panel">
                <h4>${tl(trans.music_corrections)}</h4>
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
                <div class="setting-group">
                    ${setting({id: 'corrections'})}
                    <div class="setting" data-type="info"
                         disabled=${!artist_corrections.version || !album_track_corrections.version}>
                        <div class="heading">
                            <h5>${tl(trans.current_version)}</h5>
                        </div>
                        <div class="info">
                            <button class="see-more update-check" onclick="_lotus_check()">
                                ${tl(trans.update_check)}
                            </button>
                            <p>${(artist_corrections.version == album_track_corrections.version) ? artist_corrections.version : `${artist_corrections.version}, ${album_track_corrections.version}`}</p>
                        </div>
                    </div>
                    <div class="setting" data-type="info" disabled=${!artist_corrections.version || !album_track_corrections.version}>
                        <div class="heading">
                            <h5>${tl(trans.help_contribute)}</h5>
                        </div>
                        <div class="info">
                            <a class="see-more" href="https://github.com/katelyynn/lotus/issues/new/choose" target="_blank">
                                ${tl(trans.suggest_correction)}
                            </a>
                            <button class="see-more" onclick="_open_correction_modal()">
                                ${tl(trans.view_all)}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="setting-group">
                    ${setting({id: 'prefer_no_redirect'})}
                    <div class="setting" data-type="action">
                        <div class="heading">
                            <h5>${tl(trans.legacy_redirects.name)}</h5>
                            <p>${tl(trans.legacy_redirects.body)}</p>
                        </div>
                        <div class="toggle-wrap">
                            <a class="btn continue" href="${root}settings/website" target="_blank">
                                ${tl(trans.change_now)}
                            </a>
                        </div>
                    </div>
                    ${setting({id: 'travis'})}
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
                <div class="setting-group">
                    ${setting({id: 'format_guest_features'})}
                    ${setting({id: 'show_guest_features'})}
                    ${setting({id: 'show_remaster_tags'})}
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
                <div class="setting-group">
                    ${setting({id: 'stacked_chartlist_info'})}
                    ${setting({id: 'show_bulk_edit_album'})}
                    ${setting({id: 'glacier_library_graphs'})}
                </div>
                <div class="inner-preview pad">
                    <div class="bars" ref=${el => bars = el}>
                        ${() => {
                            let max = 30_000;

                            for (let value = 1_000; value <= max; value += 1_000) {
                                bars.appendChild(chartlist_bar(value, max));
                            }
                        }}
                    </div>
                </div>
                <div class="setting-group">
                    ${setting({id: 'colourful_counts'})}
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
                <div class="setting-group">
                    ${setting({id: 'gloss'})}
                    ${setting({id: 'grid_glow'})}
                </div>
            </div>
            `);
    } else if (page_id == 'update') {
        register_skip_to([]);

        let update_btn;
        let pause_btn;

        const update_required = localStorage.getItem('bleh_update_required') || 'false';
        const last_checked = localStorage.getItem('bleh_update_checked') || null;
        const version_to_install = localStorage.getItem('bleh_update_to') || null;

        let paused = localStorage.getItem('bleh_update_paused') || 'false';
        let paused_until = localStorage.getItem('bleh_update_paused_until') || null;

        render(page.structure.main, html`
            <section class="bleh--panel">
                <div class="update-center-header">
                    ${paused === 'true' ? html.node`
                    <div class="update-center-icon">
                        <div class="update-container">
                            <div class="bleh-icon" data-type="update" />
                        </div>
                        <div class="check-circle paused colourful">
                            <div class="bleh-icon" data-type="paused" />
                        </div>
                    </div>
                    <div class="update-center-details">
                        <h2>${tl(trans.updates_paused)}</h2>
                        <p class="last-checked">${tl(trans.paused_until_date).replace('{d}', moment(paused_until).fromNow())}</p>
                    </div>
                    <button class="btn primary icon" data-type="update" ref=${el => update_btn = el} disabled>${tl(trans.check)}</button>
                    ` : update_required === 'false' ? html.node`
                    <div class="update-center-icon">
                        <div class="update-container">
                            <div class="bleh-icon" data-type="update" />
                        </div>
                        ${last_checked ? html.node`
                        <div class="check-circle colourful">
                            <div class="bleh-icon" data-type="check-thick" />
                        </div>
                        ` : ''}
                    </div>
                    <div class="update-center-details">
                        ${last_checked ? html.node`
                        <h2>${tl(trans.you_are_up_to_date)}</h2>
                        <p class="last-checked">${tl(trans.last_checked_date).replace('{d}', moment(last_checked).fromNow())}</p>
                        ` : html.node`
                        <h2>${tl(trans.missing_updates)}</h2>
                        <p class="last-checked">${tl(trans.never_checked)}</p>
                        `}
                    </div>
                    <button class="btn primary icon" data-type="update" ref=${el => update_btn = el} onclick=${() => update_check(true, update_btn, () => {
                        notify({
                            id: 'update',
                            title: tl(trans.updates),
                            body: tl(trans.checked_for_updates),
                            icon: 'icon-16-update'
                        });
                        render_setting_page('update');
                    })}>${tl(trans.check)}</button>
                    ` : html.node`
                    <div class="update-center-icon">
                        <div class="update-container">
                            <div class="bleh-icon" data-type="update" />
                        </div>
                    </div>
                    <div class="update-center-details">
                        <h2>${tl(trans.update_available_to_install)}</h2>
                        ${last_checked ? html.node`
                        <p class="last-checked">${tl(trans.last_checked_date).replace('{d}', moment(last_checked).fromNow())}</p>
                        ` : html.node`
                        <p class="last-checked">${tl(trans.never_checked)}</p>
                        `}
                    </div>
                    <button class="btn primary icon" data-type="update" ref=${el => update_btn = el} onclick=${() => start_update()}>${tl(trans.install_now)}</button>
                    `}
                </div>
                ${last_checked && paused === 'false' && update_required === 'true' ? html.node`
                <div class="alert alert-info">${tl(trans.you_are_installing_version).replace('{v}', version_to_install)}</div>
                ` : html.node`
                <div class="alert alert-info">${tl(trans.you_are_running_version).replace('{v}', version.build)}</div>
                `}
            </section>
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

export function change_settings_page(page_id, setting = null) {
    if (page_id == page.state.settings_page)
        return;

    window.history.pushState(page_id, '', `${root}bleh/${page_id}`);
    page.state.settings_page = page_id;

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

    if (page_id == 'seasonal')
        seasonal_timer_start();
    else
        seasonal_timer_end();

    try {
        render_setting_page(page_id);
    } catch(e) {
        render(page.structure.main, html`
            <div class="bleh--panel">
                <div class="loading-data-container">
                    <div class="loading-data-text failed">${tl(trans.value_failed_to_load).replace('{v}', tl(trans.settings))}</div>
                    <pre class="error-info">${(e) ? html.node`<span class="error-type">${e.name}</span>: ${e.message}` : ''}</pre>
                </div>
            </div>
        `);
    }

    if (page_id == 'customise' || page_id == 'performance' || page_id == 'accessibility' || page_id == 'text' || page_id == 'seasonal' || page_id == 'music' || page_id == 'activities') {
        refresh_all();
    } else if (page_id == 'profiles') {
        init_profile_notes();
        activity_preview();
        refresh_all();
    }

    if (page_id == 'text')
        prepare_language_page();

    if (page_id == 'music') {
        tippy(document.getElementById('container-show_bulk_edit_album'), {
            content: trans_legacy.en.settings.music.show_bulk_edit_album.require
        });
    }

    if ((page_id == 'seasonal') && settings.seasonal && stored_season.id != 'none' && stored_season.start && stored_season.end) {
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
        render(feature_flag_element, html`
            <div class="heading">
                <h5>${version.feature_flags[flag].name}</h5>
                ${(version.feature_flags[flag].notice) ? html.node`<p>${{html: version.feature_flags[flag].notice}}</p>` : ''}
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
    if (!button) return;

    let current_state = ff(flag);

    button.setAttribute('aria-checked', !current_state);
    settings.feature_flags[flag] = !current_state;
    document.documentElement.setAttribute(`data-ff--${flag}`, `${!current_state}`);

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
        palette: [
            {sets: {
                hue: 0,
                sat: 1.2,
                lit: 0.9
            }, label: trans.red},
            {sets: {
                hue: 19,
                sat: 1.275,
                lit: 0.95
            }, label: trans.orange},
            {sets: {
                hue: 48,
                sat: 1.5,
                lit: 1
            }, label: trans.yellow},
            {sets: {
                hue: 98,
                sat: 1.05,
                lit: 1.025
            }, label: trans.lime},
            {sets: {
                hue: 131,
                sat: 1,
                lit: 0.925
            }, label: trans.green},
            {sets: {
                hue: 188,
                sat: 1,
                lit: 1.1
            }, label: trans.aqua},
            {sets: {
                hue: 228,
                sat: 1.3,
                lit: 0.9
            }, label: trans.blue},
            {sets: {
                hue: 255,
                sat: 1.07,
                lit: 1
            }, label: trans.purple},
            {sets: {
                hue: 317,
                sat: 1.1,
                lit: 1
            }, label: trans.pink},
            {sets: {
                hue: 0,
                sat: 0,
                lit: 1
            }, label: trans.grey}
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

    let hue_range;
    let sat_range;
    let lit_range;

    for (let type in colours) {
        const swatch_group = page.structure.main.querySelector(`#colour_${type}`);
        if (!swatch_group) return;

        colours[type].forEach((colour) => {
            if (colour.requires_flag && version.feature_flags.hasOwnProperty(colour.requires_flag)) {
                if (!ff(colour.requires_flag))
                    return;
            }

            let text;
            if (colour.label) text = tl(colour.label);

            if (!colour.type)
                colour.type = 'colour';

            if (!colour.displays && colour.sets)
                colour.displays = colour.sets;

            let blob;
            let text_elem;
            let swatch = html.node`
                <button class="swatch-container" onclick=${() => {
                    if (!colour.sets) return;

                    hue_range.set(colour.sets.hue);
                    sat_range.set(colour.sets.sat);
                    lit_range.set(colour.sets.lit);
                }}>
                    <div class="swatch colourful" ref=${el => blob = el} data-swatch-type=${colour.type} />
                    <strong ref=${el => text_elem = el} />
                </button>
            `;

            if (type == 'custom')
                text = tl(trans[colour.type]);

            if (colour.type == 'customise') {
                text = tl(trans.edit);

                let colour;

                tippy(swatch, {
                    theme: 'window',
                    content: html.node`
                        <div class="dialog-settings">
                            <div class="alert alert-info seasonal-hsl-alert">
                                ${tl(trans.seasonal_warning)}
                            </div>
                            <div class="setting-group blend">
                                ${(ff('colour_based_on_hex')) ? html.node`
                                <div class="setting" data-type="text">
                                    <div class="heading">
                                        <h5>${tl(trans.convert_from_hex)}</h5>
                                    </div>
                                    <div class="input-container content-form">
                                        ${colour = input({
                                            type: 'colour',
                                            value: '#999999',
                                            maxlength: 7,
                                            warn_if_empty: true
                                        })}
                                        <button class="btn primary icon convert" onclick=${() => {
                                            const value = colour.querySelector('input').value;
                                            const hsl = hex_to_hsl(value);

                                            hue_range.set(hsl.h);
                                            sat_range.set(clamp_sat((hsl.s / 100) * 3));
                                            lit_range.set((hsl.l / 100) + 0.35);
                                        }}>${tl(trans.convert)}</button>
                                    </div>
                                </div>
                                ` : ''}
                                ${hue_range = setting({id: 'hue'})}
                                ${sat_range = setting({id: 'sat'})}
                                ${lit_range = setting({id: 'lit'})}
                            </div>
                        </div>
                    `,
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

                blob.style.setProperty('--hue-over', colour.displays.hue);
                blob.style.setProperty('--sat-over', colour.displays.sat);
                blob.style.setProperty('--lit-over', colour.displays.lit);
            }

            if (colour.type == 'default' && stored_season.id != 'none') {
                text = tl(trans.seasonal.name);

                if (exclusives.hasOwnProperty(stored_season.id)) {
                    delete colour.sets;

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

            text_elem.textContent = text;

            tippy(swatch, {
                content: text
            });

            swatch_group.appendChild(swatch);
        });
    }
}

function display_seasonal_exclusives(instance, colours, exclusives) {
    instance.innerHTML = '';

    exclusives[stored_season.id].forEach((colour) => {
        colour.sets = {accent_type: colour.type, ...colour.sets};

        if (!colour.displays) colour.displays = colour.sets;

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


function init_profile_notes() {
    let profile_notes_table = page.structure.main.querySelector('.profile-notes');
    if (!profile_notes_table) return;

    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};

    if (Object.keys(profile_notes).length == 0)
        return;

    profile_notes_table.classList = 'generic-table-list user-vertical-list take-space profile-notes';
    profile_notes_table.innerHTML = '';

    for (let user in profile_notes) {
        profile_notes_table.appendChild(html.node`
            <div class="generic-table-list-entry user-vertical-list-item" id="profile-note-row--${user}">
                <div class="name">
                    <a class="mention" href="${root}user/${user}">@${user}</a>
                </div>
                <div class="text preview">
                    <p id="profile-note-row-preview--${user}">${{html: profile_notes[user]}}</p>
                </div>
                <div class="actions">
                    <button class="icon chibi edit" onclick=${() => edit_profile_note(user)}>
                        ${tl(trans.delete)}
                    </button>
                    <button class="icon chibi delete danger-subtle" onclick=${() => delete_profile_note(user)}>
                        ${tl(trans.delete)}
                    </button>
                </div>
            </div>
        `);
    }
}

function delete_profile_note(user) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};
    delete profile_notes[username];
    document.getElementById(`profile-note-row--${username}`).style.setProperty('display','none');

    localStorage.setItem('bleh_profile_notes',JSON.stringify(profile_notes));
}

function edit_profile_note(user) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};

    let modal = dialog({
        id: 'edit_profile_note',
        title: tl(trans.edit_profile_note),
        body: html.node`
            <textarea class="modal-text" id="bleh--profile-note" placeholder=${tl(trans.anything_you_can_imagine)}>${profile_notes[user]}</textarea>
            <div class="modal-footer">
                <button class="see-more cancel" onclick=${() => dialog_rm({id: 'edit_profile_note'})}>
                    ${tl(trans.cancel)}
                </button>
                <div class="fill"></div>
                <button class="btn primary save" onclick=${() => save_profile_note_in_window(modal, user)}>
                    ${tl(trans.save)}
                </button>
            </div>
        `
    });
}

function save_profile_note_in_window(modal, user) {
    let profile_notes = JSON.parse(localStorage.getItem('bleh_profile_notes')) || {};
    let value_to_save = modal.querySelector('#bleh--profile-note').value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    profile_notes[user] = value_to_save;

    document.getElementById(`profile-note-row-preview--${user}`).textContent = value_to_save;

    localStorage.setItem('bleh_profile_notes',JSON.stringify(profile_notes));
    dialog_rm({id: 'edit_profile_note'});
}




export function prepare_corrections_page() {
    let corrections_table_artist = document.getElementById('corrections-artist');

    for (let artist in artist_corrections) {
        if (artist == 'version')
            continue;

        corrections_table_artist.appendChild(html.node`
        <div class="correction-row">
                <div class="primary-name pre-transition">
                    <h5>${artist}</h5>
                </div>
                <div class="arrow-divider"></div>
                <div class="primary-name post-transition">
                    <h5>${artist_corrections[artist]}</h5>
                </div>
        </div>`);
    }

    //

    let corrections_table_albums_tracks = document.getElementById('corrections-albums_tracks');

    for (let artist in album_track_corrections) {
        if (artist == 'version')
            continue;

        corrections_table_albums_tracks.appendChild(html.node`
            <div class="artist-row">
                <h5>${artist}</h5>
            </div>
        `);

        for (let media in album_track_corrections[artist]) {
            corrections_table_albums_tracks.appendChild(html.node`
                <div class="correction-row">
                    <div class="primary-name pre-transition">
                        <h5>${media}</h5>
                    </div>
                    <div class="arrow-divider"></div>
                    <div class="primary-name post-transition">
                        <h5>${album_track_corrections[artist][media]}</h5>
                    </div>
                </div>
            `);
        }
    }
}


function prepare_language_page() {
    let languages_table = document.getElementById('languages');

    for (let language in lang_info) {

        let users = '';
        for (let user in lang_info[language].by)
            users = `${users}<a class="mention" href="${root}user/${lang_info[language].by[user]}" target="_blank">@${lang_info[language].by[user]}</a> `;

        let lang_row = html.node`
            <div class="language-row${lang == language ? " active" : ""}">
                <div class="flag-container">
                    <img src="https://katelyynn.github.io/bleh/fm/flags/${language}.svg" alt="flag for ${language}">
                </div>
                <div class="name">
                    <h5>${lang_info[language].name}</h5>
                    <p>${html.node([
                        trans_legacy.en.settings.language.by.replace('{users}', users)
                    ])}</p>
                </div>
                ${(lang_info[language].new ? html.node`
                <div class="badges">
                    <div class="new-badge">${tl(trans.new)}</div>
                </div>
                ` : html.node`<div class="badges"></div>`)}
                <div class="date">
                    <p>${(lang_info[language].last_updated != 'latest') ? moment(lang_info[language].last_updated).fromNow() : lang_info[language].last_updated}</p>
                </div>
            </div>
        `

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
        body: html.node`
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
        `
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
            body: html.node`
                <p class="big-modal-alert alert-error">${trans_legacy.en.settings.actions.import.modals.failed.alert}</p>
                <div class="modal-footer">
                    <div class="fill"></div>
                    <button class="btn primary done" onclick="_dialog_rm({id: 'import_failed'})">
                        ${tl(trans.done)}
                    </button>
                </div>
            `
        });
    }
}


// export settings
function export_settings() {
    share(JSON.stringify(settings));
}
unsafeWindow._export_settings = function() {
    export_settings();
}


// reset settings
unsafeWindow._reset_settings = function() {
    dialog({
        id: 'reset_settings',
        title: tl(trans.reset_settings),
        body: html.node`
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
        `
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
    if (!preview) return;

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
            structuredClone(random_involved)[Math.floor(Math.random() * random_involved.length)]
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
            let song_tags = {};
            if (formatted_title) {
                song_title = formatted_title[0];
                song_tags = formatted_title[1];
                sister = formatted_title[2];
            }

            // combine
            name = html.node`
                <div class="title">${song_title.trim()}</div>
                ${song_tags.map((tag) => html.node`
                    <div class="feat" data-bleh--tag-type="${tag.type}" data-bleh--tag-group="${tag.group}">${tag.text}</div>
                `)}
            `;
        } else if ((involved.type == 'album' || involved.type == 'track') && settings.corrections) {
            name = html.node`${correct_item_by_artist(name, sister)}`;
            sister = correct_artist(sister);
        }  else if (involved.type == 'artist' && settings.corrections) {
            sister = correct_artist(sister);
        }

        if (involved_text != '')
            involved_text = html.node`${involved_text}, <a class="involved--${involved.type}">${name}</a>`;
        else
            involved_text = html.node`${involved_text}<a class="involved--${involved.type}">${name}</a>`;
    });

    render(activity_item, html`
        <div class="type">
            ${tl(trans.activity.listing[activity.type])}
            <div class="date">
                ${moment(activity.date).fromNow(true)}
            </div>
        </div>
        <div class="name">${involved_text}</div>
    `);

    parent.insertBefore(activity_item, parent.firstElementChild);

    if (parent.childElementCount > 3)
        parent.removeChild(parent.lastElementChild);
}

export function theme_bubbles() {
    let bubbles = html.node`
        <div class="theme-bubbles" />
    `;

    render_theme_bubbles();

    return bubbles;

    function update_theme_bubble(theme) {
        save_setting('theme', theme);
        render_theme_bubbles();
    }

    function render_theme_bubbles() {
        let themes = [
            {
                id: 'auto',
                name: tl(trans.auto),
                hide: !ff('auto_theme'),
                new_release: true
            },
            {
                id: 'glass',
                type: 'light',
                name: tl(trans.glass),
                hide: !ff('glass'),
                new_release: true
            },
            {
                id: 'light',
                type: 'light',
                name: tl(trans.themes.light)
            },
            {
                id: 'ink',
                type: 'light',
                name: tl(trans.themes.ink)
            },
            {
                id: 'dark',
                formal: 'ash',
                type: 'dark',
                name: tl(trans.themes.dark)
            },
            {
                id: 'darker',
                formal: 'dark',
                type: 'darker',
                name: tl(trans.themes.darker)
            },
            {
                id: 'oled',
                formal: 'void',
                type: 'oled',
                name: tl(trans.themes.oled)
            }
        ];

        render(bubbles, html``); // fixes weird lighterhtml crash
        render(bubbles, html`
            ${themes.map(theme => {
                if (theme.hide) return html.node``;

                if (!theme.formal) theme.formal = theme.id;

                let bubble = html.node`
                    <button class="theme-bubble" aria-selected=${settings.theme == theme.id} onclick=${() => update_theme_bubble(theme.id)}>
                        <div class="bubble">
                            <div class="inner theme-preview" data-bleh--theme=${theme.id} data-bleh--theme_type=${theme.type}>
                                <div class="bleh-icon" data-type="theme_${theme.formal}" />
                            </div>
                        </div>
                        <strong>
                            ${theme.name}
                            ${theme.new_release ? html.node`<div class="new-badge">${tl(trans.new)}</div>` : ''}
                        </strong>
                    </button>
                `;

                tippy(bubble, {
                    theme: 'theme-preview',
                    content: html.node`
                        <div class="theme-preview" data-bleh--theme=${theme.id} data-bleh--theme_type=${theme.type}>
                            ${theme_preview()}
                        </div>
                    `,
                    delay: [500, 0]
                });

                return bubble;
            })}
        `);
    }
}
