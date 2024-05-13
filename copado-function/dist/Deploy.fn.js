#!/usr/bin/env node

/*
 * mcdev-copado v1.3.0 (built 2022-12-05T16:05:54.393Z)
 * Function: Deploy.fn.js
 * Dependenies: mcdev@>=4.1.12, Copado Deployer@20.1
 * Homepage: https://github.com/Accenture/sfmc-devtools-copado#readme
 * Support: https://github.com/Accenture/sfmc-devtools-copado/issues
 * Git-Repository: https://github.com/Accenture/sfmc-devtools-copado.git
 * Copyright (c) 2022 Accenture. MIT licensed
*/


"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// types/mcdev-copado.d.js
var require_mcdev_copado_d = __commonJS({
  "types/mcdev-copado.d.js"(exports, module2) {
    module2.exports = {};
  }
});

// common/Config.js
var require_Config = __commonJS({
  "common/Config.js"(exports, module2) {
    module2.exports = {};
  }
});

// common/Log.js
var require_Log = __commonJS({
  "common/Log.js"(exports, module2) {
    "use strict";
    var execSync2 = require("child_process").execSync;
    var CONFIG2 = require_Config();
    var Log2 = class {
      static debug(msg) {
        if (CONFIG2.debug) {
          console.log("DEBUG:", msg);
        }
      }
      static warn(msg) {
        console.log("\u26A0", msg);
      }
      static info(msg) {
        console.log(msg);
      }
      static error(error, msg = "Error") {
        console.log("\u274C", error);
        error = JSON.stringify(error);
        msg = JSON.stringify(msg);
        execSync2(`copado --error-message ${error} --progress ${msg}`);
      }
      static result(json, msg = "Result attached") {
        if (typeof json !== "string") {
          json = JSON.stringify(json);
        }
        console.log("\u2705", json);
        json = JSON.stringify(`${msg}: ${json}`);
        msg = JSON.stringify(msg);
        execSync2(`copado --result-data ${json} --progress ${msg}`);
      }
      static progress(msg) {
        msg = JSON.stringify(msg);
        execSync2(`copado --progress ${msg}`);
      }
    };
    module2.exports = Log2;
  }
});

