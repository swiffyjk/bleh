import { log } from "./build/log";
import { bleh } from "./page";

import version2 from "./build/build.json" assert {type: "json"}
export const version = version2;

log(`starting ${version.build}.${version.sku}`, 'load');

bleh();
