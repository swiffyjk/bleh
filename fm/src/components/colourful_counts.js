//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import {log} from "../build/log";
import {ranks} from "../build/music";
import {clean_number} from "../build/tools";

export function patch_artist_ranks_in_list_view(track) {
    let count_bar = track.querySelector('.chartlist-count-bar');

    if (count_bar == undefined)
        return;

    let count_bar_link = count_bar.querySelector('.chartlist-count-bar-link');
    if (count_bar_link.getAttribute('href')
        .includes('?from=') ||
        (count_bar_link.getAttribute('href')
        .includes('?date_preset=') && !count_bar_link.getAttribute('href').endsWith('?date_preset=ALL') && !count_bar_link.getAttribute('href').endsWith('?date_preset=null')))
        return;

    let count = clean_number(count_bar.querySelector('.chartlist-count-bar-value').textContent.trim().replace(' scrobbles',''));

    if (!count_bar.hasAttribute('data-kate-processed')) {
        count_bar.setAttribute('data-kate-processed','true');

        let parsed_scrobble_as_rank = parse_scrobbles_as_rank(count);

        count_bar.setAttribute('data-bleh--scrobble-milestone',parsed_scrobble_as_rank.milestone);
        count_bar.style.setProperty('--hue-over',parsed_scrobble_as_rank.hue);
        count_bar.style.setProperty('--sat-over',parsed_scrobble_as_rank.sat);
        count_bar.style.setProperty('--lit-over',parsed_scrobble_as_rank.lit);
    }
}

export function parse_scrobbles_as_rank(scrobbles) {
    let scrobble_milestone = 0;
    let scrobble_proximity = 1;
    let max_rank = 15;

    for (let rank = max_rank; rank >= 0; rank--) {
        if (scrobbles > ranks[rank].start) {
            //console.info('bleh - PARSING RANK:', rank, ranks[rank].start);

            let this_rank = parseInt(rank);

            scrobble_milestone = this_rank;

            let next_rank = this_rank + 1;
            let prev_rank = this_rank - 1;

            if (this_rank != max_rank && this_rank != 0)
                scrobble_proximity = (scrobbles - ranks[prev_rank].start) / ranks[next_rank].start;

            break;
        }
    }

    let milestone_hue = ranks[scrobble_milestone].hue;
    let milestone_sat = ranks[scrobble_milestone].sat;
    let milestone_lit = ranks[scrobble_milestone].lit;

    //console.info('bleh - default values will be', milestone_hue, milestone_sat, milestone_lit);

    if (scrobble_milestone != max_rank) {
        let next_milestone_hue = ranks[scrobble_milestone + 1].hue;
        let next_milestone_sat = ranks[scrobble_milestone + 1].sat;
        let next_milestone_lit = ranks[scrobble_milestone + 1].lit;

        //console.info('bleh - next up values will be', next_milestone_hue, next_milestone_sat, next_milestone_lit);

        if (milestone_hue > next_milestone_hue)
            milestone_hue += (next_milestone_hue - milestone_hue) * scrobble_proximity;

        if (milestone_sat < next_milestone_sat)
            milestone_sat += (milestone_sat - next_milestone_sat) * scrobble_proximity;
        else
            milestone_sat += (next_milestone_sat - milestone_sat) * scrobble_proximity;

        if (milestone_lit < next_milestone_lit)
            milestone_lit += (milestone_lit - next_milestone_lit) * scrobble_proximity;
        else
            milestone_lit += (next_milestone_lit - milestone_lit) * scrobble_proximity;

        //console.info('bleh - created proximity values', milestone_hue, milestone_sat, milestone_lit);
    }



    log(`milestone for ${scrobbles} is ${scrobble_milestone} within ${scrobble_proximity} proximity`, 'colourful counts', 'info', {hue: milestone_hue, sat: milestone_sat, lit: milestone_lit});

    return {
        milestone: scrobble_milestone,
        proximity: scrobble_proximity,
        hue: milestone_hue,
        sat: milestone_sat,
        lit: milestone_lit
    };
}
