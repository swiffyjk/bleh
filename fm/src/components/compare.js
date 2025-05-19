import { auth, page } from '../build/page';
import { tl, trans } from '../build/trans';
import { dialog } from './dialog';
import { custom_select } from './select';

export function compare() {
    page.state.compare_modal = dialog({
        id: 'compare',
        title: tl(trans.compare),
        body: (`
            <div class="compare-header">
                <div class="compare-users">
                    <div class="compare-user">
                        <div class="avatar">
                            <img src="${auth.avatar.replace('/avatar42s/', '/avatar170s/')}" alt="${tl(trans.your_avatar)}">
                        </div>
                        <strong>${auth.name}</strong>
                    </div>
                    <div class="bleh-icon"></div>
                    <div class="compare-user">
                        <div class="avatar">
                            <img src="${page.avatar}" alt="${tl(trans.avatar_for_user).replace('{u}', page.name)}">
                        </div>
                        <strong>${page.name}</strong>
                    </div>
                </div>
                <div class="compare-selection">
                    <div class="select-wrap custom-selector" id="range_select">
                        <select id="range">
                            <option value="LAST_7_DAYS">${tl(trans.last_count_days).replace('{c}', '7')}</option>
                            <option value="LAST_30_DAYS">${tl(trans.last_count_days).replace('{c}', '30')}</option>
                            <option value="LAST_90_DAYS">${tl(trans.last_count_days).replace('{c}', '90')}</option>
                            <option value="LAST_180_DAYS">${tl(trans.last_count_days).replace('{c}', '180')}</option>
                            <option value="LAST_365_DAYS">${tl(trans.last_count_days).replace('{c}', '365')}</option>
                        </select>
                    </div>
                    <button class="btn chibi icon primary compare" onclick="_begin_comparing()">${tl(trans.compare)}</button>
                </div>
            </div>
            <div class="compare-body">
                <div class="loading-data-container">
                    <div class="loading-data-text info">${tl(trans.choose_a_timeframe_above)}</div>
                </div>
            </div>
        `),
        type: 'compare'
    });

    tippy(page.state.compare_modal.querySelector('.chibi.compare'), {
        content: tl(trans.compare)
    });

    custom_select(page.state.compare_modal.querySelector('#range'), page.state.compare_modal.querySelector('#range_select'));
}

unsafeWindow._compare = function() {
    compare();
}

unsafeWindow._begin_comparing = function() {
    let body = page.state.compare_modal.querySelector('modal-body');
    body.innerHTML = '';
}