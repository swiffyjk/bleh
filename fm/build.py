# this script is used to build a working bleh.user.js file
# it combines all js in the src directory into one file
# along with reading build.json for build info

import json

build = {}

print('Attempting to read build file to begin')

with open('build/build.json') as file:
    build = json.load(file)

if build['brand'] is None or build['build'] is None or build['sku'] is None or build['bio'] is None or build['author'] is None or build['url'] is None:
    raise Exception('No build supplied, a brand name (brand), version number (build), sku, bio, author, and update/download url is required')

if (build['feature_flags'] is None):
    print('Added empty feature flags as none were supplied')
    build['feature_flags'] = {}

print (f'Building {build['brand']} with version {build['build']}.{build['sku']}')

with open('bleh.user.js', 'w') as file:
    # HEADER
    file.write( '// ==UserScript==\n')
    file.write(f'// @name         {build['brand']}\n')
    file.write( '// @namespace    http://last.fm/\n')
    file.write(f'// @version      {build['build']}\n')
    file.write(f'// @description  {build['bio']}\n')
    file.write(f'// @author       {build['author']}\n')
    file.write( '// @match        https://www.last.fm/*\n')
    file.write( '// @icon         https://www.google.com/s2/favicons?sz=64&domain=last.fm\n')
    file.write(f'// @updateURL    {build['url']}\n')
    file.write(f'// @downloadURL  {build['url']}\n')
    file.write( '// @run-at       document-start\n')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js\n')
    file.write( '// @require      https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js\n')
    file.write( '// @require      https://unpkg.com/tippy.js@6.3.7/dist/tippy.umd.min.js\n')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js\n')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js\n')
    file.write( '// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js\n')
    file.write( '// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@^1\n')
    file.write( '// ==/UserScript==\n')

    file.write('\n')

    file.write(f'let version = {build};\n')
    file.write('let theme_version;\n\n')

    with open('build/trans.js') as trans:
        file.write(trans.read())