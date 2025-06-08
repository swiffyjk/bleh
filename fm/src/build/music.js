//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

export let artist_corrections = {};
export let album_track_corrections = {};

export let ranks = {
    15: {
        start: 62_000,
        hue: -135,
        sat: 1.5,
        lit: 0.35
    },
    14: {
        start: 50_000,
        hue: -105,
        sat: 1,
        lit: 0.85
    },
    13: {
        start: 38_000,
        hue: -85,
        sat: 1.2,
        lit: 0.95
    },
    12: {
        start: 24_000,
        hue: -55,
        sat: 0.875,
        lit: 0.85
    },
    11: {
        start: 16_000,
        hue: -25,
        sat: 1.5,
        lit: 0.875
    },
    10: {
        start: 12_500,
        hue: -7,
        sat: 1.5,
        lit: 0.875
    },
    9: {
        start: 6_000,
        hue: 4,
        sat: 1.425,
        lit: 0.9
    },
    8: {
        start: 4_300,
        hue: 25,
        sat: 1.425,
        lit: 0.925
    },
    7: {
        start: 3_200,
        hue: 60,
        sat: 1.375,
        lit: 0.95
    },
    6: {
        start: 2_250,
        hue: 80,
        sat: 1.35,
        lit: 0.925
    },
    5: {
        start: 1_500,
        hue: 103,
        sat: 1.35,
        lit: 0.925
    },
    4: {
        start: 1_000,
        hue: 130,
        sat: 1.35,
        lit: 0.925
    },
    3: {
        start: 500,
        hue: 148,
        sat: 1.35,
        lit: 0.925
    },
    2: {
        start: 300,
        hue: 160,
        sat: 1.5,
        lit: 0.925
    },
    1: {
        start: 100,
        hue: 180,
        sat: 1.5,
        lit: 0.875
    },
    0: {
        start: 0,
        hue: 200,
        sat: 1.5,
        lit: 0.925
    }
}

export let includes = {
    guests: [
        'feat.', 'featuring',
        '- with', '(with', '[with', 'w/ ',
        'ft.',
        'ref.'
    ],
    versions: [
        '(taylor', '- spotify singles',
        '(spotify', '(+'
    ],
    remasters: [
        '- remaster', '(remaster'
    ],
    mixes: [
        '- devonshire mix', '(devonshire mix',
        'mike dean master',
        '- remix', '(remix', '[remix',
        '- live', '(live',
        '- demo', '(demo',
        '- rehearsal', '(rehearsal',
        '- sample clearance', '(sample clearance', '[sample clearance',
        '- home demo', '(home demo',
        '- solo acoustic', '(solo acoustic',
        '- acoustic', '(acoustic',
        '- alternative', '(alternative',
        '(mix 1', '(mix 2', '(mix 3', '(mix 4', '(mix 5', '(mix 6', '(mix 7', '(mix 8', '(mix 9',
        '- chopped', '(chopped', '[chopped',
        '(kate',
        '(asmr',
        '(agressive', '(aggressive', 'brazilian phonk', // lol
        '- sped up', '(sped up', '[sped up', '- slow', '(slow', '[slow',
        'a. g. cook remix',
        '- offline', '- og mix',
        '- club edit', '(club edit',
        '- radio', '(radio',
        '- orchestral', '(orchestral'
    ],
    mixes_numbers: [
        '(v1', '(v2', '(v3', '(v4', '(v5', '(v6', '(v7', '(v8', '(v9',
        '[v1', '[v2', '[v3', '[v4', '[v5', '[v6', '[v7', '[v8', '[v9'
    ],
    stems: [
        '- acapella', '(acapella', '[acapella', '- a cappella', '(a cappella', '[a cappella',
        '- instrumental', '(instrumental', '[instrumental',
        '- session', '(session', '[session',
        '- studio session', '(studio session', '[studio session',
        '- smart session', '(smart session', '[smart session',
        '- boombox', '(boombox',
        '- mtv unplugged', '(mtv unplugged',
        '- unplugged', '(unplugged',
        '- the long pond studio', '(the long pond studio'
    ],
    bonus: [
        '- intro', '(intro', '[intro',
        '- outro', '(outro', '[outro', 'dean outro',
        '- interlude', '(interlude', '[interlude',
        '- bonus', '(bonus', '[bonus',
        '- edit', '(edit', '[edit',
        '- from', '(from', '[from',
        '- music from', '(music from',
        '- skit', '(skit',
        '- original', '(original', '[original',
        '[clean', '[explicit',
        '- deluxe', '(deluxe', '[deluxe',
        '- digital deluxe', '(digital deluxe', '[digital deluxe',
        '- complete edition', '(complete edition', '[complete edition',
        '- extended', '(extended', '[extended',
        '- the extended edition', // denzel
        '- expanded', '(expanded', '[expanded',
        '- anniversary', '(anniversary', '[anniversary',
        '- b-side', '- c-side', '(b-side', '(c-side',
        '- lp', '- ep', '(lp', '(ep',
        '- single', '(single',
        '- mixtape', '(mixtape',
        '- box set', '(box set',
        //,
        '- 19', '- 20', '(19', '(20',
        '- 10th', '- 25th', '- 30th', '- 35th', '- 40th', '- 50th', '- 60th',
        '(10th', '(25th', '(30th', '(35th', '(40th', '(50th', '(60th'
    ]
}
