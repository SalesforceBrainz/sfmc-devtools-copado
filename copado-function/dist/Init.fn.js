#!/usr/bin/env node

/*
 * mcdev-copado v1.3.0 (built 2022-12-06T13:20:00.630Z)
 * Function: Init.fn.js
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
    var execSync = require("child_process").execSync;
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
        execSync(`copado --error-message ${error} --progress ${msg}`);
      }
      static result(json, msg = "Result attached") {
        if (typeof json !== "string") {
          json = JSON.stringify(json);
        }
        console.log("\u2705", json);
        json = JSON.stringify(`${msg}: ${json}`);
        msg = JSON.stringify(msg);
        execSync(`copado --result-data ${json} --progress ${msg}`);
      }
      static progress(msg) {
        msg = JSON.stringify(msg);
        execSync(`copado --progress ${msg}`);
      }
    };
    module2.exports = Log2;
  }
});

// types/mcdev-copado.d.js
var require_mcdev_copado_d = __commonJS({
  "types/mcdev-copado.d.js"(exports, module2) {
    module2.exports = {};
  }
});

// common/Util.js
var require_Util = __commonJS({
  "common/Util.js"(exports, module2) {
    "use strict";
    var fs2 = require("fs");
    var execSync = require("child_process").execSync;
    var TYPE = require_mcdev_copado_d();
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
          execSync(command, { stdio: [0, 1, 2], stderr: "inherit" });
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
          execSync(command, { stdio: [0, 1, 2], stderr: "inherit" });
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
    var TYPE = require_mcdev_copado_d();
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

// Init.fn.js
var resolve = require("path").resolve;
var fs = require("fs");
var CONFIG = require_Config();
var Log = require_Log();
var Util = require_Util();
var Copado = require_Copado();
CONFIG.mcdevCopadoVersion = "1.3.0";
CONFIG.credentialNameSource = process.env.credentialName;
CONFIG.credentialNameTarget = null;
CONFIG.client_id = process.env.client_id;
CONFIG.client_secret = process.env.client_secret;
CONFIG.auth_url = process.env.auth_url;
CONFIG.account_id = process.env.enterprise_id;
CONFIG.credentials = `{"${CONFIG.credentialNameSource}":{"client_id":"${CONFIG.client_id}","client_secret":"${CONFIG.client_secret}","auth_url":"${CONFIG.auth_url}","account_id":"${CONFIG.account_id}"}}`;
CONFIG.configFilePath = null;
CONFIG.debug = process.env.debug === "true" ? true : false;
CONFIG.installMcdevLocally = null;
CONFIG.mainBranch = null;
CONFIG.mcdevVersion = null;
CONFIG.metadataFilePath = null;
CONFIG.source_mid = null;
CONFIG.tmpDirectory = "../tmp";
CONFIG.userEmail = process.env.git_email;
CONFIG.userName = process.env.git_name;
CONFIG.source_sfid = null;
CONFIG.commitMessage = null;
CONFIG.featureBranch = null;
CONFIG.fileSelectionSalesforceId = null;
CONFIG.fileSelectionFileName = null;
CONFIG.recreateFeatureBranch = null;
CONFIG.envVariables = {
  source: null,
  sourceChildren: null,
  destination: null,
  destinationChildren: null
};
CONFIG.deltaPackageLog = null;
CONFIG.destinationBranch = null;
CONFIG.fileUpdatedSelectionSfid = null;
CONFIG.git_depth = null;
CONFIG.merge_strategy = null;
CONFIG.promotionBranch = null;
CONFIG.promotionName = null;
CONFIG.target_mid = null;
CONFIG.repoUrl = process.env.repoUrl;
CONFIG.downloadBUs = process.env.downloadBUs === "false" ? false : true;
CONFIG.gitPush = process.env.gitPush === "false" ? false : true;
async function run() {
  Log.info("McdevInit.js started");
  Log.debug("");
  Log.debug("Parameters");
  Log.debug("===================");
  if ([CONFIG.client_id, CONFIG.client_secret, CONFIG.auth_url, CONFIG.account_id].includes()) {
    Log.error(
      `Could not find credentials: ${CONFIG.client_id}, ${CONFIG.client_secret}, ${CONFIG.auth_url}, ${CONFIG.account_id}`
    );
    throw new Error(
      `Could not find credentials: ${CONFIG.client_id}, ${CONFIG.client_secret}, ${CONFIG.auth_url}, ${CONFIG.account_id}`
    );
  }
  try {
    CONFIG.credentials = JSON.parse(CONFIG.credentials);
  } catch (ex) {
    Log.error(`Could not parse credentials: ${CONFIG.credentials}`);
    throw ex;
  }
  Log.debug(CONFIG);
  if (!CONFIG.credentials[CONFIG.credentialNameSource]) {
    Log.error(`No credentials found for source (${CONFIG.credentialNameSource})`);
    throw new Error(`No credentials`);
  }
  Log.debug("Credentials found for source BU");
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
    Util.execCommand(null, [
      "git config --global --add safe.directory " + resolve(CONFIG.tmpDirectory)
    ]);
  } catch {
    Log.error("Could not set tmp directoy as safe directory");
  }
  if (!fs.existsSync(CONFIG.tmpDirectory)) {
    fs.mkdirSync(CONFIG.tmpDirectory);
  }
  process.chdir(CONFIG.tmpDirectory);
  Log.debug(process.cwd());
  try {
    Log.info("");
    Log.info("Adding git email and name");
    Log.info("===================");
    Log.info("");
    Util.execCommand(null, [
      `git config --global user.email "${CONFIG.userEmail}"`,
      `git config --global user.name "${CONFIG.userName}"`
    ]);
  } catch (ex) {
    Log.error("adding git email and name failed: " + ex.message);
    throw ex;
  }
  try {
    Log.info("");
    Log.info("Initializing mcdev tools");
    Log.info("===================");
    Log.info("");
    Init.mcdevInit(CONFIG.credentials, CONFIG.credentialNameSource, {
      url: CONFIG.repoUrl,
      downloadBUs: CONFIG.downloadBUs,
      gitPush: CONFIG.gitPush
    });
  } catch (ex) {
    Log.error("Initializing failed: " + ex.message);
    throw ex;
  }
  Log.info("");
  Log.info("===================");
  Log.info("");
  Log.info("McdevInit.js done");
  Copado.uploadToolLogs();
}
var Init = class {
  static mcdevInit(credentials, credentialName, options) {
    Util.execCommand(
      `Initializing mcdev`,
      [
        `mcdev init --y.credentialName "${credentialName}" --y.client_id "${credentials[credentialName].client_id}" --y.client_secret "${credentials[credentialName].client_secret}" --y.auth_url "${credentials[credentialName].auth_url}" --y.gitRemoteUrl "${options.url}" --y.account_id ${credentials[credentialName].account_id} --y.downloadBUs "${options.downloadBUs}" --y.gitPush "${options.gitPush}"`
      ],
      "Mcdev initialized!"
    );
  }
};
run();
