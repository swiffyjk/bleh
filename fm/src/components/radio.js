import { page } from '../build/page';
import { tl, trans } from '../build/trans';

export function bleh_radio() {
    let radios = page.structure.container.querySelectorAll('.stationlink');
    radios.forEach((radio) => {
        let type = radio.getAttribute('data-analytics-label');
        radio.classList.add('radio-button');

        radio.innerHTML = (`
            <h3 class="sub-text">${tl(trans.radio)}</h3>
            <h4>${tl(trans[type])}</h4>
        `);

        radio.removeAttribute('title');
    });

    if (page.type == 'user') {
        let promo_v3 = page.structure.side.querySelector('.promo-v3');
        let header = promo_v3.querySelector('h2');
        header.textContent = tl(trans.listening);

        let promos = promo_v3.querySelectorAll('.listening-report-promo');
        let container = document.createElement('div');
        container.classList.add('listening-report-promos');
        promos.forEach((promo) => {
            container.appendChild(promo);
        });
        promo_v3.appendChild(container);

        if (!radios)
            return;

        let sep = document.createElement('div');
        sep.classList.add('sep');
        promo_v3.appendChild(sep);

        let list = page.structure.side.querySelector('.stationlink-list');
        page.structure.side.removeChild(list.parentElement);
        promo_v3.appendChild(list);
    }
}