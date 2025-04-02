import { log } from "./build/log";
import { bleh } from "./page";

import version2 from "./build/build.json" assert {type: "json"}
export const version = version2;
export const theme_version = {
    state: ""
}

// TODO: Hacky, fix asap!
setTimeout(() => {
    log(`starting ${version.build}.${version.sku}`, 'load');
    bleh();
}, 1000);