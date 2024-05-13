#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const execSync = require('node:child_process').execSync;
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
CONFIG.credentialNameTarget = process.env.credentialNameTarget;
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
CONFIG.commitMessage = null;
CONFIG.featureBranch = null;
CONFIG.recreateFeatureBranch = null;
// deploy
CONFIG.envVariables = {
    source: process.env.envVariablesSource,
    sourceChildren: process.env.envVariablesSourceChildren,
    destination: process.env.envVariablesDestination,
    destinationChildren: process.env.envVariablesDestinationChildren,
};
CONFIG.deltaPackageLog = 'docs/deltaPackage/delta_package.md'; // !works only after changing the working directory!
CONFIG.destinationBranch = process.env.toBranch; // The target branch of a PR, like master. This commit will be lastly checked out
CONFIG.fileSelectionFileName = 'Copado Deploy changes'; // do not change - defined by Copado Managed Package!
CONFIG.fileSelectionSalesforceId = process.env.metadata_file;
CONFIG.fileUpdatedSelectionSfid = null;
CONFIG.git_depth = 100; // set a default git depth of 100 commits
CONFIG.merge_strategy = process.env.merge_strategy; // set default merge strategy
CONFIG.promotionBranch = process.env.promotionBranch; // The promotion branch of a PR
CONFIG.promotionName = process.env.promotionName; // The promotion name of a PR
CONFIG.target_mid = process.env.target_mid;
CONFIG.sourceProperties = process.env.sourceProperties;
CONFIG.deployNTimes = process.env.deployNTimes === 'true' ? true : false;

/**
 * main method that combines runs this function
 *
 * @returns {void}
 */
