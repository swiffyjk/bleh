import {update_page} from "../page.js";
import {auth, page, root} from "../build/page.js";
import {html, render} from "lighterhtml";
import {tl, trans} from "../build/trans.js";

export function bleh_games() {
    update_page();

    // remove error stuff cus we control this page
    page.structure.row.removeChild(page.structure.row.firstElementChild);
    page.structure.row.removeChild(page.structure.row.firstElementChild);

    let path = window.location.pathname.split('/');
    let game = path[path.length - 1];

    if (game == 'games') game = null;

    const valid_games = {
        pixel: {
            name: tl(trans.pixel?.name),
            body: tl(trans.pixel?.body),
            func: bleh_games_pixel
        },
        rainbow: {
            name: tl(trans.rainbow?.name),
            body: tl(trans.rainbow?.body),
            func: bleh_games_rainbow
        },
        receipt: {
            name: tl(trans.receipt?.name),
            body: tl(trans.receipt?.body),
            func: bleh_games_receipt
        },
        collage: {
            name: tl(trans.collage),
            body: tl(trans.collage_description),
            func: () => {
                window.location.href = `${root}user/${auth.name}?collage`;
            }
        }
    }

    if (game && !valid_games[game]) {
        render(page.structure.main, html`
            <div class="loading-data-container">
                <div class="loading-data-text error">${tl(trans.no_game_found).replace('{v}', game)}</div>
            </div>
        `);
        return;
    }

    if (game) {
        page.structure.container.setAttribute('data-game', game);
        valid_games[game].func();
        return;
    }

    render(page.structure.main, html`
        <section class="games">
            <h2>${tl(trans.games)}</h2>
            <div class="game-list">
                ${Object.entries(valid_games).map(([id, game]) => html.node`
                    <button class="game" data-type=${id} data-game=${id} onclick=${() => {
                        window.history.pushState(id, '', `${root}bleh/games/${id}`);
                        page.structure.container.setAttribute('data-game', id);
                        render(page.structure.main, html``);
                        valid_games[id].func();
                    }}>
                        <div class="game-icon colourful">
                            <div class="bleh-icon" />
                        </div>
                        <div class="game-info">
                            <h5>${game.name}</h5>
                            <p>${game.body}</p>
                        </div>
                        <div class="bleh-icon game-arrow" style="--icon: var(--mask)" data-type="arrow-right" />
                    </button>
                `)}
            </div>
            <p class="card-tip">${{html: tl(trans.labs_cta).replace('{a}', `<a class="see-more" href="${root}labs">`).replace('{/a}', '</a>')}}</p>
        </section>
    `);
}

function bleh_games_pixel() {
    render(page.structure.main, html`
        pixel
    `);
}

function bleh_games_rainbow() {
    render(page.structure.main, html`
        rainbow
    `);
}

function bleh_games_receipt() {
    render(page.structure.main, html`
        receipt
    `);
}