// common/Util.js
var require_Util = __commonJS({
  "common/Util.js"(exports, module2) {
    "use strict";
    var fs2 = require("fs");
    var execSync2 = require("child_process").execSync;
    var TYPE2 = require_mcdev_copado_d();
    var CONFIG2 = require_Config();
    var Log2 = require_Log();
    var Util2 = class {
      static saveJsonFile(localPath, jsObj, beautify) {
        const jsonString = beautify ? JSON.stringify(jsObj, null, 4) : JSON.stringify(jsObj);
        fs2.writeFileSync(localPath, jsonString, "utf8");
      }
      static push(destinationBranch) {
        Util2.execCommand(
          `Pushing updates to ${destinationBranch} branch`,
          ['git push origin "' + destinationBranch + '"'],
          "Completed pushing branch"
        );
      }
      static execCommand(preMsg, command, postMsg) {
        if (null != preMsg) {
          Log2.progress(preMsg);
        }
        if (command && Array.isArray(command)) {
          command = command.join(" && ");
        }
        Log2.debug("\u26A1 " + command);
        try {
          execSync2(command, { stdio: [0, 1, 2], stderr: "inherit" });
        } catch (ex) {
          Log2.info(ex.status + ": " + ex.message);
          throw new Error(ex);
        }
        if (null != postMsg) {
          Log2.debug("\u2714\uFE0F  " + postMsg);
        }
      }
      static execCommandReturnStatus(preMsg, command, postMsg) {
        if (null != preMsg) {
          Log2.progress(preMsg);
        }
        if (command && Array.isArray(command)) {
          command = command.join(" && ");
        }
        Log2.debug("\u26A1 " + command);
        let exitCode = null;
        try {
          execSync2(command, { stdio: [0, 1, 2], stderr: "inherit" });
          exitCode = 0;
        } catch (ex) {
          Log2.warn("\u274C  " + ex.status + ": " + ex.message);
          exitCode = ex.status;
          return exitCode;
        }
        if (null != postMsg) {
          Log2.progress("\u2714\uFE0F  " + postMsg);
        }
        return exitCode;
      }
      static provideMCDevTools() {
        if (fs2.existsSync("package.json")) {
          Log2.debug("package.json found, assuming npm was already initialized");
        } else {
          Util2.execCommand("Initializing npm", ["npm init -y"], "Completed initializing NPM");
        }
        let installer;
        if (!CONFIG2.installMcdevLocally) {
          Util2.execCommand(
            `Initializing Accenture SFMC DevTools (packaged version)`,
            [
              `npm link mcdev --no-audit --no-fund --ignore-scripts --omit=dev --omit=peer --omit=optional`,
              "mcdev --version"
            ],
            "Completed installing Accenture SFMC DevTools"
          );
          return;
        } else if (!CONFIG2.mcdevVersion) {
          Log2.error("Please specify mcdev_version in pipeline & environment settings");
          throw new Error("Please specify mcdev_version in pipeline & environment settings");
        } else if (CONFIG2.mcdevVersion.charAt(0) === "#") {
          installer = `accenture/sfmc-devtools${CONFIG2.mcdevVersion}`;
        } else {
          installer = `mcdev@${CONFIG2.mcdevVersion}`;
        }
        Util2.execCommand(
          `Initializing Accenture SFMC DevTools (${installer})`,
          [`npm install ${installer}`, "node ./node_modules/mcdev/lib/cli.js --version"],
          "Completed installing Accenture SFMC DevTools"
        );
      }
      static provideMCDevCredentials(credentials) {
        Log2.info("Provide authentication");
        Util2.saveJsonFile(".mcdev-auth.json", credentials, true);
      }
      static convertSourceProperties(properties) {
        const response = {};
        for (const item of properties) {
          response[item.copado__API_Name__c] = item.copado__Value__c;
        }
        return response;
      }
      static convertEnvVariables(envVariables) {
        Object.keys(envVariables).map((key) => {
          if (key.endsWith("Children")) {
            envVariables[key] = Util2._convertEnvChildVars(envVariables[key]);
          } else {
            envVariables[key] = Util2._convertEnvVars(envVariables[key]);
          }
        });
      }
      static _convertEnvVars(envVarArr) {
        if (!envVarArr) {
          return envVarArr;
        }
        if (typeof envVarArr === "string") {
          envVarArr = JSON.parse(envVarArr);
        }
        const response = {};
        for (const item of envVarArr) {
          response[item.name] = item.value;
        }
        return response;
      }
      static _convertEnvChildVars(envChildVarArr) {
        if (!envChildVarArr) {
          return envChildVarArr;
        }
        if (typeof envChildVarArr === "string") {
          envChildVarArr = JSON.parse(envChildVarArr);
        }
        const response = {};
        for (const item of envChildVarArr) {
          response[item.id] = Util2._convertEnvVars(item.environmentVariables);
        }
        return response;
      }
      static getBuName(credName, mid) {
        let credBuName;
        if (!credName) {
          throw new Error('System Property "credentialName" not set');
        }
        if (!mid) {
          throw new Error('System Property "mid" not set');
        }
        if (!fs2.existsSync(CONFIG2.configFilePath)) {
          throw new Error("Could not find config file " + CONFIG2.configFilePath);
        }
        const config = JSON.parse(fs2.readFileSync(CONFIG2.configFilePath, "utf8"));
        if (config.credentials[credName] && config.credentials[credName].businessUnits) {
          const myBuNameArr = Object.keys(config.credentials[credName].businessUnits).filter(
            (buName) => config.credentials[credName].businessUnits[buName] == mid
          );
          if (myBuNameArr.length === 1) {
            Log2.debug("BU Name is: " + credName + "/" + myBuNameArr[0]);
            credBuName = credName + "/" + myBuNameArr[0];
          } else {
            throw new Error(`MID ${mid} not found for ${credName}`);
          }
        }
        return credBuName;
      }
    };
    module2.exports = Util2;
  }
});

