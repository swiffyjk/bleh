// require page reload
export let reload_pending = {
    state: false
};

// lookup
export let last_lookup;
export let next_lookup;

export let dialogs = {};
export let notifications = {};

tippy.setDefaultProps({
    arrow: false,
    duration: [120, 220]
});

// use the top-right link to determine the current user
export let auth = {
    name: null,
    pro: false,
    avatar: null,
    sets: {
        hue: 255,
        sat: 1,
        lit: 1
    }
};
export let auth_link = {
    state: ''
}

// stores the current root of the page, most applicable in other languages:
// en: /
// jp: /jp/
// etc.
export let root = '';
export function setRoot(data) {
    root = data;
}
// recent activity
export let recent_activity_list = [];

// page type
export let last_page_type = {
    state: undefined
};
export let last_page_subpage = {
    state: undefined
};
export let page = {
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

export let shout_parse_queue = [];

export let bleh_url = 'https://www.last.fm{root}bleh';
export let setup_url = 'https://www.last.fm{root}bleh/setup';
export let sponsor_url = 'https://www.last.fm{root}bleh/sponsor';

export let has_prompted_for_update = {
    state: false
};

export let theme_preview = (`
    <div class="preview-inner">
        <div class="preview-card">
            <div class="preview-header">Aa</div>
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