#!/usr/bin/env node
'use strict';

const resolve = require('node:path').resolve;
const TYPE = require('./types/mcdev-copado.d');
const CONFIG = require('./common/Config');
const Log = require('./common/Log');
const Util = require('./common/Util');
const Copado = require('./common/Copado');
const Commit = require('./common/Commit');

// ++++ CONFIG ++++
CONFIG.mcdevCopadoVersion = '[VI]{{inject}}[/VI]';
// credentials
CONFIG.credentialNameSource = process.env.credentialNameSource;
CONFIG.credentialNameTarget = null;
CONFIG.credentials = process.env.credentials;
// generic
CONFIG.configFilePath = '.mcdevrc.json';
CONFIG.debug = process.env.debug === 'true' ? true : false;
CONFIG.installMcdevLocally = process.env.installMcdevLocally === 'true' ? true : false;
CONFIG.mainBranch = process.env.main_branch;
CONFIG.mcdevVersion = process.env.mcdev_version;
CONFIG.metadataFilePath = 'mcmetadata.json'; // do not change - LWC depends on it!
CONFIG.source_mid = process.env.source_mid;
CONFIG.tmpDirectory = '../tmp';
// retrieve
CONFIG.source_sfid = null;
// commit
CONFIG.commitMessage = process.env.commit_message;
CONFIG.featureBranch = process.env.feature_branch;
CONFIG.fileSelectionSalesforceId = process.env.metadata_file;
CONFIG.fileSelectionFileName = 'Copado Commit changes'; // do not change - defined by Copado Managed Package!
CONFIG.recreateFeatureBranch = process.env.recreateFeatureBranch === 'true' ? true : false;
// deploy
CONFIG.envVariables = {
    source: null,
    sourceChildren: null,
    destination: null,
    destinationChildren: null,
};
CONFIG.deltaPackageLog = null;
CONFIG.destinationBranch = null; // The target branch of a PR, like master. This commit will be lastly checked out
CONFIG.fileUpdatedSelectionSfid = null;
CONFIG.git_depth = null; // set a default git depth of 100 commits
CONFIG.merge_strategy = null; // set default merge strategy
CONFIG.promotionBranch = null; // The promotion branch of a PR
CONFIG.promotionName = null; // The promotion name of a PR
CONFIG.target_mid = null;

/**
 * main method that combines runs this function
 *
 * @returns {void}
 */
async function run() {
    Log.info('Commit.js started');
    Log.debug('');
    Log.debug('Parameters');
    Log.debug('===================');
    try {
        CONFIG.credentials = JSON.parse(CONFIG.credentials);
    } catch (ex) {
        Log.error('Could not parse credentials');
        throw ex;
    }
    Util.convertEnvVariables(CONFIG.envVariables);
    Log.debug(CONFIG);

    // ensure we got SFMC credentials for our source BU
    if (!CONFIG.credentials[CONFIG.credentialNameSource]) {
        Log.error(`No credentials found for source (${CONFIG.credentialNameSource})`);
        throw new Error(`No source credentials`);
    }

    Log.debug('Environment');
    Log.debug('===================');
    if (CONFIG.debug) {
        Util.execCommand(null, 'npm --version', null);
        Util.execCommand(null, 'node --version', null);
        Util.execCommand(null, 'git version', null);
        Util.execCommand(null, 'mcdev --version', null);
    }

    Log.debug(`Change Working directory to: ${CONFIG.tmpDirectory}`);
    // prevent git errors down the road
    try {
        Util.execCommand(null, ['git config --global --add safe.directory /tmp']);
    } catch {
        try {
            Util.execCommand(null, [
                'git config --global --add safe.directory ' + resolve(CONFIG.tmpDirectory),
            ]);
        } catch {
            Log.error('Could not set tmp directoy as safe directory');
        }
    }
    // actually change working directory
    process.chdir(CONFIG.tmpDirectory);
    Log.debug(process.cwd());

    Log.info('');
    Log.info('Clone repository');
    Log.info('===================');
    Log.info('');

    try {
        Copado.checkoutSrc(CONFIG.mainBranch);

        try {
            if (CONFIG.recreateFeatureBranch) {
                Copado.deleteBranch(CONFIG.featureBranch);
            }
        } catch (ex) {
            Log.warn('Delete feature branch failed:' + ex.message);
        }

        Copado.checkoutSrc(CONFIG.featureBranch, true);
    } catch (ex) {
        Log.error('Checkout to feature and/or master branch failed:' + ex.message);
        throw ex;
    }
    /**
     * @type {TYPE.CommitSelection[]}
     */
    let commitSelectionArr;
    try {
        Log.info('');
        Log.info(
            `Add selected components defined in ${CONFIG.fileSelectionSalesforceId} to metadata JSON`
        );
        Log.info('===================');
        Log.info('');
        commitSelectionArr = Copado.getJsonFile(
            CONFIG.fileSelectionSalesforceId,
            CONFIG.fileSelectionFileName,
            'Retrieving list of selected items'
        );
        if (!Array.isArray(commitSelectionArr) || commitSelectionArr.length === 0) {
            throw new Error(
                'Copado has not registered any files selected for commit. Please go back and select at least one item in the Commit page.'
            );
        }
    } catch (ex) {
        Log.error('Getting Commit-selection file failed:' + ex.message);
        throw ex;
    }

    try {
        Log.info('');
        Log.info('Preparing');
        Log.info('===================');
        Log.info('');
        Util.provideMCDevTools();
        Util.provideMCDevCredentials(CONFIG.credentials);
    } catch (ex) {
        Log.error('initializing failed: ' + ex.message);
        throw ex;
    }

    let sourceBU;
    let gitAddArr;
    try {
        Log.info('');
        Log.info('Get source BU');
        Log.info('===================');
        Log.info('');
        sourceBU = Util.getBuName(CONFIG.credentialNameSource, CONFIG.source_mid);
    } catch (ex) {
        Log.error('Getting Source BU failed: ' + ex.message);
        throw ex;
    }

    try {
        Log.info('');
        Log.info('Retrieve components');
        Log.info('===================');
        Log.info('');
        gitAddArr = await Commit.retrieveCommitSelection(sourceBU, commitSelectionArr);
    } catch (ex) {
        Log.error('Retrieving failed: ' + ex.message);
        Copado.uploadToolLogs();
        throw ex;
    }

    try {
        Log.info('');
        Log.info('Add components in metadata JSON to Git history');
        Log.info('===================');
        Log.info('');
        Commit.addSelectedComponents(gitAddArr);
    } catch (ex) {
        Log.error('git add failed:' + ex.message);
        Copado.uploadToolLogs();
        throw ex;
    }
    try {
        Log.info('');
        Log.info('Commit');
        Log.info('===================');
        Log.info('');
        Commit.commit(gitAddArr);
        Log.info('Push');
        Log.info('===================');
        Util.push(CONFIG.featureBranch);
    } catch (ex) {
        Log.error('git commit / push failed:' + ex.message);
        Copado.uploadToolLogs();
        throw ex;
    }
    Log.info('');
    Log.info('===================');
    Log.info('');
    Log.info('Commit.js done');

    Copado.uploadToolLogs();
}

run(); // eslint-disable-line unicorn/prefer-top-level-await