// common/Copado.js
var require_Copado = __commonJS({
  "common/Copado.js"(exports, module2) {
    "use strict";
    var fs2 = require("fs");
    var exec = require("child_process").exec;
    var TYPE2 = require_mcdev_copado_d();
    var Log2 = require_Log();
    var Util2 = require_Util();
    var Copado2 = class {
      static attachJson(localPath, parentSfid, async = false, preMsg) {
        Copado2._attachFile(localPath, async, parentSfid, preMsg);
      }
      static async attachLog(localPath) {
        Copado2._attachFile(localPath, true);
      }
      static _attachFile(localPath, async = false, parentSfid, preMsg, postMsg = "Completed uploading file") {
        const command = `copado --uploadfile "${localPath}"` + (parentSfid ? ` --parentid "${parentSfid}"` : "");
        if (async) {
          Log2.debug("\u26A1 " + command);
          try {
            exec(command);
          } catch (ex) {
            Log2.info(ex.status + ": " + ex.message);
            throw new Error(ex);
          }
        } else {
          if (!preMsg) {
            preMsg = "Uploading file " + localPath;
            if (parentSfid) {
              preMsg += ` to ${parentSfid}`;
            }
          }
          Util2.execCommand(preMsg, [command], postMsg);
        }
      }
      static _downloadFile(fileSFID, preMsg) {
        if (fileSFID) {
          if (!preMsg) {
            preMsg = `Download ${fileSFID}.`;
          }
          Util2.execCommand(preMsg, `copado --downloadfiles "${fileSFID}"`, "Completed download");
        } else {
          throw new Error("fileSalesforceId is not set");
        }
      }
      static getJsonFile(fileSFID, fileName, preMsg) {
        Copado2._downloadFile(fileSFID, preMsg);
        return JSON.parse(fs2.readFileSync(fileName, "utf8"));
      }
      static checkoutSrc(workingBranch, createBranch = false) {
        Util2.execCommand(
          `Switching to ${workingBranch} branch`,
          [`copado-git-get ${createBranch ? "--create " : ""}"${workingBranch}"`],
          "Completed creating/checking out branch"
        );
      }
      static deleteBranch(featureBranch) {
        Util2.execCommand(
          `Deleting branch ${featureBranch} on server`,
          [`git push origin --delete ${featureBranch}`],
          "Completed deleting server branch " + featureBranch
        );
        Util2.execCommand(
          `Deleting branch ${featureBranch} locally`,
          [`git branch --delete --force ${featureBranch}`],
          "Completed deleting local branch " + featureBranch
        );
      }
      static async uploadToolLogs() {
        Log2.debug("Getting mcdev logs");
        try {
          const logsAttached = [];
          for (const file of fs2.readdirSync("logs")) {
            Log2.debug("- " + file);
            logsAttached.push(Copado2.attachLog("logs/" + file));
          }
          const response = await Promise.all(logsAttached);
          Log2.debug("Attached mcdev logs");
          return response;
        } catch (ex) {
          Log2.debug("attaching mcdev logs failed:" + ex.message);
        }
      }
    };
    module2.exports = Copado2;
  }
});

// common/Commit.js
var require_Commit = __commonJS({
  "common/Commit.js"(exports, module2) {
    "use strict";
    var fs2 = require("fs");
    var execSync2 = require("child_process").execSync;
    var TYPE2 = require_mcdev_copado_d();
    var CONFIG2 = require_Config();
    var Log2 = require_Log();
    var Util2 = require_Util();
    var Commit2 = class {
      static async retrieveCommitSelection(sourceBU, commitSelectionArr) {
        const mcdev = require("../tmp/node_modules/mcdev/lib/");
        mcdev.setSkipInteraction(true);
        commitSelectionArr = commitSelectionArr.filter((item) => item.a === "add");
        const typeKeyMap = {};
        for (const item of commitSelectionArr) {
          if (!typeKeyMap[item.t]) {
            typeKeyMap[item.t] = [];
          }
          const jObj = JSON.parse(item.j);
          typeKeyMap[item.t].push(jObj.newKey || jObj.key);
        }
        const typeArr = [...new Set(commitSelectionArr.map((item) => item.t))];
        await mcdev.retrieve(sourceBU, typeKeyMap, null, false);
        const fileArr = (await Promise.all(
          typeArr.map((type) => {
            const keyArr = [
              ...new Set(
                commitSelectionArr.filter((item) => item.t === type).map((item) => {
                  const jObj = JSON.parse(item.j);
                  return jObj.newKey || jObj.key;
                })
              )
            ];
            return mcdev.getFilesToCommit(sourceBU, type.split("-")[0], keyArr);
          })
        )).flat();
        return fileArr;
      }
      static addSelectedComponents(gitAddArr) {
        for (const filePath of gitAddArr) {
          if (fs2.existsSync(filePath)) {
            Util2.execCommand(null, ['git add "' + filePath + '"'], "staged " + filePath);
          } else {
            Log2.warn("\u274C  could not find " + filePath);
          }
        }
      }
      static commit(originalSelection) {
        const gitDiffArr = execSync2("git diff --staged --name-only").toString().split("\n").map((item) => item.trim()).filter((item) => !!item);
        Log2.debug("Git diff ended with the result:");
        Log2.debug(gitDiffArr);
        if (Array.isArray(gitDiffArr) && gitDiffArr.length) {
          Util2.execCommand(
            "Committing changes to branch",
            ['git commit -n -m "' + CONFIG2.commitMessage + '"'],
            "Completed committing"
          );
          const result = {
            committed: gitDiffArr,
            noChangesFound: originalSelection.map((item) => item.replace(new RegExp("\\\\", "g"), "/")).filter(
              (item) => !gitDiffArr.includes(item)
            )
          };
          Log2.result(
            result,
            `Committed ${result.committed.filter((item) => item.endsWith(".json")).length} items with ${result.committed.length} files`
          );
        } else {
          Log2.error(
            "Nothing to commit as all selected components have the same content as already exists in Git. " + JSON.stringify(originalSelection),
            "Nothing to commit"
          );
          throw new Error("Nothing to commit");
        }
      }
    };
    module2.exports = Commit2;
  }
});

