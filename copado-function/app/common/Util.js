'use strict';
const fs = require('node:fs');
const execSync = require('node:child_process').execSync;

const TYPES = require('../types/mcdev-copado.d');
const _Log = require('./Log');
let CONFIG;
let Log;
/**
 * helper class
 */
class Util {
    /**
     *
     * @param {object} _CONFIG central configuration
     */
    constructor(_CONFIG) {
        CONFIG = _CONFIG;
        Log = new _Log(CONFIG);
    }
    /**
     * After components have been retrieved,
     * find all retrieved components and build a json containing as much
     * metadata as possible.
     *
     * @param {string} localPath filename & path to where we store the final json for copado
     * @param {object} jsObj path where downloaded files are
     * @param {boolean} [beautify] when false, json is a 1-liner; when true, proper formatting is applied
     * @returns {void}
     */
    saveJsonFile(localPath, jsObj, beautify) {
        const jsonString = beautify ? JSON.stringify(jsObj, null, 4) : JSON.stringify(jsObj);
        fs.writeFileSync(localPath, jsonString, 'utf8');
    }
    /**
     * Pushes after a successfull deployment
     *
     * @param {string} destinationBranch name of branch to push to
     * @returns {void}
     */
    push(destinationBranch) {
        this.execCommand(
            `Pushing updates to ${destinationBranch} branch`,
            ['git push origin "' + destinationBranch + '"'],
            'Completed pushing branch'
        );
    }
    /**
     * Execute command
     *
     * @param {string} [preMsg] the message displayed to the user in copado before execution
     * @param {string|string[]} command the cli command to execute synchronously
     * @param {string} [postMsg] the message displayed to the user in copado after execution
     * @returns {void}
     */
    execCommand(preMsg, command, postMsg) {
        if (null != preMsg) {
            Log.progress(preMsg);
        }
        if (command && Array.isArray(command)) {
            command = command.join(' && ');
        }
        Log.debug('⚡ ' + command);

        try {
            execSync(command, { stdio: [0, 1, 2], stderr: 'inherit' });
        } catch (ex) {
            // do not use Log.error here to prevent our copado-function from auto-failing right here
            Log.info(ex.status + ': ' + ex.message);
            throw new Error(ex);
        }

        if (null != postMsg) {
            Log.debug('✔️  ' + postMsg);
        }
    }

    /**
     * Execute command but return the exit code
     *
     * @param {string} [preMsg] the message displayed to the user in copado before execution
     * @param {string|string[]} command the cli command to execute synchronously
     * @param {string} [postMsg] the message displayed to the user in copado after execution
     * @returns {number} exit code
     */
    execCommandReturnStatus(preMsg, command, postMsg) {
        if (null != preMsg) {
            Log.progress(preMsg);
        }
        if (command && Array.isArray(command)) {
            command = command.join(' && ');
        }
        Log.debug('⚡ ' + command);

        let exitCode = null;
        try {
            execSync(command, { stdio: [0, 1, 2], stderr: 'inherit' });

            // Seems command finished successfully, so change exit code from null to 0
            exitCode = 0;
        } catch (ex) {
            Log.warn('❌  ' + ex.status + ': ' + ex.message);

            // The command failed, take the exit code from the error
            exitCode = ex.status;
            return exitCode;
        }

        if (null != postMsg) {
            Log.progress('✔️  ' + postMsg);
        }

        return exitCode;
    }

