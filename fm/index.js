//
// bleh, an extension for the music site Last.fm
// Copyright (c) 2025 katelyn and contributors
// Licensed under GPLv3
//

import esbuild from "esbuild"
import build from "./src/build/build.json" with {type: "json"};

const banner = `// ==UserScript==
// @name         ${build.brand}
// @namespace    https://last.fm/
// @version      ${build.build}
// @description  ${build.bio}
// @author       ${build.author}
// @match        https://www.last.fm/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=last.fm
// @updateURL    ${build.url}
// @downloadURL  ${build.url}
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js
// ==/UserScript==`;


(async () => {
    const buildOptions = {
        entryPoints: ["./src/main.js"],
        bundle: true,
        logLimit: 0,
        outfile: "bleh.user.js",
        minify: false,
        banner: {
            js: banner
        },
        platform: "browser",
        loader: {
            ".css": "text"
        }
    };
    if (process.argv[2] == "dev") {
        const context = await esbuild.context(buildOptions);
        const serve = await context.serve()
        await context.watch()

        console.log("Serving on: ")
        for(const host of serve.hosts) {
            console.log(` \u001b[32mhttp://${host}:${serve.port}`)
        }
    } else {
        await esbuild.build(buildOptions);
    }
})();
