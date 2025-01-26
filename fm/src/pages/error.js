function error_page() {
    page.state.error = false;
    let page_content = document.body.querySelector('.page-content');

    if (page_content == null)
        return;

    let error_marvin = page_content.querySelector('.error-page-marvin:not([data-bleh])');

    if (error_marvin == null)
        return;
    page.state.error = true;
    error_marvin.setAttribute('data-bleh', 'true');

    let error_content = page_content.querySelector('h1');


    let back_link = page_content.querySelector('a');

    page_content.classList.add('has-error');
    page_content.innerHTML = (`
        <div class="error-page">
            <h3>${trans[lang].error.name}</h3>
            <h4>${error_content.textContent}</h4>
            <div class="button-footer">
                <a class="btn back" href="${back_link.getAttribute('href')}">
                    ${trans[lang].error.go_back}
                </a>
                <a class="btn continue primary" href="${root}user/${auth.name}">
                    ${trans[lang].error.visit_profile}
                </a>
            </div>
        </div>
    `);
}