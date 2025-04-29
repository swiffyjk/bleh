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
}