// Deploy.fn.js
var fs = require("fs");
var execSync = require("child_process").execSync;
var resolve = require("path").resolve;
var TYPE = require_mcdev_copado_d();
var CONFIG = require_Config();
var Log = require_Log();
var Util = require_Util();
var Copado = require_Copado();
var Commit = require_Commit();
CONFIG.mcdevCopadoVersion = "1.3.0";
CONFIG.credentialNameSource = process.env.credentialNameSource;
CONFIG.credentialNameTarget = process.env.credentialNameTarget;
CONFIG.credentials = process.env.credentials;
CONFIG.configFilePath = ".mcdevrc.json";
CONFIG.debug = process.env.debug === "true" ? true : false;
CONFIG.installMcdevLocally = process.env.installMcdevLocally === "true" ? true : false;
CONFIG.mainBranch = process.env.main_branch;
CONFIG.mcdevVersion = process.env.mcdev_version;
CONFIG.metadataFilePath = "mcmetadata.json";
CONFIG.source_mid = process.env.source_mid;
CONFIG.tmpDirectory = "../tmp";
CONFIG.source_sfid = null;
CONFIG.commitMessage = null;
CONFIG.featureBranch = null;
CONFIG.recreateFeatureBranch = null;
CONFIG.envVariables = {
  source: process.env.envVariablesSource,
  sourceChildren: process.env.envVariablesSourceChildren,
  destination: process.env.envVariablesDestination,
  destinationChildren: process.env.envVariablesDestinationChildren
};
CONFIG.deltaPackageLog = "docs/deltaPackage/delta_package.md";
CONFIG.destinationBranch = process.env.toBranch;
CONFIG.fileSelectionFileName = "Copado Deploy changes";
CONFIG.fileSelectionSalesforceId = process.env.metadata_file;
CONFIG.fileUpdatedSelectionSfid = null;
CONFIG.git_depth = 100;
CONFIG.merge_strategy = process.env.merge_strategy;
CONFIG.promotionBranch = process.env.promotionBranch;
CONFIG.promotionName = process.env.promotionName;
CONFIG.target_mid = process.env.target_mid;
CONFIG.sourceProperties = process.env.sourceProperties;
CONFIG.deployNTimes = process.env.deployNTimes === "true" ? true : false;
async function run() {
  Log.info("Deploy.js started");
  Log.debug("");
  Log.debug("Parameters");
  Log.debug("===================");
  try {
    CONFIG.credentials = JSON.parse(CONFIG.credentials);
  } catch (ex) {
    Log.error("Could not parse credentials");
    throw ex;
  }
  try {
    CONFIG.sourceProperties = JSON.parse(CONFIG.sourceProperties);
  } catch (ex) {
    Log.error("Could not parse sourceProperties");
    throw ex;
  }
  Util.convertEnvVariables(CONFIG.envVariables);
  CONFIG.sourceProperties = Util.convertSourceProperties(CONFIG.sourceProperties);
  CONFIG.source_mid = CONFIG.sourceProperties.mid;
  CONFIG.credentialNameSource = CONFIG.sourceProperties.credential_name;
  Log.debug(CONFIG);
  if (!CONFIG.credentials[CONFIG.credentialNameSource]) {
    Log.error(`No credentials found for source (${CONFIG.credentialNameSource})`);
    throw new Error(`No source credentials`);
  }
  if (!CONFIG.credentials[CONFIG.credentialNameTarget]) {
    Log.error(`No credentials found for target (${CONFIG.credentialNameTarget})`);
    throw new Error(`No target credentials`);
  }
  Log.debug("Environment");
  Log.debug("===================");
  if (CONFIG.debug) {
    Util.execCommand(null, "npm --version", null);
    Util.execCommand(null, "node --version", null);
    Util.execCommand(null, "git version", null);
    Util.execCommand(null, "mcdev --version", null);
  }
  Log.debug(`Change Working directory to: ${CONFIG.tmpDirectory}`);
  try {
    Util.execCommand(null, ["git config --global --add safe.directory /tmp"]);
  } catch {
    try {
      Util.execCommand(null, [
        "git config --global --add safe.directory " + resolve(CONFIG.tmpDirectory)
      ]);
    } catch {
      Log.error("Could not set tmp directoy as safe directory");
    }
  }
  process.chdir(CONFIG.tmpDirectory);
  Log.debug(process.cwd());
  try {
    Log.info("");
    Log.info("Clone repository");
    Log.info("===================");
    Log.info("");
    Copado.checkoutSrc(CONFIG.promotionBranch);
    Copado.checkoutSrc(CONFIG.mainBranch);
  } catch (ex) {
    Log.error("Cloning failed:" + ex.message);
    throw ex;
  }
  try {
    Log.info("");
    Log.info("Merge branch");
    Log.info("===================");
    Log.info("");
    Deploy.merge(CONFIG.promotionBranch, CONFIG.mainBranch);
  } catch (ex) {
    Log.error("Merge failed: " + ex.message);
    throw ex;
  }
  let commitSelectionArr;
  try {
    Log.info("");
    Log.info(
      `Add selected components defined in ${CONFIG.fileSelectionSalesforceId} to metadata JSON`
    );
    Log.info("===================");
    Log.info("");
    commitSelectionArr = Copado.getJsonFile(
      CONFIG.fileSelectionSalesforceId,
      CONFIG.fileSelectionFileName,
      "Retrieving list of selected items"
    );
    if (!Array.isArray(commitSelectionArr) || commitSelectionArr.length === 0) {
      throw new Error(
        "Copado has not registered any files ready for deployment. Please check if you committed all files."
      );
    }
  } catch (ex) {
    Log.error("Getting Deploy-selection file failed:" + ex.message);
    throw ex;
  }
  try {
    Log.info("");
    Log.info("Preparing");
    Log.info("===================");
    Log.info("");
    Util.provideMCDevTools();
    Util.provideMCDevCredentials(CONFIG.credentials);
  } catch (ex) {
    Log.error("initializing failed: " + ex.message);
    throw ex;
  }
  let deployFolder;
  try {
    Log.info("");
    Log.info("Determine deploy folder");
    Log.info("===================");
    Log.info("");
    deployFolder = Deploy.getDeployFolder();
  } catch (ex) {
    Log.error("getDeployFolder failed: " + ex.message);
    throw ex;
  }
  let sourceBU;
  let targetBU;
  try {
    Log.info("");
    Log.info("Create delta package");
    Log.info("===================");
    Log.info("");
    sourceBU = Util.getBuName(CONFIG.credentialNameSource, CONFIG.source_mid);
    targetBU = Util.getBuName(CONFIG.credentialNameTarget, CONFIG.target_mid);
  } catch (ex) {
    Log.error("Getting Source / Target BU failed: " + ex.message);
    throw ex;
  }
  try {
    Deploy.updateMarketLists(sourceBU, targetBU, CONFIG.envVariables);
  } catch (ex) {
    Log.error("Updateing Market List failed: " + ex.message);
    throw ex;
  }
  try {
    if (await Deploy.createDeltaPackage(
      deployFolder,
      commitSelectionArr,
      sourceBU.split("/")[1]
    )) {
      Log.info("Deploy BUs");
      Log.info("===================");
      const deployResult = await Deploy.deployBU(targetBU);
      commitSelectionArr = Deploy.replaceMarketValues(commitSelectionArr);
      Deploy.replaceAssetKeys(targetBU, commitSelectionArr, deployResult);
    } else {
      throw new Error("No changes found. Nothing to deploy");
    }
  } catch (ex) {
    Log.error("Deploy failed: " + ex.message);
    Copado.uploadToolLogs();
    throw ex;
  }
  let gitDiffArr;
  let verificationText;
  try {
    gitDiffArr = await Deploy.retrieveAndCommit(targetBU, commitSelectionArr);
  } catch (ex) {
    verificationText = "Failed deploy verification, check BU on SFMC to verify manually. Git not updated with the changes on target BU";
    Log.warn(verificationText + ": " + ex.message);
    gitDiffArr = [];
  }
  let success = false;
  let i = 0;
  do {
    i++;
    try {
      Log.info("git-push changes");
      Log.info("===================");
      Util.push(CONFIG.mainBranch);
      success = true;
    } catch (ex) {
      if (ex.message === `Error: Command failed: git push origin "${CONFIG.mainBranch}"`) {
        Log.progress("Merging changes from parallel deployments");
        Util.execCommand(null, ['git fetch origin "' + CONFIG.mainBranch + '"'], null);
        Util.execCommand(null, ["git reset --hard origin/" + CONFIG.mainBranch], null);
        Util.execCommand(null, ['git merge "' + CONFIG.promotionBranch + '"'], null);
      }
    }
  } while (!success && i <= 50);
  Log.info("");
  Log.info("===================");
  Log.info("");
  Log.info("Deploy.js done");
  Log.result(
    gitDiffArr,
    `Deployed ${gitDiffArr.filter((item) => item.endsWith(".json")).length} items with ${gitDiffArr.length} files` + (verificationText ? ` (${verificationText})` : "")
  );
  Copado.uploadToolLogs();
}
var Deploy = class {
  static stashChanges() {
    Util.execCommand(null, [`git stash`], null);
  }
  static async retrieveAndCommit(targetBU, commitSelectionArr) {
    let gitAddArr;
    let gitDiffArr = [];
    try {
      Log.info(
        `Stashing changes made by mcdev.deploy() to avoid issues during branch checkout`
      );
      Deploy.stashChanges();
      Log.info("Switch to source branch to add updates for target");
      Copado.checkoutSrc(CONFIG.promotionBranch);
    } catch (ex) {
      Log.error("Switching failed:" + ex.message);
      throw ex;
    }
    try {
      Log.info("");
      Log.info("Retrieve components");
      Log.info("===================");
      Log.info("");
      gitAddArr = await Commit.retrieveCommitSelection(targetBU, commitSelectionArr);
    } catch (ex) {
      Log.error("Retrieving failed: " + ex.message);
      Copado.uploadToolLogs();
      throw ex;
    }
    try {
      Log.info("");
      Log.info("Add components in metadata JSON to Git history");
      Log.info("===================");
      Log.info("");
      Commit.addSelectedComponents(gitAddArr);
    } catch (ex) {
      Log.error("git add failed:" + ex.message);
      throw ex;
    }
    try {
      Log.info("");
      Log.info("Commit");
      Log.info("===================");
      Log.info("");
      const commitMsgLines = Deploy.getCommitMessage(targetBU, commitSelectionArr);
      gitDiffArr = Deploy.commit(commitMsgLines);
    } catch (ex) {
      Log.error("git commit failed:" + ex.message);
      throw ex;
    }
    try {
      Log.info("Switch back to main branch to allow merging promotion branch into it");
      Copado.checkoutSrc(CONFIG.mainBranch);
    } catch (ex) {
      Log.error("Switching failed:" + ex.message);
      throw ex;
    }
    try {
      Log.info("Merge promotion into main branch");
      Deploy.merge(CONFIG.promotionBranch, CONFIG.mainBranch);
    } catch (ex) {
      Log.error("Merge failed: " + ex.message);
      throw ex;
    }
    return gitDiffArr;
  }
  static commit(commitMsgLines) {
    const gitDiffArr = execSync("git diff --staged --name-only").toString().split("\n").map((item) => item.trim()).filter((item) => !!item);
    Log.debug("Git diff ended with the result:");
    Log.debug(gitDiffArr);
    if (Array.isArray(gitDiffArr) && gitDiffArr.length) {
      if (!Array.isArray(commitMsgLines)) {
        commitMsgLines = [CONFIG.commitMessage];
      }
      const commitMsgParam = commitMsgLines.map((line) => '-m "' + line + '"').join(" ");
      Util.execCommand(
        "Committing changes",
        ["git commit -n " + commitMsgParam],
        "Completed committing"
      );
      Log.progress("Commit of target BU files completed");
    } else {
      Log.error(
        "Nothing to commit as all selected components have the same content as already exists in Git.",
        "Nothing to commit"
      );
      throw new Error("Nothing to commit");
    }
    return gitDiffArr;
  }
  static getCommitMessage(targetBU, commitSelectionArr) {
    const userStoryNames = [
      ...new Set(commitSelectionArr.map((item) => item.u).filter(Boolean))
    ].sort();
    const commitMsgLines = [
      CONFIG.promotionName + ": " + userStoryNames.join(", "),
      `Updated BU "${targetBU}" (${CONFIG.target_mid})`
    ];
    return commitMsgLines;
  }
  static _convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU) {
    return commitSelectionArr.map(
      (item) => ({
        type: item.t.split("-")[0],
        name: item.n,
        externalKey: JSON.parse(item.j).newKey || JSON.parse(item.j).key,
        gitAction: "add/update",
        _credential: CONFIG.credentialNameSource,
        _businessUnit: sourceBU
      })
    );
  }
  static getDeployFolder() {
    var _a;
    if (!fs.existsSync(CONFIG.configFilePath)) {
      throw new Error("Could not find config file " + CONFIG.configFilePath);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, "utf8"));
    const folder = (_a = config == null ? void 0 : config.directories) == null ? void 0 : _a.deploy;
    if (!folder) {
      throw new Error("Could not find config.directories.deploy in " + CONFIG.configFilePath);
    }
    Log.debug("Deploy folder is: " + folder);
    return folder;
  }
  static updateMarketLists(sourceBU, targetBU, marketVariables) {
    const deploySourceList = "deployment-source";
    const deployTargetList = "deployment-target";
    const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, "utf8"));
    config.options.deployment.sourceTargetMapping = {};
    config.options.deployment.sourceTargetMapping[deploySourceList] = deployTargetList;
    config.markets = {};
    if (CONFIG.deployNTimes) {
      if (Object.keys(CONFIG.envVariables.sourceChildren).length !== 1) {
        throw new Error(
          'Expected exactly one source child BU when "deployNTimes" is active in pipeline but found ' + Object.keys(CONFIG.envVariables.sourceChildren).length
        );
      }
      for (const childSfid in CONFIG.envVariables.sourceChildren) {
        config.markets[childSfid] = CONFIG.envVariables.sourceChildren[childSfid];
      }
      for (const childSfid in CONFIG.envVariables.destinationChildren) {
        config.markets[childSfid] = CONFIG.envVariables.destinationChildren[childSfid];
      }
    } else {
      config.markets["source"] = marketVariables.source;
      config.markets["target"] = marketVariables.destination;
    }
    config.marketList = {};
    for (const listName of [deploySourceList, deployTargetList]) {
      config.marketList[listName] = {};
    }
    if (CONFIG.deployNTimes) {
      config.marketList[deploySourceList][sourceBU] = Object.keys(
        CONFIG.envVariables.sourceChildren
      )[0];
      config.marketList[deployTargetList][targetBU] = Object.keys(
        CONFIG.envVariables.destinationChildren
      );
    } else {
      config.marketList[deploySourceList][sourceBU] = "source";
      config.marketList[deployTargetList][targetBU] = "target";
    }
    Log.debug("config.options.deployment.sourceTargetMapping");
    Log.debug(config.options.deployment.sourceTargetMapping);
    Log.debug("config.markets");
    Log.debug(config.markets);
    Log.debug("config.marketList");
    Log.debug(JSON.stringify(config.marketList));
    try {
      fs.renameSync(CONFIG.configFilePath, CONFIG.configFilePath + ".BAK");
      Util.saveJsonFile(CONFIG.configFilePath, config, "utf8");
    } catch (ex) {
      Log.error("Updating updateMarketLists failed: " + ex.message);
      throw ex;
    }
  }
  static async createDeltaPackage(deployFolder, commitSelectionArr, sourceBU) {
    const mcdev = require("../tmp/node_modules/mcdev/lib");
    mcdev.setSkipInteraction(true);
    const versionRange = null;
    let deltaPkgItems = null;
    if (Array.isArray(commitSelectionArr) && commitSelectionArr.length) {
      deltaPkgItems = this._convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU);
      Log.info(`Found ${deltaPkgItems.length} changed components in commits`);
      Log.debug("DeltaPkgItems: ");
      Log.debug(deltaPkgItems);
    } else {
      Log.info("No changed components found in commits");
    }
    const deltaPackageLog = await mcdev.createDeltaPkg({
      range: versionRange,
      diffArr: deltaPkgItems
    });
    Log.debug("deltaPackageLog: " + JSON.stringify(deltaPackageLog));
    if (!(deltaPackageLog == null ? void 0 : deltaPackageLog.length)) {
      Log.error("No changes found for deployment");
      return false;
    } else {
      Log.debug("deltaPackageLog:");
      Log.debug(deltaPackageLog);
    }
    Log.debug("Completed creating delta package");
    if (fs.existsSync(CONFIG.deltaPackageLog)) {
      Copado.attachLog(CONFIG.deltaPackageLog);
    }
    if (fs.existsSync(deployFolder)) {
      const deltaPackageFiles = fs.readdirSync(deployFolder);
      if (null != deltaPackageFiles) {
        Log.debug("Found " + deltaPackageFiles.length + " files to deploy");
        if (0 < deltaPackageFiles.length) {
          return true;
        }
      } else {
        Log.debug("Could not find any files to deploy in folder " + deployFolder);
      }
    } else {
      Log.debug("Could not find deploy folder " + deployFolder);
    }
    return false;
  }
  static _getConfigForToBranch(branch) {
    let configBranch = branch;
    if (branch.startsWith("release/")) {
      configBranch = "release/*";
    } else if (branch.startsWith("hotfix/")) {
      configBranch = "hotfix/*";
    }
    Log.debug("Config branch for branch " + branch + " is " + configBranch);
    return configBranch;
  }
  static async deployBU(bu) {
    const mcdev = require("../tmp/node_modules/mcdev/lib");
    mcdev.setSkipInteraction(true);
    const deployResult = await mcdev.deploy(bu);
    if (process.exitCode === 1) {
      throw new Error(
        "Deployment of BU " + bu + " failed. Please check the SFMC DevTools logs for more details."
      );
    }
    return deployResult;
  }
  static replaceAssetKeys(bu, commitSelectionArr, deployResult) {
    const commitSelectionArrMap = [];
    for (const i in commitSelectionArr) {
      if (commitSelectionArr[i].t.split("-")[0] === "asset") {
        const suffix = "-" + CONFIG.target_mid;
        const jObj = JSON.parse(commitSelectionArr[i].j);
        const oldKey = jObj.newKey || jObj.key;
        const newKey = CONFIG.source_mid === CONFIG.target_mid || oldKey.endsWith(suffix) ? oldKey : oldKey.slice(0, Math.max(0, 36 - suffix.length)) + suffix;
        if (deployResult[bu].asset[newKey]) {
          jObj.newKey = newKey;
          commitSelectionArr[i].j = JSON.stringify(jObj);
          commitSelectionArrMap.push(jObj);
        } else {
          throw new Error(
            `New key for ${commitSelectionArr[i].n} does not match any valid keys.`
          );
        }
      }
    }
    Util.saveJsonFile(`Copado Deploy changes-${CONFIG.target_mid}.json`, commitSelectionArr);
    Copado.attachJson(`Copado Deploy changes-${CONFIG.target_mid}.json`, null, true);
  }
  static merge(promotionBranch, currentBranch) {
    Util.execCommand(
      `Merge ${promotionBranch} into ${currentBranch}`,
      ['git merge "' + promotionBranch + '"'],
      "Completed merging commit"
    );
  }
  static replaceMarketValues(commitSelectionArr) {
    Log.debug("replacing market values");
    const commitSelectionArrNew = [];
    const replaceMapList = [];
    if (CONFIG.deployNTimes) {
      for (const sfid in CONFIG.envVariables.destinationChildren) {
        const replaceMap = {};
        const sourceSfid = Object.keys(CONFIG.envVariables.sourceChildren)[0];
        for (const item in CONFIG.envVariables.sourceChildren[sourceSfid]) {
          if (typeof CONFIG.envVariables.destinationChildren[sfid][item] !== "undefined") {
            replaceMap[CONFIG.envVariables.sourceChildren[sourceSfid][item]] = CONFIG.envVariables.destinationChildren[sfid][item];
          }
        }
        replaceMapList.push(replaceMap);
      }
    } else {
      const replaceMap = {};
      for (const item in CONFIG.envVariables.source) {
        if (typeof CONFIG.envVariables.destination[item] !== "undefined") {
          replaceMap[CONFIG.envVariables.source[item]] = CONFIG.envVariables.destination[item];
        }
      }
      replaceMapList.push(replaceMap);
    }
    for (const replaceMap of replaceMapList) {
      const commitSelectionArrClone = JSON.parse(JSON.stringify(commitSelectionArr));
      for (const item of commitSelectionArrClone) {
        for (const oldValue in replaceMap) {
          item.n = item.n.replace(new RegExp(oldValue, "g"), replaceMap[oldValue]);
          const jObj = JSON.parse(item.j);
          jObj.newKey = (jObj.newKey || jObj.key).replace(
            new RegExp(oldValue, "g"),
            replaceMap[oldValue]
          );
          item.j = JSON.stringify(jObj);
        }
      }
      commitSelectionArrNew.push(...commitSelectionArrClone);
    }
    return commitSelectionArrNew;
  }
};
run();
