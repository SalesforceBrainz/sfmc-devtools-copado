/* eslint-disable unicorn/prefer-top-level-await */
'use strict';

const esbuild = require('esbuild');
const packageJson = require('../../package.json');
const eslintrc = require('./.eslintrc.json');
const path = require('node:path');
const { esbuildPluginVersionInjector } = require('esbuild-plugin-version-injector');
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

(async () => {
    // console.log(process.cwd());
    // console.log(path.resolve(__dirname));
    let result;
    const ecmaVersion = 'es' + eslintrc.parserOptions.ecmaVersion;
    const nodeVersion = 'node' + packageJson.engines.node.replace('>=', '');
    const peerDependencies = Object.keys(packageJson.peerDependencies).map(
        (name) => name + '@' + packageJson.peerDependencies[name]
    );
    const copadoDependencies = Object.keys(packageJson.copadoDependencies).map(
        (name) => name + '@' + packageJson.copadoDependencies[name]
    );
    peerDependencies.push(...copadoDependencies);
    const absWorkingDir = path.resolve(__dirname);
    for (const entryPoint of ['Retrieve.fn.js', 'Commit.fn.js', 'Deploy.fn.js', 'Init.fn.js']) {
        try {
            result = await esbuild.build({
                entryPoints: [entryPoint],
                bundle: true,
                banner: {
                    js:
                        `\n/*\n * ${packageJson.name} v${
                            packageJson.version
                        } (built ${new Date().toISOString()})\n` +
                        ` * Function: ${entryPoint}\n` +
                        ` * Dependenies: ${peerDependencies.join(', ')}\n` +
                        ` * Homepage: ${packageJson.homepage}\n` +
                        ` * Support: ${packageJson.bugs.url}\n` +
                        ` * Git-Repository: ${packageJson.repository.url}\n` +
                        ` * Copyright (c) 2022 Accenture. ${packageJson.license} licensed\n` +
                        '*/\n\n',
                },
                platform: 'node',
                external: ['../tmp/*', '../../node_modules/*'],
                preserveSymlinks: true,
                outdir: '../dist',
                absWorkingDir: absWorkingDir,
                metafile: true,
                plugins: [esbuildPluginVersionInjector()],
                target: [ecmaVersion, nodeVersion],
                watch: isWatch ? { onRebuild } : false,
            });
        } catch (ex) {
            console.error('Build failed:', ex.message); // eslint-disable-line no-console
            process.exitCode = 1;
        }
        try {
            const analyzeText = await esbuild.analyzeMetafile(result.metafile);
            console.log(analyzeText); // eslint-disable-line no-console
        } catch (ex) {
            console.warn('Analyze failed:', ex.message); // eslint-disable-line no-console
        }
    }
})();

/**
 *
 * @param {object} error ?
 * @param {object} result ?
 */
function onRebuild(error, result) {
    if (error) {
        console.error('watch build failed:', error); // eslint-disable-line no-console
    } else {
        try {
            esbuild.analyzeMetafile(result.metafile).then((analyzeText) => {
                console.log(analyzeText); // eslint-disable-line no-console
            });
        } catch (ex) {
            console.warn('Analyze failed:', ex.message); // eslint-disable-line no-console
        }
    }
}