async function run() {
    Log.info('Deploy.js started');
    Log.debug('');
    Log.debug('Parameters');
    Log.debug('===================');
    try {
        CONFIG.credentials = JSON.parse(CONFIG.credentials);
    } catch (ex) {
        Log.error('Could not parse credentials');
        throw ex;
    }
    try {
        CONFIG.sourceProperties = JSON.parse(CONFIG.sourceProperties);
    } catch (ex) {
        Log.error('Could not parse sourceProperties');
        throw ex;
    }
    Util.convertEnvVariables(CONFIG.envVariables);
    CONFIG.sourceProperties = Util.convertSourceProperties(CONFIG.sourceProperties);
    CONFIG.source_mid = CONFIG.sourceProperties.mid;
    CONFIG.credentialNameSource = CONFIG.sourceProperties.credential_name;
    Log.debug(CONFIG);

    // ensure we got SFMC credentials for our source BU
    if (!CONFIG.credentials[CONFIG.credentialNameSource]) {
        Log.error(`No credentials found for source (${CONFIG.credentialNameSource})`);
        throw new Error(`No source credentials`);
    }

    // ensure we got SFMC credentials for our target BU
    if (!CONFIG.credentials[CONFIG.credentialNameTarget]) {
        Log.error(`No credentials found for target (${CONFIG.credentialNameTarget})`);
        throw new Error(`No target credentials`);
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
    try {
        Log.info('');
        Log.info('Clone repository');
        Log.info('===================');
        Log.info('');
        // test if source branch (promotion branch) exists (otherwise this would cause an error)
        Copado.checkoutSrc(CONFIG.promotionBranch);
        // checkout destination branch
        Copado.checkoutSrc(CONFIG.mainBranch);
    } catch (ex) {
        Log.error('Cloning failed:' + ex.message);
        throw ex;
    }

    try {
        Log.info('');
        Log.info('Merge branch');
        Log.info('===================');
        Log.info('');
        Deploy.merge(CONFIG.promotionBranch, CONFIG.mainBranch);
    } catch (ex) {
        // if confict with other deployment this would have failed
        Log.error('Merge failed: ' + ex.message);
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
                'Copado has not registered any files ready for deployment. Please check if you committed all files.'
            );
        }
    } catch (ex) {
        Log.error('Getting Deploy-selection file failed:' + ex.message);
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

    let deployFolder;
    try {
        Log.info('');
        Log.info('Determine deploy folder');
        Log.info('===================');
        Log.info('');
        deployFolder = Deploy.getDeployFolder();
    } catch (ex) {
        Log.error('getDeployFolder failed: ' + ex.message);
        throw ex;
    }
    let sourceBU;
    let targetBU;

    try {
        Log.info('');
        Log.info('Create delta package');
        Log.info('===================');
        Log.info('');
        sourceBU = Util.getBuName(CONFIG.credentialNameSource, CONFIG.source_mid);
        targetBU = Util.getBuName(CONFIG.credentialNameTarget, CONFIG.target_mid);
    } catch (ex) {
        Log.error('Getting Source / Target BU failed: ' + ex.message);
        throw ex;
    }
    try {
        Deploy.updateMarketLists(sourceBU, targetBU, CONFIG.envVariables);
    } catch (ex) {
        Log.error('Updateing Market List failed: ' + ex.message);
        throw ex;
    }

    try {
        if (
            await Deploy.createDeltaPackage(
                deployFolder,
                commitSelectionArr,
                sourceBU.split('/')[1]
            )
        ) {
            Log.info('Deploy BUs');
            Log.info('===================');
            const deployResult = await Deploy.deployBU(targetBU);

            // do what Deploy.createDeltaPackage did: apply templating to deploy definitions
            commitSelectionArr = Deploy.replaceMarketValues(commitSelectionArr);
            // do what Deploy.deployBU did: auto-replace asset keys if needed
            Deploy.replaceAssetKeys(targetBU, commitSelectionArr, deployResult);
        } else {
            throw new Error('No changes found. Nothing to deploy');
        }
    } catch (ex) {
        Log.error('Deploy failed: ' + ex.message);
        Copado.uploadToolLogs();
        throw ex;
    }

    // Retrieve what was deployed to target
    // and commit it to the repo as a backup
    let gitDiffArr;
    let verificationText;
    try {
        gitDiffArr = await Deploy.retrieveAndCommit(targetBU, commitSelectionArr);
    } catch (ex) {
        verificationText =
            'Failed deploy verification, check BU on SFMC to verify manually. Git not updated with the changes on target BU';
        Log.warn(verificationText + ': ' + ex.message);
        gitDiffArr = [];
    }

    // trying to push
    let success = false;
    let i = 0;
    do {
        i++;
        try {
            Log.info('git-push changes');
            Log.info('===================');
            Util.push(CONFIG.mainBranch);
            success = true;
        } catch (ex) {
            if (ex.message === `Error: Command failed: git push origin "${CONFIG.mainBranch}"`) {
                Log.progress('Merging changes from parallel deployments');
                Util.execCommand(null, ['git fetch origin "' + CONFIG.mainBranch + '"'], null);
                Util.execCommand(null, ['git reset --hard origin/' + CONFIG.mainBranch], null);
                Util.execCommand(null, ['git merge "' + CONFIG.promotionBranch + '"'], null);
            }
        }
    } while (!success && i <= 50);
    Log.info('');
    Log.info('===================');
    Log.info('');
    Log.info('Deploy.js done');
    Log.result(
        gitDiffArr,
        `Deployed ${gitDiffArr.filter((item) => item.endsWith('.json')).length} items with ${
            gitDiffArr.length
        } files` + (verificationText ? ` (${verificationText})` : '')
    );

    Copado.uploadToolLogs();
}

/**
 * handles downloading metadata
 */
