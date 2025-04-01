function register_menu(element, menu) {
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        menu.setProps({
            getReferenceClientRect: () => ({
                width: 0,
                height: 0,
                top: e.clientY,
                bottom: e.clientY,
                left: e.clientX,
                right: e.clientX,
            }),
        });

        menu.show();
    });
}