    /**
     * Installs MC Dev Tools and prints the version number
     * TODO: This will later be moved into an according Docker container.
     *
     * @returns {void}
     */
    provideMCDevTools() {
        if (fs.existsSync('package.json')) {
            Log.debug('package.json found, assuming npm was already initialized');
        } else {
            this.execCommand('Initializing npm', ['npm init -y'], 'Completed initializing NPM');
        }
        let installer;
        if (!CONFIG.installMcdevLocally) {
            this.execCommand(
                `Initializing Accenture SFMC DevTools (packaged version)`,
                [
                    `npm link mcdev --no-audit --no-fund --ignore-scripts --omit=dev --omit=peer --omit=optional`,
                    'mcdev --version',
                ],
                'Completed installing Accenture SFMC DevTools'
            );
            return; // we're done here
        } else if (CONFIG.mcdevVersion.charAt(0) === '#') {
            // assume branch of mcdev's git repo shall be loaded

            installer = `accenture/sfmc-devtools${CONFIG.mcdevVersion}`;
        } else if (!CONFIG.mcdevVersion) {
            Log.error('Please specify mcdev_version in pipeline & environment settings');
            throw new Error('Please specify mcdev_version in pipeline & environment settings');
        } else {
            // default, install via npm at specified version
            installer = `mcdev@${CONFIG.mcdevVersion}`;
        }
        this.execCommand(
            `Initializing Accenture SFMC DevTools (${installer})`,
            [`npm install ${installer}`, 'node ./node_modules/mcdev/lib/cli.js --version'],
            'Completed installing Accenture SFMC DevTools'
        );
    }
    /**
     * creates credentials file .mcdev-auth.json based on provided credentials
     *
     * @param {object} credentials contains source and target credentials
     * @returns {void}
     */
    provideMCDevCredentials(credentials) {
        Log.info('Provide authentication');
        this.saveJsonFile('.mcdev-auth.json', credentials, true);

        // The following command fails for an unknown reason.
        // As workaround, provide directly the authentication file. This is also faster.
        // this.execCommand("Initializing MC project with credential name " + credentialName + " for tenant " + tenant,
        //            "cd /tmp && " + mcdev + " init --y.credentialsName " + credentialName + " --y.clientId " + clientId + " --y.clientSecret " + clientSecret + " --y.tenant " + tenant + " --y.gitRemoteUrl " + remoteUrl,
        //            "Completed initializing MC project");
    }
    /**
     * helper that takes care of converting all environment variabels found in config to a proper key-based format
     *
     * @param {object[]} properties directly from config
     * @returns {Object.<string, string>} properties converted into normal json
     */
    convertSourceProperties(properties) {
        const response = {};
        for (const item of properties) {
            response[item.copado__API_Name__c] = item.copado__Value__c;
        }
        return response;
    }
    /**
     * helper that takes care of converting all environment variabels found in config to a proper key-based format
     *
     * @param {object} envVariables directly from config
     * @returns {void}
     */
    convertEnvVariables(envVariables) {
        Object.keys(envVariables).map((key) => {
            if (key.endsWith('Children')) {
                envVariables[key] = this._convertEnvChildVars(envVariables[key]);
            } else {
                envVariables[key] = this._convertEnvVars(envVariables[key]);
            }
        });
    }
    /**
     * helper that converts the copado-internal format for "environment variables" into an object
     *
     * @param {TYPES.EnvVar[]} envVarArr -
     * @returns {Object.<string,string>} proper object
     */
    _convertEnvVars(envVarArr) {
        if (!envVarArr) {
            return envVarArr;
        }
        if (typeof envVarArr === 'string') {
            envVarArr = JSON.parse(envVarArr);
        }
        const response = {};
        for (const item of envVarArr) {
            response[item.name] = item.value;
        }
        return response;
    }
    /**
     * helper that converts the copado-internal format for "environment variables" into an object
     *
     * @param {TYPES.EnvChildVar[]} envChildVarArr -
     * @returns {Object.<string,string>} proper object
     */
    _convertEnvChildVars(envChildVarArr) {
        if (!envChildVarArr) {
            return envChildVarArr;
        }
        if (typeof envChildVarArr === 'string') {
            envChildVarArr = JSON.parse(envChildVarArr);
        }
        const response = {};
        for (const item of envChildVarArr) {
            response[item.id] = this._convertEnvVars(item.environmentVariables);
        }
        return response;
    }
    /**
     * Determines the retrieve folder from MC Dev configuration (.mcdev.json)
     *
     * @param {string} credName -
     * @param {string} mid -
     * @returns {string} retrieve folder
     */
    getBuName(credName, mid) {
        let credBuName;
        if (!credName) {
            throw new Error('System Property "credentialName" not set');
        }
        if (!mid) {
            throw new Error('System Property "mid" not set');
        }
        if (!fs.existsSync(CONFIG.configFilePath)) {
            throw new Error('Could not find config file ' + CONFIG.configFilePath);
        }
        const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, 'utf8'));

        if (config.credentials[credName] && config.credentials[credName].businessUnits) {
            const myBuNameArr = Object.keys(config.credentials[credName].businessUnits).filter(
                (buName) => config.credentials[credName].businessUnits[buName] == mid
            );
            if (myBuNameArr.length === 1) {
                Log.debug('BU Name is: ' + credName + '/' + myBuNameArr[0]);
                credBuName = credName + '/' + myBuNameArr[0];
            } else {
                throw new Error(`MID ${mid} not found for ${credName}`);
            }
        }
        return credBuName;
    }
}

module.exports = Util;
