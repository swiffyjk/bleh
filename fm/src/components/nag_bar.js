function nag_bar() {
    /*if (!page.structure.nag_bar) {
        page.structure.nag_bar = document.body.querySelector('#redirect-bar');
        console.info('nag', page.structure.nag_bar);

        if (!page.structure.nag_bar)
            return;
    }*/

    let active_nag = document.body.querySelector('.nag-bar');
    console.info('active nag', active_nag, page.structure.nag_bar.innerHTML);
    if (!active_nag)
        return;

    let type = active_nag.classList[1];

    if (type == 'nag-bar--corrections') {
        notify({
            id: 'corrections',
            title: trans[lang].nag_bar.corrections.title,
            body: active_nag.querySelector('strong').innerHTML,
            icon: 'icon-16-refresh'
        });
    } else {
        // TODO
        return;
    }

    active_nag.parentElement.removeChild(active_nag);
}