class Deploy {
    /**
     * used to ensure our working directory is clean before checking out branches
     */
    static stashChanges() {
        Util.execCommand(null, [`git stash`], null);
    }
    /**
     * retrieve the new values into the targets folder so it can be commited later.
     *
     * @param {string} targetBU buname of source BU
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of committed components based on user selection
     * @returns {string[]} gitDiffArr
     */
    static async retrieveAndCommit(targetBU, commitSelectionArr) {
        let gitAddArr;
        let gitDiffArr = [];
        try {
            Log.info(
                `Stashing changes made by mcdev.deploy() to avoid issues during branch checkout`
            );
            Deploy.stashChanges();
            Log.info('Switch to source branch to add updates for target');
            Copado.checkoutSrc(CONFIG.promotionBranch);
        } catch (ex) {
            Log.error('Switching failed:' + ex.message);
            throw ex;
        }

        try {
            Log.info('');
            Log.info('Retrieve components');
            Log.info('===================');
            Log.info('');
            gitAddArr = await Commit.retrieveCommitSelection(targetBU, commitSelectionArr);
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
            throw ex;
        }
        try {
            Log.info('');
            Log.info('Commit');
            Log.info('===================');
            Log.info('');

            const commitMsgLines = Deploy.getCommitMessage(targetBU, commitSelectionArr);
            // execute commit
            gitDiffArr = Deploy.commit(commitMsgLines);
        } catch (ex) {
            Log.error('git commit failed:' + ex.message);
            throw ex;
        }
        try {
            Log.info('Switch back to main branch to allow merging promotion branch into it');
            Copado.checkoutSrc(CONFIG.mainBranch);
        } catch (ex) {
            Log.error('Switching failed:' + ex.message);
            throw ex;
        }
        try {
            Log.info('Merge promotion into main branch');
            Deploy.merge(CONFIG.promotionBranch, CONFIG.mainBranch);
        } catch (ex) {
            // would fail if conflicting with other deployments
            Log.error('Merge failed: ' + ex.message);
            throw ex;
        }
        return gitDiffArr;
    }
    /**
     * Commits after adding selected components
     *
     * @param {string[]} [commitMsgLines] paragraphs of commit message
     * @returns {string[]} gitDiffArr
     */
    static commit(commitMsgLines) {
        // If the following command returns some output,
        // git commit must be executed. Otherwise there
        // are no differences between the components retrieved
        // from the org and selected by the user
        // and what is already in Git, so commit and push
        // can be skipped.
        const gitDiffArr = execSync('git diff --staged --name-only')
            .toString()
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => !!item);
        Log.debug('Git diff ended with the result:');
        Log.debug(gitDiffArr);
        if (Array.isArray(gitDiffArr) && gitDiffArr.length) {
            if (!Array.isArray(commitMsgLines)) {
                commitMsgLines = [CONFIG.commitMessage];
            }
            const commitMsgParam = commitMsgLines.map((line) => '-m "' + line + '"').join(' ');
            Util.execCommand(
                'Committing changes',
                ['git commit -n ' + commitMsgParam],
                'Completed committing'
            );
            Log.progress('Commit of target BU files completed');
        } else {
            Log.error(
                'Nothing to commit as all selected components have the same content as already exists in Git.',
                'Nothing to commit'
            );
            throw new Error('Nothing to commit');
        }
        return gitDiffArr;
    }

    /**
     * helper for Deploy.retrieveAndCommit that creates a multi-line commit msg
     *
     * @param {string} targetBU name of BU we deployed to incl. credential name
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of committed components based on user selection
     * @returns {string[]} commitMsgLines
     */
    static getCommitMessage(targetBU, commitSelectionArr) {
        const userStoryNames = [
            ...new Set(commitSelectionArr.map((item) => item.u).filter(Boolean)),
        ].sort();
        const commitMsgLines = [
            CONFIG.promotionName + ': ' + userStoryNames.join(', '),
            `Updated BU "${targetBU}" (${CONFIG.target_mid})`,
        ];
        return commitMsgLines;
    }

    /**
     * convert CommitSelection[] to DeltaPkgItem[]
     *
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of committed components based on user selection
     * @param {string} sourceBU buname of source BU
     * @returns {TYPE.DeltaPkgItem[]} format required by mcdev.createDeltaPkg
     */
    static _convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU) {
        return commitSelectionArr.map(
            (item) =>
                /** @type {TYPE.DeltaPkgItem} */ ({
                    type: item.t.split('-')[0],
                    name: item.n,
                    externalKey: JSON.parse(item.j).newKey || JSON.parse(item.j).key,
                    gitAction: 'add/update',
                    _credential: CONFIG.credentialNameSource,
                    _businessUnit: sourceBU,
                })
        );
    }
    /**
     * Determines the deploy folder from MC Dev configuration (.mcdev.json)
     *
     * @returns {string} deploy folder
     */
    static getDeployFolder() {
        if (!fs.existsSync(CONFIG.configFilePath)) {
            throw new Error('Could not find config file ' + CONFIG.configFilePath);
        }
        const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, 'utf8'));
        const folder = config?.directories?.deploy;
        if (!folder) {
            throw new Error('Could not find config.directories.deploy in ' + CONFIG.configFilePath);
        }

        Log.debug('Deploy folder is: ' + folder);
        return folder;
    }
    /**
     *
     * @param {string} sourceBU cred/buname of source BU
     * @param {string} targetBU cred/buname of target BU
     * @param {object} marketVariables straight from the (converted) environment variables
     * @returns {void}
     */
    static updateMarketLists(sourceBU, targetBU, marketVariables) {
        const deploySourceList = 'deployment-source';
        const deployTargetList = 'deployment-target';
        const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, 'utf8'));
        // ensure the system knows what we name our market lists for deployment
        config.options.deployment.sourceTargetMapping = {};
        config.options.deployment.sourceTargetMapping[deploySourceList] = deployTargetList;

        // set up corresponding markets and remove other entries
        config.markets = {};

        if (CONFIG.deployNTimes) {
            // add market for source child BU
            if (Object.keys(CONFIG.envVariables.sourceChildren).length !== 1) {
                throw new Error(
                    'Expected exactly one source child BU when "deployNTimes" is active in pipeline but found ' +
                        Object.keys(CONFIG.envVariables.sourceChildren).length
                );
            }
            for (const childSfid in CONFIG.envVariables.sourceChildren) {
                config.markets[childSfid] = CONFIG.envVariables.sourceChildren[childSfid];
            }
            // add markets for target child BUs
            for (const childSfid in CONFIG.envVariables.destinationChildren) {
                config.markets[childSfid] = CONFIG.envVariables.destinationChildren[childSfid];
            }
        } else {
            config.markets['source'] = marketVariables.source;
            config.markets['target'] = marketVariables.destination;
        }

        // remove potentially existing entries and ensure these 2 lists exist
        config.marketList = {};
        for (const listName of [deploySourceList, deployTargetList]) {
            config.marketList[listName] = {};
        }
        // add marketList entries for the 2 bu-market combos
        if (CONFIG.deployNTimes) {
            // add list of markets variables for the child BUs to the target BU to deploy components more than once to the same BU
            // needs to be a string, not array of string for the source BU
            config.marketList[deploySourceList][sourceBU] = Object.keys(
                CONFIG.envVariables.sourceChildren
            )[0];
            // can be array of strings or string for the target BU
            config.marketList[deployTargetList][targetBU] = Object.keys(
                CONFIG.envVariables.destinationChildren
            );
        } else {
            // standard 1:1 deployment
            config.marketList[deploySourceList][sourceBU] = 'source';
            config.marketList[deployTargetList][targetBU] = 'target';
        }

        Log.debug('config.options.deployment.sourceTargetMapping');
        Log.debug(config.options.deployment.sourceTargetMapping);
        Log.debug('config.markets');
        Log.debug(config.markets);
        Log.debug('config.marketList');
        Log.debug(JSON.stringify(config.marketList));
        // * override config in git repo
        try {
            fs.renameSync(CONFIG.configFilePath, CONFIG.configFilePath + '.BAK');
            Util.saveJsonFile(CONFIG.configFilePath, config, 'utf8');
        } catch (ex) {
            Log.error('Updating updateMarketLists failed: ' + ex.message);
            throw ex;
        }
    }
    /**
     * Create the delta package containing the changed components
     * return whether the delta package is empty or not
     *
     * @param {string} deployFolder path
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of committed components based on user selection
     * @param {string} sourceBU buname of source BU
     * @returns {Promise.<boolean>} true: files found, false: not
     */
    static async createDeltaPackage(deployFolder, commitSelectionArr, sourceBU) {
        const mcdev = require('../tmp/node_modules/mcdev/lib');
        // ensure wizard is not started
        mcdev.setSkipInteraction(true);

        const versionRange = null;
        let deltaPkgItems = null;
        if (Array.isArray(commitSelectionArr) && commitSelectionArr.length) {
            deltaPkgItems = this._convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU);
            Log.info(`Found ${deltaPkgItems.length} changed components in commits`);
            Log.debug('DeltaPkgItems: ');
            Log.debug(deltaPkgItems);
        } else {
            Log.info('No changed components found in commits');
            // versionRange = 'HEAD^..HEAD';
            // Log.debug('Create delta package using version range ' + versionRange);
        }
        const deltaPackageLog = await mcdev.createDeltaPkg({
            range: versionRange,
            diffArr: deltaPkgItems,
        });
        Log.debug('deltaPackageLog: ' + JSON.stringify(deltaPackageLog));
        if (!deltaPackageLog?.length) {
            Log.error('No changes found for deployment');
            return false;
        } else {
            Log.debug('deltaPackageLog:');
            Log.debug(deltaPackageLog);
        }

        Log.debug('Completed creating delta package');
        if (fs.existsSync(CONFIG.deltaPackageLog)) {
            Copado.attachLog(CONFIG.deltaPackageLog);
        }

        if (fs.existsSync(deployFolder)) {
            const deltaPackageFiles = fs.readdirSync(deployFolder);
            if (null != deltaPackageFiles) {
                Log.debug('Found ' + deltaPackageFiles.length + ' files to deploy');
                if (0 < deltaPackageFiles.length) {
                    return true;
                }
            } else {
                Log.debug('Could not find any files to deploy in folder ' + deployFolder);
            }
        } else {
            Log.debug('Could not find deploy folder ' + deployFolder);
        }
        return false;
    }

    /**
     * Returns the to branch to use when accessing MC Dev configuration
     * The branch is the normal PR to branch, except if the PR is for a release or hotfix.
     * Release- and hotfix branches have a detailed release or hotfix number in the branch name,
     * and rather than using these detailed names the configuration used only 'release' resp. 'hotfix'.
     *
     * @param {string} branch value from copado config
     * @returns {string} configBranch value to look for in config
     */
    static _getConfigForToBranch(branch) {
        let configBranch = branch;
        if (branch.startsWith('release/')) {
            // TODO discuss with Copado!
            configBranch = 'release/*';
        } else if (branch.startsWith('hotfix/')) {
            configBranch = 'hotfix/*';
        }
        Log.debug('Config branch for branch ' + branch + ' is ' + configBranch);
        return configBranch;
    }
    /**
     * Deploys one specific BU.
     * In case of errors, the deployment is not stopped.
     *
     * @param {string} bu name of BU
     * @returns {object} deployResult
     */
    static async deployBU(bu) {
        // * dont use CONFIG.tempDir here to allow proper resolution of required package in VSCode
        const mcdev = require('../tmp/node_modules/mcdev/lib');
        // ensure wizard is not started
        mcdev.setSkipInteraction(true);
        const deployResult = await mcdev.deploy(bu);

        if (process.exitCode === 1) {
            throw new Error(
                'Deployment of BU ' +
                    bu +
                    ' failed. Please check the SFMC DevTools logs for more details.'
            );
        }
        return deployResult;
    }
    /**
     *
     * @param {string} bu name of BU
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of committed components based on user selection
     * @param {object} deployResult result of deployment
     * @returns {void}
     */
    static replaceAssetKeys(bu, commitSelectionArr, deployResult) {
        const commitSelectionArrMap = [];
        for (const i in commitSelectionArr) {
            if (commitSelectionArr[i].t.split('-')[0] === 'asset') {
                const suffix = '-' + CONFIG.target_mid;
                const jObj = JSON.parse(commitSelectionArr[i].j);
                // decide what the new key is; depends on potentially applied templating
                const oldKey = jObj.newKey || jObj.key;
                const newKey =
                    CONFIG.source_mid === CONFIG.target_mid || oldKey.endsWith(suffix)
                        ? oldKey
                        : oldKey.slice(0, Math.max(0, 36 - suffix.length)) + suffix;
                if (deployResult[bu].asset[newKey]) {
                    jObj.newKey = newKey;
                    commitSelectionArr[i].j = JSON.stringify(jObj);
                    commitSelectionArrMap.push(jObj);
                } else {
                    // it didn't create the correct new Key
                    throw new Error(
                        `New key for ${commitSelectionArr[i].n} does not match any valid keys.`
                    );
                }
            }
        }

        // save files to tmp/ folder, allowing us to attach it to SF records
        Util.saveJsonFile(`Copado Deploy changes-${CONFIG.target_mid}.json`, commitSelectionArr);
        // attach to result record
        Copado.attachJson(`Copado Deploy changes-${CONFIG.target_mid}.json`, null, true);
    }
    /**
     * Merge from branch into target branch
     *
     * @param {string} promotionBranch commit id to merge
     * @param {string} currentBranch should be master in most cases
     * @returns {void}
     */
    static merge(promotionBranch, currentBranch) {
        // Merge and commit changes.
        Util.execCommand(
            `Merge ${promotionBranch} into ${currentBranch}`,
            ['git merge "' + promotionBranch + '"'],
            'Completed merging commit'
        );
    }

    /**
     * applies market values of target onto name and key of commitSelectionArr
     *
     * @param {TYPE.CommitSelection[]} commitSelectionArr list of items to be added
     * @returns {void}
     */
    static replaceMarketValues(commitSelectionArr) {
        Log.debug('replacing market values');
        const commitSelectionArrNew = [];
        // prepare market values
        const replaceMapList = [];
        if (CONFIG.deployNTimes) {
            for (const sfid in CONFIG.envVariables.destinationChildren) {
                const replaceMap = {};
                const sourceSfid = Object.keys(CONFIG.envVariables.sourceChildren)[0];
                for (const item in CONFIG.envVariables.sourceChildren[sourceSfid]) {
                    if (
                        typeof CONFIG.envVariables.destinationChildren[sfid][item] !== 'undefined'
                    ) {
                        replaceMap[CONFIG.envVariables.sourceChildren[sourceSfid][item]] =
                            CONFIG.envVariables.destinationChildren[sfid][item];
                    }
                }
                replaceMapList.push(replaceMap);
            }
        } else {
            const replaceMap = {};
            for (const item in CONFIG.envVariables.source) {
                if (typeof CONFIG.envVariables.destination[item] !== 'undefined') {
                    replaceMap[CONFIG.envVariables.source[item]] =
                        CONFIG.envVariables.destination[item];
                }
            }
            replaceMapList.push(replaceMap);
        }
        for (const replaceMap of replaceMapList) {
            const commitSelectionArrClone = JSON.parse(JSON.stringify(commitSelectionArr));
            // replace market values
            for (const item of commitSelectionArrClone) {
                for (const oldValue in replaceMap) {
                    // name
                    item.n = item.n.replace(new RegExp(oldValue, 'g'), replaceMap[oldValue]);
                    // key
                    const jObj = JSON.parse(item.j);
                    jObj.newKey = (jObj.newKey || jObj.key).replace(
                        new RegExp(oldValue, 'g'),
                        replaceMap[oldValue]
                    );
                    item.j = JSON.stringify(jObj);
                }
            }
            commitSelectionArrNew.push(...commitSelectionArrClone);
        }
        return commitSelectionArrNew;
    }
}

run(); // eslint-disable-line unicorn/prefer-top-level-await
