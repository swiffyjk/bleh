import { settings } from "../build/config";
import { log } from "../build/log";
import { page } from "../build/page";
import { lang, trans_legacy, trans, tl } from "../build/trans";
import { correct_artist, correct_item_by_artist } from "../components/lotus";
import { checkup_page_structure } from "../components/structure";
import { refresh_all } from "../config";
import { update_page } from "../page";

export function bleh_charts() {
    if (page.subpage != 'overview')
        return;


    let charts = page.structure.main.querySelector('.charts');
    charts.classList.add('legacy-charts');
    let chart_rows = charts.querySelectorAll('.charts-col:not(.charts-col--mobile-ad)');


    let new_panel = document.createElement('section');
    new_panel.classList.add('charts-panel');

    let out_now = page.structure.side.querySelector('.more-link-fullwidth-right a');
    if (out_now)
        out_now.classList.add('btn', 'out-now-btn');

    let header = document.createElement('div');
    header.classList.add('charts-header', 'top-header');
    header.innerHTML = (`
        <div class="left">

        </div>
        <div class="middle">
            <h2>${trans_legacy.en.charts.charts_for.replace('{date}', moment(new Date()).format('MMMM Do YYYY'))}</h2>
            ${(out_now != null) ? out_now.outerHTML : ''}
        </div>
        <div class="right">
            <div class="view-buttons">
                <button class="btn view-item glacier-configure-button panel-settings-button">
                    ${tl(trans.settings)}
                </button>
            </div>
        </div>
    `);
    new_panel.appendChild(header);

    let settings_btn = header.querySelector('.panel-settings-button');

    tippy(settings_btn, {
        theme: 'window',
        content: (`
            <div class="dialog-settings">
                <div class="setting" data-type="toggle" id="container-simulate_scroll" onclick="_update_item('simulate_scroll')">
                    <button class="btn reset" onclick="_reset_item('simulate_scroll')">${tl(trans.reset)}</button>
                    <div class="heading">
                        <h5>${trans_legacy.en.charts.scroll.name}</h5>
                        <p>${trans_legacy.en.charts.scroll.bio}</p>
                    </div>
                    <div class="toggle-wrap">
                        <button class="toggle" id="toggle-simulate_scroll" aria-checked="true">
                            <div class="dot"></div>
                        </button>
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

    chart_rows.forEach((row, index) => {
        let chart_row = document.createElement('div');
        chart_row.classList.add('charts-new-row');
        chart_row.setAttribute('data-index', index);

        let header = row.querySelector('h2');
        chart_row.appendChild(header);

        let list = document.createElement('ol');
        list.classList.add('music-bookmarks-artists', 'charts-list');

        if (settings.simulate_scroll) {
            list.addEventListener('wheel', (e) => {
                e.preventDefault();

                if (e.deltaY > 0) {
                    list.scrollBy({
                        top: 0,
                        left: +600,
                        behavior: 'smooth'
                    });
                } else {
                    list.scrollBy({
                        top: 0,
                        left: -600,
                        behavior: 'smooth'
                    });
                }
            });
        }

        let items = row.querySelectorAll('.globalchart-item');
        items.forEach((item, item_index) => {
            let list_item = document.createElement('li');

            let image = item.querySelector('.globalchart-image img');
            let rank = item.querySelector('.globalchart-rank');
            let name = item.querySelector('.globalchart-name a');

            let link = name.getAttribute('href');

            image.setAttribute('src', image.getAttribute('src').replace('/avatar70s/', '/avatar300s/'));

            if (index == 1) {
                name.textContent = correct_artist(name.textContent);

                list_item.classList.add('music-bookmarks-artists-item-wrap', 'charts-list-item');
                list_item.innerHTML = (`
                    <div class="music-bookmarks-artists-item charts-list-item-inner">
                        <div class="charts-list-rank">${rank.textContent.trim()}</div>
                        <h3 class="music-bookmarks-artists-item-name">
                            ${name.outerHTML}
                        </h3>
                        <div class="media-item">
                            <span class="music-bookmarks-albums-item-image cover-art">
                                ${image.outerHTML}
                            </span>
                            <div class="charts-list-rank-overlay-wrap">
                                <div class="charts-list-rank-overlay">${rank.textContent}</div>
                            </div>
                        </div>
                        <a class="link-block-cover-link" href="${link}"></a>
                    </div>
                `);
            } else {
                let artist = item.querySelector('.globalchart-track-artist-name a');
                artist.textContent = correct_artist(artist.textContent);
                name.textContent = correct_item_by_artist(name.textContent, artist.textContent);

                list_item.classList.add('music-bookmarks-albums-item-wrap', 'charts-list-item');
                list_item.innerHTML = (`
                    <div class="music-bookmarks-albums-item charts-list-item-inner">
                        <div class="charts-list-rank">${rank.textContent.trim()}</div>
                        <h3 class="music-bookmarks-albums-item-name">
                            ${name.outerHTML}
                        </h3>
                        <p class="music-bookmarks-albums-item-artist">
                            ${artist.outerHTML}
                        </p>
                        <div class="media-item">
                            <span class="music-bookmarks-albums-item-image cover-art">
                                ${image.outerHTML}
                            </span>
                            <div class="charts-list-rank-overlay-wrap">
                                <div class="charts-list-rank-overlay">${rank.textContent}</div>
                            </div>
                        </div>
                        <a class="link-block-cover-link" href="${link}"></a>
                    </div>
                `);
            }

            list.appendChild(list_item);
        });

        chart_row.appendChild(list);

        new_panel.appendChild(chart_row);
    });

    page.structure.main.insertBefore(new_panel, page.structure.main.firstElementChild);
}