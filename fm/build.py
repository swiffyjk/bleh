# this script is used to build a working bleh.user.js file
# it combines all js in the src directory into one file
# along with reading build.json for build info

import json

build = {}

print('Attempting to read build file to begin')

with open('build.json') as file:
    build = json.load(file)

if build['brand'] is None or build['build'] is None or build['sku'] is None or build['bio'] is None or build['author'] is None or build['url'] is None:
    raise Exception('No build supplied, a brand name (brand), version number (build), sku, bio, author, and update/download url is required')

if (build['feature_flags'] is None):
    print('Added empty feature flags as none were supplied')
    build['feature_flags'] = {}

print (f'Building {build['brand']} with version {build['build']}.{build['sku']}')

with open('bleh.user.js', 'w') as file:
    # HEADER
    file.write( '// ==UserScript==')
    file.write(f'// @name         {build['brand']}')
    file.write( '// @namespace    http://last.fm/')
    file.write(f'// @version      {build['build']}')
    file.write(f'// @description  {build['bio']}')
    file.write(f'// @author       {build['author']}')
    file.write( '// @match        https://www.last.fm/*')
    file.write( '// @icon         https://www.google.com/s2/favicons?sz=64&domain=last.fm')
    file.write(f'// @updateURL    {build['url']}')
    file.write(f'// @downloadURL  {build['url']}')
    file.write( '// @run-at       document-start')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js')
    file.write( '// @require      https://unpkg.com/@popperjs/core@2.11.8/dist/umd/popper.min.js')
    file.write( '// @require      https://unpkg.com/tippy.js@6.3.7/dist/tippy.umd.min.js')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js')
    file.write( '// @require      https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js')
    file.write( '// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js')
    file.write( '// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@^1')
    file.write( '// ==/UserScript==')