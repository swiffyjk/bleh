# this script is used to build a working bleh.user.js file
# it combines all js in the src directory into one file
# along with reading build.json for build info

import json

build = {}

print('Attempting to read build file to begin')

with open('build.json') as file:
    build = json.load(file)

if build['brand'] is None or build['build'] is None or build['sku'] is None:
    raise Exception('No build supplied, a brand name (brand), version number (build), and sku is required')

if (build['feature_flags'] is None):
    print('Added empty feature flags as none were supplied')
    build['feature_flags'] = {}

print (f'Building {build['brand']} with version {build['build']}.{build['sku']}')