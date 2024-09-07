import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'dist/index.js',
    output: {
        file: 'dist/cjs/index-bundle.cjs',
        // dir: 'dist/cjs',
        format: 'cjs',
    },
    plugins: [
        nodeResolve(),
        commonjs({
            dynamicRequireTargets: [
                // include using a glob pattern (either a string or an array of strings)
                'node_modules/selenium-webdriver/lib/atoms/*.js',

                // exclude files that are known to not be required dynamically, this allows for better optimizations
                //   '!node_modules/logform/index.js',
                //   '!node_modules/logform/format.js',
                //   '!node_modules/logform/levels.js',
                //   '!node_modules/logform/browser.js'
            ],
        }),
        json(),
    ],
};
