import { html } from 'lighterhtml';
import { dialog, dialog_rm } from './dialog';
import { settings } from '../build/config';
import { request_changelog } from '../news';
import { save_setting } from './settings';

export function load_dismissed() {
    if (!settings.dismissed.includes('2025-august-duplicate')) {
        dialog({
            id: '2025-august-duplicate',
            title: 'IMPORTANT!!',
            body: html.node`
                <p>Due to changes in this update, please check your extension settings. For most people, this will be 'Tampermonkey', which can be found in the extension menu in your browser (the jigsaw icon).</p>
                <p>From there, click into the extension you used to install bleh - if there's duplicates of bleh here continue below!</p>
                <img src="https://katelyynn.github.io/bleh/fm/changelog/blehs.jpg" style="margin-top: 10px; width: 300px">
                <div class="modal-footer">
                    <button class="see-more cancel" onclick=${() => {
                        save_setting('dismissed', [...settings.dismissed, '2025-august-duplicate']);
                        dialog_rm({id: '2025-august-duplicate'});
                        request_changelog();
                    }}>
                        Cancel, I do not have multiple
                    </button>
                    <div class="fill"></div>
                    <button class="btn primary save" onclick=${() => {
                        dialog({
                            id: '2025-august-duplicate',
                            title: 'IMPORTANT!!',
                            body: html.node`
                                <p>Luckily, this is very simple to fix - just follow the image below and it should be very similar for other extensions.</p>
                                <img src="https://katelyynn.github.io/bleh/fm/changelog/blehs2.jpg" style="margin: 10px 0">
                                <p>Delete the install with a <strong>lower version number</strong> to ensure you are up to date!</p>
                                <div class="modal-footer">
                                    <div class="fill"></div>
                                    <button class="btn primary save" onclick=${() => {
                                        save_setting('dismissed', [...settings.dismissed, '2025-august-duplicate']);
                                        dialog_rm({id: '2025-august-duplicate'});
                                        request_changelog();
                                    }}>Done!</button>
                                    <div class="fill"></div>
                                </div>
                            `,
                            dismiss: false
                        });
                    }}>
                        I have duplicate installs (continue)
                    </button>
                </div>
            `,
            dismiss: false
        })
    }
}