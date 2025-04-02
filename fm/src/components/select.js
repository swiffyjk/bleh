unsafeWindow._update_inbuilt_select = function(id, value) {
    update_inbuilt_select(id, value);
}
export function update_inbuilt_select(id, value) {
    document.documentElement.setAttribute(`data-bleh--inbuilt-${id}`, value);
}

export function custom_select(select, element_to_append) {
    console.info(select);
    let id = select.getAttribute('id');
    let value = select.value;
    let value_objects = select.querySelectorAll('option');

    let menu_list = document.createElement('div');
    value_objects.forEach((object) => {
        let object_value = object.getAttribute('value');
        let object_text = object.textContent;

        let item = document.createElement('button');
        item.classList.add('btn', 'dropdown-menu-clickable-item', 'select-item');
        item.setAttribute('onclick', `_set_custom_select_value('${id}', '${object_value}')`);
        item.setAttribute('data-value', object_value);
        item.setAttribute('type', 'button');
        item.textContent = object_text;

        menu_list.appendChild(item);
    });

    let button = document.createElement('button');
    button.classList.add('select-button');
    button.setAttribute('id', `select-${id}`);
    button.setAttribute('type', 'button');
    button.textContent = menu_list.querySelector(`[data-value="${value}"]`).textContent;

    let theme_menu_item = tippy(button, {
        theme: 'select-menu',
        content: (`
            ${menu_list.innerHTML}
        `),
        allowHTML: true,
        placement: 'bottom',
        interactive: true,
        interactiveBorder: 10,
        trigger: 'click',

        onShow(instance) {
            update_custom_select(instance.popper, select.value);
        }
    });

    element_to_append.appendChild(button);
}

unsafeWindow._set_custom_select_value = function(select_id, value) {
    let select = document.getElementById(select_id);

    select.value = value;

    console.info(select, `#select-${select_id}`);

    update_custom_select(document.getElementById(`select-${select_id}`)._tippy.popper, value, select_id);
    document.documentElement.setAttribute(`data-bleh--inbuilt-${select_id}`, value);
}
function update_custom_select(element = document.body, value = '', select_id = '') {
    let btns = element.querySelectorAll('.dropdown-menu-clickable-item');
    btns.forEach((btn) => {
        if (btn.getAttribute('data-value') != value) {
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
            //btn.scrollIntoView(true);

            /*let y = btn.getBoundingClientRect().top + element.scrollY;
            element.scroll({
                top: y,
                behavior: 'smooth'
            });*/

            let sel_button = document.body.querySelector(`#select-${select_id}`);

            console.log(sel_button);

            if (sel_button == null)
                return;
            sel_button.textContent = btn.textContent;
        }
    });
}