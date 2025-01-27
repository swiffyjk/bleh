# this script is used to build a working bleh.user.js file
# it combines all js in the src directory into one file
# along with reading build.json for build info

import os
import json

build = {}

print('Attempting to read build file to begin')

with open('build/build.json', encoding='utf-8') as file:
    build = json.load(file)

if build['brand'] is None or build['build'] is None or build['sku'] is None or build['bio'] is None or build['author'] is None or build['url'] is None:
    raise Exception('No build supplied, a brand name (brand), version number (build), sku, bio, author, and update/download url is required')

if (build['feature_flags'] is None):
    print('Added empty feature flags as none were supplied')
    build['feature_flags'] = {}

print (f'Building {build['brand']} with version {build['build']}.{build['sku']}')

with open('bleh.user.js', 'w', encoding='utf-8') as file:
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

    file.write(f'let version = {str(build).replace('True', 'true').replace('False', 'false')};\n')
    file.write('let theme_version;\n\n')

    # VARIABLES ETC.

    with open('build/trans.js', encoding='utf-8') as trans:
        file.write('// build/trans.js\n' + trans.read() + '\n')

    with open('build/tools.js', encoding='utf-8') as tools:
        file.write('\n// build/tools.js\n' + tools.read() + '\n')

    with open('build/log.js', encoding='utf-8') as log:
        file.write('\n// build/log.js\n' + log.read() + '\n')

    with open('build/config.js', encoding='utf-8') as config:
        file.write('\n// build/config.js\n' + config.read() + '\n')

    with open('build/page.js', encoding='utf-8') as page:
        file.write('\n// build/page.js\n' + page.read() + '\n')

    with open('build/music.js', encoding='utf-8') as music:
        file.write('\n// build/music.js\n' + music.read() + '\n')

    with open('build/seasonal.js', encoding='utf-8') as seasonal:
        file.write('\n// build/seasonal.js\n' + seasonal.read() + '\n\n\n')

    with open('build/sponsor.js', encoding='utf-8') as sponsor:
        file.write('// build/sponsor.js\n' + sponsor.read() + '\n')

    # LOOP
    file.write("(function() {\n'use strict';")

    for filename in os.listdir('src'):
        f = os.path.join('src', filename)

        if (os.path.isfile(f)):
            with open(f, encoding='utf-8') as file_contents:
                file.write(f'\n// src/{filename}\n' + file_contents.read() + '\n')

    for filename in os.listdir('src/pages'):
        f = os.path.join('src/pages', filename)

        if (os.path.isfile(f)):
            with open(f, encoding='utf-8') as file_contents:
                file.write(f'\n// [PAGE] src/pages/{filename}\n' + file_contents.read() + '\n')

    for filename in os.listdir('src/components'):
        f = os.path.join('src/components', filename)

        if (os.path.isfile(f)):
            with open(f, encoding='utf-8') as file_contents:
                file.write(f'\n// [COMPONENT] src/components/{filename}\n' + file_contents.read() + '\n')

    # END
    file.write('})();')

print('Built successfully!')
os.system('notepad bleh.user.js')