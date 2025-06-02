import {html} from "lighterhtml";
import {notify} from "./notify";
import {dialog} from "./dialog.js";
import {tl, trans} from "../build/trans.js";

export function share(url) {
    let input;
    dialog({
        id: 'share',
        title: tl(trans.share),
        body: html.node`
            <div class="share-top content-form">
                <input
                    type="text"
                    readonly
                    value=${url}
                    class="share-input"
                    ref=${el => input = el}
                />
                <button 
                    class="btn icon copy"
                    onclick=${() => {
                        input.select();
                        document.execCommand('copy');
                        notify({
                            title: tl(trans.copied_to_clipboard),
                            type: 'success'
                        });
                    }}
                >${tl(trans.copy)}</button>
            </div>
            <div class="share-links">
                <a 
                    href=${`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
                    target="_blank"
                    class="share-link share-link-twitter"
                >Twitter</a>
                <a 
                    href=${`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                    target="_blank"
                    class="share-link share-link-facebook"
                >Facebook</a>
            </div>
        `
    });
}
