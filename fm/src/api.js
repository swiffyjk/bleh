import { settings } from "./build/config";
import { auth } from "./build/page";
import { lang, trans_legacy } from "./build/trans";
import { notify } from "./components/notify";

unsafeWindow._save_api_key = function() {
    let key = document.getElementById('text-api_key').value;

    // save to settings
    settings.api_key = key;
    localStorage.setItem('bleh', JSON.stringify(settings));

    notify({
        title: trans_legacy[lang].settings.profiles.api.name,
        body: trans_legacy[lang].settings.profiles.api.saved,
        icon: 'icon-16-api'
    });

    test_api_key();
}

function test_api_key() {
    let xhr = api(`user.getTopTags&user=${auth.name}&limit=1`);

    xhr.onload = function() {
        let data = JSON.parse(this.response);

        console.info(data, this.response);

        if (!data.error) {
            notify({
                title: trans_legacy[lang].settings.profiles.api.name,
                body: trans_legacy[lang].settings.profiles.api.confirmed,
                icon: 'icon-16-api'
            });
            return;
        } else {
            if (data.error == 8 || data.error == 11 || data.error == 16) {
                notify({
                    title: trans_legacy[lang].settings.profiles.api.name,
                    body: trans_legacy[lang].settings.profiles.api.inaccessible,
                    icon: 'icon-16-api',
                    persist: true
                });
                return;
            } else if (data.error == 10 || data.error == 26) {
                notify({
                    title: trans_legacy[lang].settings.profiles.api.name,
                    body: trans_legacy[lang].settings.profiles.api.invalid,
                    icon: 'icon-16-api',
                    persist: true
                });
                return;
            } else if (data.error == 29) {
                notify({
                    title: trans_legacy[lang].settings.profiles.api.name,
                    body: trans_legacy[lang].settings.profiles.api.rate_limit,
                    icon: 'icon-16-api',
                    persist: true
                });
                return;
            } else {
                notify({
                    title: trans_legacy[lang].settings.profiles.api.name,
                    body: data.error,
                    icon: 'icon-16-api',
                    persist: true
                });
                return;
            }
        }
    }

    xhr.send();
}

function api(endpoint) {
    let xhr = new XMLHttpRequest();
    let url = `https://ws.audioscrobbler.com/2.0/?method=${endpoint}&api_key=${settings.api_key}&format=json`;
    xhr.open('GET', url, true);

    return xhr;
}