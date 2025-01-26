// require page reload
let reload_pending = false;

// lookup
let last_lookup;
let next_lookup;

let dialogs = {};
let notifications = {};

tippy.setDefaultProps({
    arrow: false,
    duration: [120, 220]
});

// use the top-right link to determine the current user
let auth = {
    name: null,
    pro: false,
    avatar: null,
    sets: {
        hue: 255,
        sat: 1,
        lit: 1
    }
};
let auth_link = '';

// stores the current root of the page, most applicable in other languages:
// en: /
// jp: /jp/
// etc.
let root = '';

// recent activity
let recent_activity_list;

// page type
let last_page_type;
let last_page_subpage;
let page = {
    initial: '',
    type: '',
    name: '',
    sister: '',
    sister_others: [],
    subpage: '',
    avatar: '',
    multi: false,
    corrected: false,
    token: '',
    structure: {
        wrapper: null,
        container: null,
        row: null,
        main: null,
        side: null,
        nav: null,
        content_top: null,
        glacier: {
            refresh: true
        },
        indicator: null,
        logs: null
    },
    requested: {
        tab: null
    },
    header: {

    },
    state: {
        settings_reload: false,
        glacier: {
            insights: {
                artist: {
                    display: false,
                    values: [],
                    labels: [],
                    highest: {
                        value: 0,
                        label: '',
                        link: '',
                        img: ''
                    }
                },
                album: {
                    display: false,
                    values: [],
                    labels: [],
                    highest: {
                        value: 0,
                        label: '',
                        link: '',
                        img: ''
                    }
                },
                track: {
                    display: false,
                    values: [],
                    labels: [],
                    highest: {
                        value: 0,
                        label: '',
                        link: '',
                        img: ''
                    }
                }
            }
        }
    }
};

let shout_parse_queue = [];

let bleh_url = 'https://www.last.fm{root}bleh';
let setup_url = 'https://www.last.fm{root}bleh/setup';
let sponsor_url = 'https://www.last.fm{root}bleh/sponsor';

let has_prompted_for_update = false;

let theme_preview = (`
    <div class="preview-inner">
        <div class="preview-card">
            <div class="preview-header"></div>
            <div class="preview-text"></div>
            <div class="preview-text row-2"></div>
            <div class="preview-buttons">
                <div class="preview-button preview-button-primary">

                </div>
                <div class="preview-button">

                </div>
            </div>
        </div>
    </div>
`);