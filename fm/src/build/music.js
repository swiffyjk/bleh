//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

export let artist_corrections = {};
export let album_track_corrections = {};

export let ranks = {
    15: {
        start: 60_000,
        hue: 240,
        sat: 1.2,
        lit: 0.2
    },
    14: {
        start: 44_000,
        hue: 260,
        sat: 1.3,
        lit: 0.4
    },
    13: {
        start: 32_000,
        hue: 280,
        sat: 1.4,
        lit: 0.5
    },
    12: {
        start: 26_000,
        hue: 300,
        sat: 1.3,
        lit: 0.6
    },
    11: {
        start: 17_000,
        hue: 320,
        sat: 1.2,
        lit: 0.65
    },
    10: {
        start: 12_000,
        hue: 0,
        sat: 1.4,
        lit: 0.6
    },
    9: {
        start: 8_000,
        hue: 15,
        sat: 1.4,
        lit: 0.65
    },
    8: {
        start: 5_300,
        hue: 30,
        sat: 1.3,
        lit: 0.7
    },
    7: {
        start: 4_000,
        hue: 45,
        sat: 1.2,
        lit: 0.75
    },
    6: {
        start: 2_250,
        hue: 60,
        sat: 1.1,
        lit: 0.8
    },
    5: {
        start: 1_500,
        hue: 80,
        sat: 1.0,
        lit: 0.75
    },
    4: {
        start: 1_000,
        hue: 100,
        sat: 0.9,
        lit: 0.7
    },
    3: {
        start: 500,
        hue: 120,
        sat: 0.8,
        lit: 0.65
    },
    2: {
        start: 300,
        hue: 150,
        sat: 0.9,
        lit: 0.6
    },
    1: {
        start: 100,
        hue: 180,
        sat: 1.0,
        lit: 0.55
    },
    0: {
        start: 0,
        hue: 200,
        sat: 1.1,
        lit: 0.7
    }
};

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
