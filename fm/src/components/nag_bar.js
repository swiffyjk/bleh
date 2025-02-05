function nag_bar() {
    /*if (!page.structure.nag_bar) {
        page.structure.nag_bar = document.body.querySelector('#redirect-bar');
        console.info('nag', page.structure.nag_bar);

        if (!page.structure.nag_bar)
            return;
    }*/

    let nags = page.structure.wrapper.querySelectorAll('.nag-bar');
    nags.forEach((active_nag) => {
        let type = active_nag.classList[1];

        if (type == 'nag-bar--corrections') {
            if (!settings.travis) {
                notify({
                    id: 'corrections',
                    title: trans[lang].nag_bar.corrections.title,
                    body: active_nag.querySelector('strong').innerHTML,
                    icon: 'icon-16-refresh'
                });
            }
        } else {
            // TODO
            return;
        }

        active_nag.parentElement.removeChild(active_nag);
    });
}