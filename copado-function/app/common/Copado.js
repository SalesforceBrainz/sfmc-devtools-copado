'use strict';
const fs = require('node:fs');
const exec = require('node:child_process').exec;

const TYPE = require('../types/mcdev-copado.d');
const Log = require('./Log');
const Util = require('./Util');

/**
 * methods to handle interaction with the copado platform
 */
class Copado {
    /**
     * Finally, attach the resulting metadata JSON to the source environment
     *
     * @param {string} localPath where we stored the temporary json file
     * @param {string} [parentSfid] record to which we attach the json. defaults to result record if not provided
     * @param {boolean} [async] optional flag to indicate if the upload should be asynchronous
     * @param {string} [preMsg] optional message to display before uploading synchronously
     * @returns {void}
     */
    static attachJson(localPath, parentSfid, async = false, preMsg) {
        Copado._attachFile(localPath, async, parentSfid, preMsg);
    }
    /**
     * Finally, attach the resulting metadata JSON. Always runs asynchronously
     *
     * @param {string} localPath where we stored the temporary json file
     * @returns {Promise.<void>} promise of log upload
     */
    static async attachLog(localPath) {
        Copado._attachFile(localPath, true);
    }

    /**
     * helper that attaches files to Salesforce records
     *
     * @private
     * @param {string} localPath where we stored the temporary json file
     * @param {boolean} [async] optional flag to indicate if the upload should be asynchronous
     * @param {string} [parentSfid] optionally specify SFID of record to which we want to attach the file. Current Result record if omitted
     * @param {string} [preMsg] optional message to display before uploading synchronously
     * @param {string} [postMsg] optional message to display after uploading synchronously
     */
    static _attachFile(
        localPath,
        async = false,
        parentSfid,
        preMsg,
        postMsg = 'Completed uploading file'
    ) {
        const command =
            `copado --uploadfile "${localPath}"` +
            (parentSfid ? ` --parentid "${parentSfid}"` : '');
        if (async) {
            Log.debug('⚡ ' + command); // also done in Util.execCommand
            try {
                exec(command);
            } catch (ex) {
                // do not use Log.error here to prevent our copado-function from auto-failing right here
                Log.info(ex.status + ': ' + ex.message);
                throw new Error(ex);
            }
        } else {
            if (!preMsg) {
                preMsg = 'Uploading file ' + localPath;
                if (parentSfid) {
                    preMsg += ` to ${parentSfid}`;
                }
            }
            Util.execCommand(preMsg, [command], postMsg);
        }
    }
    /**
     * download file to CWD with the name that was stored in Salesforce
     *
     * @param {string} fileSFID salesforce ID of the file to download
     * @param {string} [preMsg] optional message to display before uploading synchronously
     * @returns {void}
     */
    static _downloadFile(fileSFID, preMsg) {
        if (fileSFID) {
            if (!preMsg) {
                preMsg = `Download ${fileSFID}.`;
            }
            Util.execCommand(preMsg, `copado --downloadfiles "${fileSFID}"`, 'Completed download');
        } else {
            throw new Error('fileSalesforceId is not set');
        }
    }

    /**
     * downloads & parses JSON file from Salesforce
     *
     * @param {string} fileSFID salesforce ID of the file to download
     * @param {string} fileName name of the file the download will be saved as
     * @param {string} [preMsg] optional message to display before uploading synchronously
     * @returns {TYPE.CommitSelection[]} commitSelectionArr
     */
    static getJsonFile(fileSFID, fileName, preMsg) {
        Copado._downloadFile(fileSFID, preMsg);
        return JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }

    /**
     * Executes git fetch, followed by checking out the given branch
     * newly created branches are based on the previously checked out branch!
     *
     * @param {string} workingBranch main, feature/..., promotion/...
     * @param {boolean} [createBranch=false] creates workingBranch if needed
     * @returns {void}
     */
    static checkoutSrc(workingBranch, createBranch = false) {
        Util.execCommand(
            `Switching to ${workingBranch} branch`,
            [`copado-git-get ${createBranch ? '--create ' : ''}"${workingBranch}"`],
            'Completed creating/checking out branch'
        );
    }

    /**
     * Deletes the remote feature branch
     *
     * @param {string} featureBranch branch that is going to be deleted
     * @returns {void}
     */
    static deleteBranch(featureBranch) {
        // delete feature branch on origin code in here
        Util.execCommand(
            `Deleting branch ${featureBranch} on server`,
            [`git push origin --delete ${featureBranch}`],
            'Completed deleting server branch ' + featureBranch
        );
        Util.execCommand(
            `Deleting branch ${featureBranch} locally`,
            [`git branch --delete --force ${featureBranch}`],
            'Completed deleting local branch ' + featureBranch
        );
    }

    /**
     * to be executed at the very end
     *
     * @returns {Promise.<void>} promise of uploads
     */
    static async uploadToolLogs() {
        Log.debug('Getting mcdev logs');

        try {
            const logsAttached = [];
            for (const file of fs.readdirSync('logs')) {
                Log.debug('- ' + file);
                logsAttached.push(Copado.attachLog('logs/' + file));
            }
            const response = await Promise.all(logsAttached);
            Log.debug('Attached mcdev logs');
            return response;
        } catch (ex) {
            Log.debug('attaching mcdev logs failed:' + ex.message);
        }
    }
}

module.exports = Copado;
