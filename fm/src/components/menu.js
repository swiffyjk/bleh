//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

export function register_menu(element, menu) {
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        menu.setProps({
            placement: 'right-start',
            offset: [0, 0],
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
