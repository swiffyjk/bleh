import { settings } from "./build/config";
import { log } from "./build/log";
import { page } from "./build/page";
import { seasonal_events, seasonal_timer, stored_season } from "./build/seasonal";
import { lang, trans_legacy } from "./build/trans";
import { load_chart_colours } from "./chart";
import { deliver_notif } from "./components/notify";

export function set_season() {
    if (!settings.seasonal)
        return;

    let last_season_seen = localStorage.getItem('bleh_last_season_seen') || '';

    let now = new Date();
    log(`it is now ${now}`, 'season', 'log');

    stored_season.offset = calculate_offset(now);
    log(`calculated offset as ${stored_season.offset}`, 'season');

    let current_year = now.getFullYear();

    seasonal_events.forEach((season, index) => {
        log(`running thru, ${season.id} - ${new Date(season.start.replace('y0', current_year).replace('{offset}', stored_season.offset))} ${new Date(season.end.replace('y0', current_year).replace('{offset}', stored_season.offset))}`, 'season', 'log');
        log(`${now >= new Date(season.start.replace('y0', current_year).replace('{offset}', stored_season.offset))} ${now <= new Date(season.end.replace('y0', current_year).replace('{offset}', stored_season.offset))}`, 'season', 'log');
        if (
            now >= new Date(season.start.replace('y0', current_year).replace('{offset}', stored_season.offset)) &&
            now <= new Date(season.end.replace('y0', current_year).replace('{offset}', stored_season.offset))
        ) {
            stored_season.now = now;
            stored_season.year = current_year;

            update_season_nav();

            if (stored_season.id == season.id)
                return;
            stored_season.id = season.id;
            stored_season.start = season.start;
            stored_season.end = season.end;
            stored_season.snowflakes = season.snowflakes;

            if (now.getDate() == 31) {
                stored_season.new_years_eve = true;
                stored_season.seasonal_timer = setInterval(update_season_nav, 1000);
            } else if (stored_season.seasonal_timer) {
                clearInterval(stored_season.seasonal_timer);
            }

            // whats the next season?
            if (seasonal_events[index + 1] == null) {
                stored_season.next_id = seasonal_events[0].id;
                stored_season.next_start = seasonal_events[0].start;
                stored_season.next_is_new_year = true;
            } else {
                stored_season.next_id = seasonal_events[index + 1].id;
                stored_season.next_start = seasonal_events[index + 1].start;
                stored_season.next_is_new_year = false;
            }

            log(`${season.id} from ${season.start} to ${season.end}`, 'season');
            log(`next will be ${stored_season.next_id} from ${stored_season.next_start} (is new year? ${stored_season.next_is_new_year})`, 'season');

            document.documentElement.setAttribute('data-bleh--season', season.id);

            // snow
            if (season.snowflakes.state && settings.seasonal_particles != 'none') {
                log('let the snow start!', 'season');
                prep_snow();

                let snowflakes_enabled = true;
                let snowflakes_count = season.snowflakes.count;

                if (settings.seasonal_particles == 'less' && snowflakes_count > 10)
                    snowflakes_count = snowflakes_count * 0.45;

                begin_snowflakes(snowflakes_enabled, snowflakes_count);
            }

            // new season?
            if (last_season_seen != '' && last_season_seen != season.id)
                deliver_notif(trans_legacy.en.settings.customise.seasonal.announce.replace('{s}', trans_legacy.en.settings.customise.seasonal.listing[stored_season.id]))
            localStorage.setItem('bleh_last_season_seen', season.id);

            load_chart_colours();

            return;
        }
    });
}

function calculate_offset(now) {
    let offset = now.getTimezoneOffset();

    if (offset == 0)
        return '+0000';

    if (offset < 0) {
        offset = Math.abs(offset);
        offset /= 60;

        if (offset < 10)
            offset = `0${offset}`;

        offset = `+${offset}`;
    } else {
        offset = -Math.abs(offset);
        offset /= 60;

        if (offset > -10)
            offset = offset.toString().replace('-', '-0');
    }

    return `${offset}00`;
}

