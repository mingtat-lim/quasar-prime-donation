#!/bin/sh

# https://rollupjs.org/troubleshooting/#warning-treating-module-as-external-dependency

# Workaround: remove "type": "module" so node does not complain about require in cjs
cat package.json | jq 'del(.type)' --tab > /tmp/package.json && mv /tmp/package.json package.json

npx rollup --config
# sed -i '' -e "s|'u' \+ 'rl'|'url'|g" ./build/cjs/api-helper-v2-bundle.cjs

# Remove workaround, set package type back to module
# git checkout package.json 
cat package.json | jq --arg type module '. + {type: $type}' --tab > /tmp/package.json && mv /tmp/package.json package.json