#!/usr/bin/env node

/*
 * mcdev-copado v1.3.0 (built 2022-12-05T16:05:53.171Z)
 * Function: Retrieve.fn.js
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

// common/Util.js
var require_Util = __commonJS({
  "common/Util.js"(exports, module2) {
    "use strict";
    var fs2 = require("fs");
    var execSync = require("child_process").execSync;
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

// Retrieve.fn.js
var fs = require("fs");
var resolve = require("path").resolve;
var TYPE = require_mcdev_copado_d();
var CONFIG = require_Config();
var Log = require_Log();
var Util = require_Util();
var Copado = require_Copado();
CONFIG.mcdevCopadoVersion = "1.3.0";
CONFIG.credentialNameSource = process.env.credentialNameSource;
CONFIG.credentialNameTarget = null;
CONFIG.credentials = process.env.credentials;
CONFIG.configFilePath = ".mcdevrc.json";
CONFIG.debug = process.env.debug === "true" ? true : false;
CONFIG.installMcdevLocally = process.env.installMcdevLocally === "true" ? true : false;
CONFIG.mainBranch = process.env.main_branch;
CONFIG.mcdevVersion = process.env.mcdev_version;
CONFIG.metadataFilePath = "mcmetadata.json";
CONFIG.source_mid = process.env.source_mid;
CONFIG.tmpDirectory = "../tmp";
CONFIG.source_sfid = process.env.source_sfid;
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
async function run() {
  Log.info("Retrieve.js started");
  Log.debug("");
  Log.debug("Parameters");
  Log.debug("===================");
  try {
    CONFIG.credentials = JSON.parse(CONFIG.credentials);
  } catch (ex) {
    Log.error("Could not parse credentials");
    throw ex;
  }
  Util.convertEnvVariables(CONFIG.envVariables);
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
    Copado.checkoutSrc(CONFIG.mainBranch);
  } catch (ex) {
    Log.error("Cloning failed:" + ex.message);
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
  let sourceBU;
  let metadataJson;
  try {
    Log.info("");
    Log.info("Get source BU");
    Log.info("===================");
    Log.info("");
    sourceBU = Util.getBuName(CONFIG.credentialNameSource, CONFIG.source_mid);
  } catch (ex) {
    Log.error("Getting Source BU failed: " + ex.message);
    throw ex;
  }
  try {
    Log.info("");
    Log.progress("Retrieving components");
    Log.info("===================");
    Log.info("");
    metadataJson = await Retrieve.retrieveChangelog(sourceBU);
  } catch (ex) {
    Log.error("Retrieving failed: " + ex.message);
    Copado.uploadToolLogs();
    throw ex;
  }
  try {
    Log.info("");
    Log.info("Saving metadata JSON to disk");
    Log.info("===================");
    Log.info("");
    Util.saveJsonFile(CONFIG.metadataFilePath, metadataJson);
  } catch (ex) {
    Log.error("Saving metadata JSON failed:" + ex.message);
    throw ex;
  }
  try {
    Log.info("");
    Log.info("Attach JSON");
    Log.info("===================");
    Log.info("");
    Copado.attachJson(
      CONFIG.metadataFilePath,
      CONFIG.source_sfid,
      false,
      "Loading items into Copado"
    );
  } catch (ex) {
    Log.error("Attaching JSON file failed:" + ex.message);
    throw ex;
  }
  Log.result(`Found ${metadataJson.length} items on server`, "Refresh done");
  Log.info("");
  Log.info("===================");
  Log.info("");
  Log.info("Retrieve.js done");
  Copado.uploadToolLogs();
}
var Retrieve = class {
  static getRetrieveFolder() {
    if (!fs.existsSync(CONFIG.configFilePath)) {
      throw new Error("Could not find config file " + CONFIG.configFilePath);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG.configFilePath, "utf8"));
    const directories = config["directories"];
    if (null == directories) {
      throw new Error("Could not find directories in " + CONFIG.configFilePath);
    }
    const folder = directories["retrieve"];
    if (null == folder) {
      throw new Error("Could not find directories/retrieve in " + CONFIG.configFilePath);
    }
    Log.debug("Retrieve folder is: " + folder);
    return folder;
  }
  static async retrieveChangelog(sourceBU) {
    const mcdev = require("../tmp/node_modules/mcdev/lib");
    const Definition = require("../tmp/node_modules/mcdev/lib/MetadataTypeDefinitions");
    const MetadataType = require("../tmp/node_modules/mcdev/lib/MetadataTypeInfo");
    if (!CONFIG.debug) {
      mcdev.setLoggingLevel({ silent: true });
    }
    mcdev.setSkipInteraction(true);
    const customDefinition = {
      automation: {
        keyField: "CustomerKey",
        nameField: "Name",
        createdDateField: "CreatedDate",
        createdNameField: "CreatedBy",
        lastmodDateField: "LastSaveDate",
        lastmodNameField: "LastSavedBy"
      }
    };
    const retrieve = await mcdev.retrieve(sourceBU, ["accountUser"], null, true);
    if (!retrieve) {
      throw new Error("Could not retrieve User List");
    }
    const userList = retrieve.accountUser;
    for (const key of Object.keys(userList)) {
      userList[userList[key].ID] = userList[key].Name;
      delete userList[key];
    }
    const changelogList = await mcdev.retrieve(sourceBU, null, null, true);
    const allMetadata = [];
    Object.keys(changelogList).map((type) => {
      if (changelogList[type]) {
        const def = customDefinition[type] || Definition[type];
        allMetadata.push(
          ...Object.keys(changelogList[type]).map((key) => {
            const item = changelogList[type][key];
            const salesforceRegex = new RegExp(/(_Salesforce)(_[0-9])?$/gm);
            if (MetadataType[type].isFiltered(item, true) || MetadataType[type].isFiltered(item, false)) {
              return;
            }
            if (type === "dataExtension" && (this._getAttrValue(item, def.nameField).startsWith(
              "QueryStudioResults at "
            ) || salesforceRegex.test(this._getAttrValue(item, def.nameField)))) {
              return;
            }
            const listEntry = {
              n: this._getAttrValue(item, def.nameField),
              k: this._getAttrValue(item, def.keyField),
              p: this._getAttrValue(item, "r__folder_Path"),
              t: this._getAttrValue(item, "_subType") ? type + "-" + this._getAttrValue(item, "_subType") : type,
              cd: this._convertTimestamp(
                this._getAttrValue(item, def.createdDateField)
              ),
              cb: this._getUserName(userList, item, def.createdNameField),
              ld: this._convertTimestamp(
                this._getAttrValue(item, def.lastmodDateField) !== "0001-01-01T00:00:00" ? this._getAttrValue(item, def.lastmodDateField) : this._getAttrValue(item, def.createdDateField)
              ),
              lb: this._getUserName(userList, item, def.lastmodNameField)
            };
            return listEntry;
          })
        );
      }
    });
    return allMetadata.filter((item) => void 0 !== item);
  }
  static _convertTimestamp(iso8601dateTime) {
    if (!iso8601dateTime || iso8601dateTime === "0001-01-01T00:00:00") {
      return "-";
    }
    if (iso8601dateTime.split("-").length === 3) {
      iso8601dateTime += "-06:00";
    }
    return iso8601dateTime;
  }
  static _getUserName(userList, item, fieldname) {
    return userList[this._getAttrValue(item, fieldname)] || this._getAttrValue(item, fieldname) || "n/a";
  }
  static _getAttrValue(obj, key) {
    if (!key || !obj) {
      return null;
    }
    if (key.includes(".")) {
      const keys = key.split(".");
      const first = keys.shift();
      return this._getAttrValue(obj[first], keys.join("."));
    } else {
      return obj[key];
    }
  }
};
run();