export function seasonal_timer_start(bypass = false) {
    if (stored_season.new_years_eve && !bypass)
        return;

    if (seasonal_timer.state != null)
        return;

    seasonal_timer.state = setInterval(set_season, 1000);
    log('started interval', 'season', 'info');

    if (page.header.season_tooltip == null)
        return;

    page.header.season_tooltip.setContent(`
        <span class="season-colour-name">${trans_legacy.en.settings.customise.seasonal.listing[stored_season.id]}</span>
        <span class="season-exclusive">${trans_legacy.en.auth_menu.seasonal_live}</span>
    `);

    page.header.season.classList.add('live');
}
export function seasonal_timer_end() {
    if (stored_season.new_years_eve)
        return;

    if (seasonal_timer.state == null)
        return;

    clearInterval(seasonal_timer.state);
    seasonal_timer.state = null;
    log('ended interval', 'season', 'info');

    if (page.header.season_tooltip == null)
        return;

    page.header.season_tooltip.setContent(`
        <span class="season-colour-name">${trans_legacy.en.settings.customise.seasonal.listing[stored_season.id]}</span>
        <span class="season-exclusive">${trans_legacy.en.auth_menu.seasonal_notice}</span>
    `);

    page.header.season.classList.remove('live');
}

function update_season_nav() {
    if (page.header.season == null)
        return;

    page.header.season.setAttribute('data-season', stored_season.id);

    if (!stored_season.new_years_eve) {
        page.header.season.textContent = moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true);
    } else {
        let next = stored_season.next_start.replace('y0', stored_season.year).replace('{offset}', stored_season.offset);
        if (stored_season.next_is_new_year)
            next = stored_season.next_start.replace('y0', stored_season.year + 1).replace('{offset}', stored_season.offset);

        let time_until = new Date(next) - new Date();

        page.header.season.textContent = countdown_to(time_until);

        page.header.season_tooltip.setContent(`
            <span class="season-colour-name">${trans_legacy.en.settings.customise.seasonal.listing[stored_season.id]}</span>
            <span class="season-exclusive">${trans_legacy.en.auth_menu.seasonal_live}</span>
        `);
    }
}

function countdown_to(time_until) {
    let days = Math.floor(time_until / (1000 * 60 * 60 * 24));
    let hours = Math.floor((time_until % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((time_until % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((time_until % (1000 * 60)) / 1000);

    console.info(time_until, hours, minutes, seconds);

    if (hours < 10)
        hours = '0' + hours;
    if (minutes < 10)
        minutes = '0' + minutes;
    if (seconds < 10)
        seconds = '0' + seconds;

    if (days != 0)
        return moment(stored_season.end.replace('y0', stored_season.year).replace('{offset}', stored_season.offset)).to(stored_season.now, true);

    if (hours == '00' && minutes == '00' && seconds == '00')
        set_season();

    if (hours == '00')
        return `${hours}:${minutes}:${seconds}`;
    else
        return `${hours}:${minutes}:${seconds}`;
}

function prep_snow() {
    let prev_container = document.getElementById('snowflakes');
    if (prev_container != null)
        return;

    let container = document.createElement('div');
    container.classList.add('snow-container');
    container.setAttribute('id', 'snowflakes');
    container.innerHTML = (`
        <span class="snow snowflake"></span>
    `);

    document.documentElement.appendChild(container);
}

// based on https://app.embed.im/snow.js
function begin_snowflakes(enabled, count) {
    if (!enabled)
        return;

    let dynamic_css = '';
    var snow_html = '';

    for(let i=1; i<count; i++) {
        snow_html += '<i class="snow"></i>';
        let rndX = (snow_rand(0, 1000000)*0.0001),
        rndO = snow_rand(-100000, 100000)*0.0001,
        rndT = (snow_rand(3, 8)*10).toFixed(2),
        rndS = (snow_rand(0, 10000)*0.0001).toFixed(2);
        dynamic_css += '.snow:nth-child('+i+'){'+'opacity:'+(snow_rand(1, 10000)*0.0001).toFixed(2)+';'+'transform:translate('+rndX.toFixed(2)+'vw,-10px) scale('+rndS+');'+'animation:fall-'+i+' '+snow_rand(10, 30)+'s -'+snow_rand(0, 30)+'s linear infinite'+'}'+'@keyframes fall-'+i+'{'+rndT+'%{'+'transform:translate('+(rndX+rndO).toFixed(2)+'vw,'+rndT+'vh) scale('+rndS+')'+'}'+'to{'+'transform:translate('+(rndX+(rndO/2)).toFixed(2)+'vw, 105vh) scale('+rndS+')'+'}'+'}'
    }

    document.getElementById('snowflakes').innerHTML = '<style>'+dynamic_css+'</style>'+snow_html;
}

function snow_rand(a, b) {
    return Math.floor(Math.random()*(b-a+1))+a
}