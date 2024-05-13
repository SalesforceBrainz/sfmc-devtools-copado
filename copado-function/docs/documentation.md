## Classes

<dl>
<dt><a href="#Deploy">Deploy</a></dt>
<dd><p>handles downloading metadata</p>
</dd>
<dt><a href="#Init">Init</a></dt>
<dd><p>Class for Init function</p>
</dd>
<dt><a href="#Retrieve">Retrieve</a></dt>
<dd><p>handles downloading metadata</p>
</dd>
<dt><a href="#Commit">Commit</a></dt>
<dd><p>methods to handle interaction with the copado platform</p>
</dd>
<dt><a href="#Copado">Copado</a></dt>
<dd><p>methods to handle interaction with the copado platform</p>
</dd>
<dt><a href="#Log">Log</a></dt>
<dd><p>logger class</p>
</dd>
<dt><a href="#Util">Util</a></dt>
<dd><p>helper class</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#run">run()</a> ⇒ <code>void</code></dt>
<dd><p>main method that combines runs this function</p>
</dd>
<dt><a href="#run">run()</a> ⇒ <code>void</code></dt>
<dd><p>main method that combines runs this function</p>
</dd>
<dt><a href="#run">run()</a> ⇒ <code>void</code></dt>
<dd><p>main method that combines runs this function</p>
</dd>
<dt><a href="#run">run()</a> ⇒ <code>void</code></dt>
<dd><p>main method that combines runs this function</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#EnvChildVar">EnvChildVar</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#CommitSelection">CommitSelection</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#DeltaPkgItem">DeltaPkgItem</a> : <code>&#x27;accountUser&#x27;</code> | <code>&#x27;asset&#x27;</code> | <code>&#x27;attributeGroup&#x27;</code> | <code>&#x27;automation&#x27;</code> | <code>&#x27;campaign&#x27;</code> | <code>&#x27;contentArea&#x27;</code> | <code>&#x27;dataExtension&#x27;</code> | <code>&#x27;dataExtensionField&#x27;</code> | <code>&#x27;dataExtensionTemplate&#x27;</code> | <code>&#x27;dataExtract&#x27;</code> | <code>&#x27;dataExtractType&#x27;</code> | <code>&#x27;discovery&#x27;</code> | <code>&#x27;email&#x27;</code> | <code>&#x27;emailSendDefinition&#x27;</code> | <code>&#x27;eventDefinition&#x27;</code> | <code>&#x27;fileTransfer&#x27;</code> | <code>&#x27;filter&#x27;</code> | <code>&#x27;folder&#x27;</code> | <code>&#x27;ftpLocation&#x27;</code> | <code>&#x27;importFile&#x27;</code> | <code>&#x27;interaction&#x27;</code> | <code>&#x27;list&#x27;</code> | <code>&#x27;mobileCode&#x27;</code> | <code>&#x27;mobileKeyword&#x27;</code> | <code>&#x27;query&#x27;</code> | <code>&#x27;role&#x27;</code> | <code>&#x27;script&#x27;</code> | <code>&#x27;setDefinition&#x27;</code> | <code>&#x27;triggeredSendDefinition&#x27;</code></dt>
<dd><p>TYPES DEFINED BY mcdev. copied here for easier reference</p>
</dd>
</dl>

<a name="Deploy"></a>

## Deploy
handles downloading metadata

**Kind**: global class  

* [Deploy](#Deploy)
    * [.stashChanges()](#Deploy.stashChanges)
    * [.retrieveAndCommit(targetBU, commitSelectionArr)](#Deploy.retrieveAndCommit) ⇒ <code>Array.&lt;string&gt;</code>
    * [.commit([commitMsgLines])](#Deploy.commit) ⇒ <code>Array.&lt;string&gt;</code>
    * [.getCommitMessage(targetBU, commitSelectionArr)](#Deploy.getCommitMessage) ⇒ <code>Array.&lt;string&gt;</code>
    * [._convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU)](#Deploy._convertCommitToDeltaPkgItems) ⇒ <code>Array.&lt;TYPE.DeltaPkgItem&gt;</code>
    * [.getDeployFolder()](#Deploy.getDeployFolder) ⇒ <code>string</code>
    * [.updateMarketLists(sourceBU, targetBU, marketVariables)](#Deploy.updateMarketLists) ⇒ <code>void</code>
    * [.createDeltaPackage(deployFolder, commitSelectionArr, sourceBU)](#Deploy.createDeltaPackage) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [._getConfigForToBranch(branch)](#Deploy._getConfigForToBranch) ⇒ <code>string</code>
    * [.deployBU(bu)](#Deploy.deployBU) ⇒ <code>object</code>
    * [.replaceAssetKeys(bu, commitSelectionArr, deployResult)](#Deploy.replaceAssetKeys) ⇒ <code>void</code>
    * [.merge(promotionBranch, currentBranch)](#Deploy.merge) ⇒ <code>void</code>
    * [.replaceMarketValues(commitSelectionArr)](#Deploy.replaceMarketValues) ⇒ <code>void</code>

<a name="Deploy.stashChanges"></a>

### Deploy.stashChanges()
used to ensure our working directory is clean before checking out branches

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
<a name="Deploy.retrieveAndCommit"></a>

### Deploy.retrieveAndCommit(targetBU, commitSelectionArr) ⇒ <code>Array.&lt;string&gt;</code>
retrieve the new values into the targets folder so it can be commited later.

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>Array.&lt;string&gt;</code> - gitDiffArr  

| Param | Type | Description |
| --- | --- | --- |
| targetBU | <code>string</code> | buname of source BU |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of committed components based on user selection |

<a name="Deploy.commit"></a>

### Deploy.commit([commitMsgLines]) ⇒ <code>Array.&lt;string&gt;</code>
Commits after adding selected components

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>Array.&lt;string&gt;</code> - gitDiffArr  

| Param | Type | Description |
| --- | --- | --- |
| [commitMsgLines] | <code>Array.&lt;string&gt;</code> | paragraphs of commit message |

<a name="Deploy.getCommitMessage"></a>

### Deploy.getCommitMessage(targetBU, commitSelectionArr) ⇒ <code>Array.&lt;string&gt;</code>
helper for Deploy.retrieveAndCommit that creates a multi-line commit msg

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>Array.&lt;string&gt;</code> - commitMsgLines  

| Param | Type | Description |
| --- | --- | --- |
| targetBU | <code>string</code> | name of BU we deployed to incl. credential name |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of committed components based on user selection |

<a name="Deploy._convertCommitToDeltaPkgItems"></a>

### Deploy.\_convertCommitToDeltaPkgItems(commitSelectionArr, sourceBU) ⇒ <code>Array.&lt;TYPE.DeltaPkgItem&gt;</code>
convert CommitSelection[] to DeltaPkgItem[]

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>Array.&lt;TYPE.DeltaPkgItem&gt;</code> - format required by mcdev.createDeltaPkg  

| Param | Type | Description |
| --- | --- | --- |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of committed components based on user selection |
| sourceBU | <code>string</code> | buname of source BU |

<a name="Deploy.getDeployFolder"></a>

### Deploy.getDeployFolder() ⇒ <code>string</code>
Determines the deploy folder from MC Dev configuration (.mcdev.json)

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>string</code> - deploy folder  
<a name="Deploy.updateMarketLists"></a>

### Deploy.updateMarketLists(sourceBU, targetBU, marketVariables) ⇒ <code>void</code>
**Kind**: static method of [<code>Deploy</code>](#Deploy)  

| Param | Type | Description |
| --- | --- | --- |
| sourceBU | <code>string</code> | cred/buname of source BU |
| targetBU | <code>string</code> | cred/buname of target BU |
| marketVariables | <code>object</code> | straight from the (converted) environment variables |

<a name="Deploy.createDeltaPackage"></a>

### Deploy.createDeltaPackage(deployFolder, commitSelectionArr, sourceBU) ⇒ <code>Promise.&lt;boolean&gt;</code>
Create the delta package containing the changed components
return whether the delta package is empty or not

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - true: files found, false: not  

| Param | Type | Description |
| --- | --- | --- |
| deployFolder | <code>string</code> | path |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of committed components based on user selection |
| sourceBU | <code>string</code> | buname of source BU |

<a name="Deploy._getConfigForToBranch"></a>

### Deploy.\_getConfigForToBranch(branch) ⇒ <code>string</code>
Returns the to branch to use when accessing MC Dev configuration
The branch is the normal PR to branch, except if the PR is for a release or hotfix.
Release- and hotfix branches have a detailed release or hotfix number in the branch name,
and rather than using these detailed names the configuration used only 'release' resp. 'hotfix'.

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>string</code> - configBranch value to look for in config  

| Param | Type | Description |
| --- | --- | --- |
| branch | <code>string</code> | value from copado config |

<a name="Deploy.deployBU"></a>

### Deploy.deployBU(bu) ⇒ <code>object</code>
Deploys one specific BU.
In case of errors, the deployment is not stopped.

**Kind**: static method of [<code>Deploy</code>](#Deploy)  
**Returns**: <code>object</code> - deployResult  

| Param | Type | Description |
| --- | --- | --- |
| bu | <code>string</code> | name of BU |

<a name="Deploy.replaceAssetKeys"></a>

### Deploy.replaceAssetKeys(bu, commitSelectionArr, deployResult) ⇒ <code>void</code>
**Kind**: static method of [<code>Deploy</code>](#Deploy)  

| Param | Type | Description |
| --- | --- | --- |
| bu | <code>string</code> | name of BU |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of committed components based on user selection |
| deployResult | <code>object</code> | result of deployment |

<a name="Deploy.merge"></a>

### Deploy.merge(promotionBranch, currentBranch) ⇒ <code>void</code>
Merge from branch into target branch

**Kind**: static method of [<code>Deploy</code>](#Deploy)  

| Param | Type | Description |
| --- | --- | --- |
| promotionBranch | <code>string</code> | commit id to merge |
| currentBranch | <code>string</code> | should be master in most cases |

<a name="Deploy.replaceMarketValues"></a>

### Deploy.replaceMarketValues(commitSelectionArr) ⇒ <code>void</code>
applies market values of target onto name and key of commitSelectionArr

**Kind**: static method of [<code>Deploy</code>](#Deploy)  

| Param | Type | Description |
| --- | --- | --- |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of items to be added |

<a name="Init"></a>

## Init
Class for Init function

**Kind**: global class  
<a name="Init.mcdevInit"></a>

### Init.mcdevInit(credentials, credentialName, options)
**Kind**: static method of [<code>Init</code>](#Init)  

| Param | Type | Description |
| --- | --- | --- |
| credentials | <code>object</code> | the credentials for the salesforce marketing cloud |
| credentialName | <code>string</code> | the credential name |
| options | <code>object</code> | contains the url, the downloadBUs and the gitPush values |

<a name="Retrieve"></a>

## Retrieve
handles downloading metadata

**Kind**: global class  

* [Retrieve](#Retrieve)
    * [.getRetrieveFolder()](#Retrieve.getRetrieveFolder) ⇒ <code>string</code>
    * [.retrieveChangelog(sourceBU)](#Retrieve.retrieveChangelog) ⇒ <code>object</code>

<a name="Retrieve.getRetrieveFolder"></a>

### Retrieve.getRetrieveFolder() ⇒ <code>string</code>
Determines the retrieve folder from MC Dev configuration (.mcdev.json)
TODO: replace by simply requiring the config file

**Kind**: static method of [<code>Retrieve</code>](#Retrieve)  
**Returns**: <code>string</code> - retrieve folder  
<a name="Retrieve.retrieveChangelog"></a>

### Retrieve.retrieveChangelog(sourceBU) ⇒ <code>object</code>
Retrieve components into a clean retrieve folder.
The retrieve folder is deleted before retrieving to make
sure we have only components that really exist in the BU.

**Kind**: static method of [<code>Retrieve</code>](#Retrieve)  
**Returns**: <code>object</code> - changelog JSON  

| Param | Type | Description |
| --- | --- | --- |
| sourceBU | <code>string</code> | specific subfolder for downloads |

<a name="Commit"></a>

## Commit
methods to handle interaction with the copado platform

**Kind**: global class  

* [Commit](#Commit)
    * [.retrieveCommitSelection(sourceBU, commitSelectionArr)](#Commit.retrieveCommitSelection) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.addSelectedComponents(gitAddArr)](#Commit.addSelectedComponents) ⇒ <code>void</code>
    * [.commit(originalSelection)](#Commit.commit) ⇒ <code>void</code>

<a name="Commit.retrieveCommitSelection"></a>

### Commit.retrieveCommitSelection(sourceBU, commitSelectionArr) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Retrieve components into a clean retrieve folder.
The retrieve folder is deleted before retrieving to make
sure we have only components that really exist in the BU.

**Kind**: static method of [<code>Commit</code>](#Commit)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - list of files to git add & commit  

| Param | Type | Description |
| --- | --- | --- |
| sourceBU | <code>string</code> | specific subfolder for downloads |
| commitSelectionArr | <code>Array.&lt;TYPE.CommitSelection&gt;</code> | list of items to be added |

<a name="Commit.addSelectedComponents"></a>

### Commit.addSelectedComponents(gitAddArr) ⇒ <code>void</code>
After components have been retrieved,
adds selected components to the Git history.

**Kind**: static method of [<code>Commit</code>](#Commit)  

| Param | Type | Description |
| --- | --- | --- |
| gitAddArr | <code>Array.&lt;string&gt;</code> | list of items to be added |

<a name="Commit.commit"></a>

### Commit.commit(originalSelection) ⇒ <code>void</code>
Commits after adding selected components

**Kind**: static method of [<code>Commit</code>](#Commit)  

| Param | Type | Description |
| --- | --- | --- |
| originalSelection | <code>Array.&lt;string&gt;</code> | list of paths that the user wanted to commit |

<a name="Copado"></a>

## Copado
methods to handle interaction with the copado platform

**Kind**: global class  

* [Copado](#Copado)
    * [.attachJson(localPath, [parentSfid], [async], [preMsg])](#Copado.attachJson) ⇒ <code>void</code>
    * [.attachLog(localPath)](#Copado.attachLog) ⇒ <code>Promise.&lt;void&gt;</code>
    * [._downloadFile(fileSFID, [preMsg])](#Copado._downloadFile) ⇒ <code>void</code>
    * [.getJsonFile(fileSFID, fileName, [preMsg])](#Copado.getJsonFile) ⇒ <code>Array.&lt;TYPE.CommitSelection&gt;</code>
    * [.checkoutSrc(workingBranch, [createBranch])](#Copado.checkoutSrc) ⇒ <code>void</code>
    * [.deleteBranch(featureBranch)](#Copado.deleteBranch) ⇒ <code>void</code>
    * [.uploadToolLogs()](#Copado.uploadToolLogs) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="Copado.attachJson"></a>

### Copado.attachJson(localPath, [parentSfid], [async], [preMsg]) ⇒ <code>void</code>
Finally, attach the resulting metadata JSON to the source environment

**Kind**: static method of [<code>Copado</code>](#Copado)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| localPath | <code>string</code> |  | where we stored the temporary json file |
| [parentSfid] | <code>string</code> |  | record to which we attach the json. defaults to result record if not provided |
| [async] | <code>boolean</code> | <code>false</code> | optional flag to indicate if the upload should be asynchronous |
| [preMsg] | <code>string</code> |  | optional message to display before uploading synchronously |

<a name="Copado.attachLog"></a>

### Copado.attachLog(localPath) ⇒ <code>Promise.&lt;void&gt;</code>
Finally, attach the resulting metadata JSON. Always runs asynchronously

**Kind**: static method of [<code>Copado</code>](#Copado)  
**Returns**: <code>Promise.&lt;void&gt;</code> - promise of log upload  

| Param | Type | Description |
| --- | --- | --- |
| localPath | <code>string</code> | where we stored the temporary json file |

<a name="Copado._downloadFile"></a>

### Copado.\_downloadFile(fileSFID, [preMsg]) ⇒ <code>void</code>
download file to CWD with the name that was stored in Salesforce

**Kind**: static method of [<code>Copado</code>](#Copado)  

| Param | Type | Description |
| --- | --- | --- |
| fileSFID | <code>string</code> | salesforce ID of the file to download |
| [preMsg] | <code>string</code> | optional message to display before uploading synchronously |

<a name="Copado.getJsonFile"></a>

### Copado.getJsonFile(fileSFID, fileName, [preMsg]) ⇒ <code>Array.&lt;TYPE.CommitSelection&gt;</code>
downloads & parses JSON file from Salesforce

**Kind**: static method of [<code>Copado</code>](#Copado)  
**Returns**: <code>Array.&lt;TYPE.CommitSelection&gt;</code> - commitSelectionArr  

| Param | Type | Description |
| --- | --- | --- |
| fileSFID | <code>string</code> | salesforce ID of the file to download |
| fileName | <code>string</code> | name of the file the download will be saved as |
| [preMsg] | <code>string</code> | optional message to display before uploading synchronously |

<a name="Copado.checkoutSrc"></a>

### Copado.checkoutSrc(workingBranch, [createBranch]) ⇒ <code>void</code>
Executes git fetch, followed by checking out the given branch
newly created branches are based on the previously checked out branch!

**Kind**: static method of [<code>Copado</code>](#Copado)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| workingBranch | <code>string</code> |  | main, feature/..., promotion/... |
| [createBranch] | <code>boolean</code> | <code>false</code> | creates workingBranch if needed |

<a name="Copado.deleteBranch"></a>

### Copado.deleteBranch(featureBranch) ⇒ <code>void</code>
Deletes the remote feature branch

**Kind**: static method of [<code>Copado</code>](#Copado)  

| Param | Type | Description |
| --- | --- | --- |
| featureBranch | <code>string</code> | branch that is going to be deleted |

<a name="Copado.uploadToolLogs"></a>

### Copado.uploadToolLogs() ⇒ <code>Promise.&lt;void&gt;</code>
to be executed at the very end

**Kind**: static method of [<code>Copado</code>](#Copado)  
**Returns**: <code>Promise.&lt;void&gt;</code> - promise of uploads  
<a name="Log"></a>

## Log
logger class

**Kind**: global class  

* [Log](#Log)
    * [.debug(msg)](#Log.debug) ⇒ <code>void</code>
    * [.warn(msg)](#Log.warn) ⇒ <code>void</code>
    * [.info(msg)](#Log.info) ⇒ <code>void</code>
    * [.error(error, [msg])](#Log.error) ⇒ <code>void</code>
    * [.result(json, [msg])](#Log.result) ⇒ <code>void</code>
    * [.progress(msg)](#Log.progress) ⇒ <code>void</code>

<a name="Log.debug"></a>

### Log.debug(msg) ⇒ <code>void</code>
**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | your log message |

<a name="Log.warn"></a>

### Log.warn(msg) ⇒ <code>void</code>
**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | your log message |

<a name="Log.info"></a>

### Log.info(msg) ⇒ <code>void</code>
**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | your log message |

<a name="Log.error"></a>

### Log.error(error, [msg]) ⇒ <code>void</code>
update job execution / result record error fields & show progress

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| error | <code>string</code> |  | your error details |
| [msg] | <code>string</code> | <code>&quot;Error&quot;</code> | optional progress message |

<a name="Log.result"></a>

### Log.result(json, [msg]) ⇒ <code>void</code>
update job execution / result record result fields & show progress

**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| json | <code>string</code> \| <code>object</code> |  | results of your execution |
| [msg] | <code>string</code> | <code>&quot;Result attached&quot;</code> | optional progress message |

<a name="Log.progress"></a>

### Log.progress(msg) ⇒ <code>void</code>
**Kind**: static method of [<code>Log</code>](#Log)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | your log message |

<a name="Util"></a>

## Util
helper class

**Kind**: global class  

* [Util](#Util)
    * [.saveJsonFile(localPath, jsObj, [beautify])](#Util.saveJsonFile) ⇒ <code>void</code>
    * [.push(destinationBranch)](#Util.push) ⇒ <code>void</code>
    * [.execCommand([preMsg], command, [postMsg])](#Util.execCommand) ⇒ <code>void</code>
    * [.execCommandReturnStatus([preMsg], command, [postMsg])](#Util.execCommandReturnStatus) ⇒ <code>number</code>
    * [.provideMCDevTools()](#Util.provideMCDevTools) ⇒ <code>void</code>
    * [.provideMCDevCredentials(credentials)](#Util.provideMCDevCredentials) ⇒ <code>void</code>
    * [.convertSourceProperties(properties)](#Util.convertSourceProperties) ⇒ <code>Object.&lt;string, string&gt;</code>
    * [.convertEnvVariables(envVariables)](#Util.convertEnvVariables) ⇒ <code>void</code>
    * [._convertEnvVars(envVarArr)](#Util._convertEnvVars) ⇒ <code>Object.&lt;string, string&gt;</code>
    * [._convertEnvChildVars(envChildVarArr)](#Util._convertEnvChildVars) ⇒ <code>Object.&lt;string, string&gt;</code>
    * [.getBuName(credName, mid)](#Util.getBuName) ⇒ <code>string</code>

<a name="Util.saveJsonFile"></a>

### Util.saveJsonFile(localPath, jsObj, [beautify]) ⇒ <code>void</code>
After components have been retrieved,
find all retrieved components and build a json containing as much
metadata as possible.

**Kind**: static method of [<code>Util</code>](#Util)  

| Param | Type | Description |
| --- | --- | --- |
| localPath | <code>string</code> | filename & path to where we store the final json for copado |
| jsObj | <code>object</code> | path where downloaded files are |
| [beautify] | <code>boolean</code> | when false, json is a 1-liner; when true, proper formatting is applied |

<a name="Util.push"></a>

### Util.push(destinationBranch) ⇒ <code>void</code>
Pushes after a successfull deployment

**Kind**: static method of [<code>Util</code>](#Util)  

| Param | Type | Description |
| --- | --- | --- |
| destinationBranch | <code>string</code> | name of branch to push to |

<a name="Util.execCommand"></a>

### Util.execCommand([preMsg], command, [postMsg]) ⇒ <code>void</code>
Execute command

**Kind**: static method of [<code>Util</code>](#Util)  

| Param | Type | Description |
| --- | --- | --- |
| [preMsg] | <code>string</code> | the message displayed to the user in copado before execution |
| command | <code>string</code> \| <code>Array.&lt;string&gt;</code> | the cli command to execute synchronously |
| [postMsg] | <code>string</code> | the message displayed to the user in copado after execution |

<a name="Util.execCommandReturnStatus"></a>

### Util.execCommandReturnStatus([preMsg], command, [postMsg]) ⇒ <code>number</code>
Execute command but return the exit code

**Kind**: static method of [<code>Util</code>](#Util)  
**Returns**: <code>number</code> - exit code  

| Param | Type | Description |
| --- | --- | --- |
| [preMsg] | <code>string</code> | the message displayed to the user in copado before execution |
| command | <code>string</code> \| <code>Array.&lt;string&gt;</code> | the cli command to execute synchronously |
| [postMsg] | <code>string</code> | the message displayed to the user in copado after execution |

<a name="Util.provideMCDevTools"></a>

### Util.provideMCDevTools() ⇒ <code>void</code>
Installs MC Dev Tools and prints the version number
TODO: This will later be moved into an according Docker container.

**Kind**: static method of [<code>Util</code>](#Util)  
<a name="Util.provideMCDevCredentials"></a>

### Util.provideMCDevCredentials(credentials) ⇒ <code>void</code>
creates credentials file .mcdev-auth.json based on provided credentials

**Kind**: static method of [<code>Util</code>](#Util)  

| Param | Type | Description |
| --- | --- | --- |
| credentials | <code>object</code> | contains source and target credentials |

<a name="Util.convertSourceProperties"></a>

### Util.convertSourceProperties(properties) ⇒ <code>Object.&lt;string, string&gt;</code>
helper that takes care of converting all environment variabels found in config to a proper key-based format

**Kind**: static method of [<code>Util</code>](#Util)  
**Returns**: <code>Object.&lt;string, string&gt;</code> - properties converted into normal json  

| Param | Type | Description |
| --- | --- | --- |
| properties | <code>Array.&lt;object&gt;</code> | directly from config |

<a name="Util.convertEnvVariables"></a>

### Util.convertEnvVariables(envVariables) ⇒ <code>void</code>
helper that takes care of converting all environment variabels found in config to a proper key-based format

**Kind**: static method of [<code>Util</code>](#Util)  

| Param | Type | Description |
| --- | --- | --- |
| envVariables | <code>object</code> | directly from config |

<a name="Util._convertEnvVars"></a>

### Util.\_convertEnvVars(envVarArr) ⇒ <code>Object.&lt;string, string&gt;</code>
helper that converts the copado-internal format for "environment variables" into an object

**Kind**: static method of [<code>Util</code>](#Util)  
**Returns**: <code>Object.&lt;string, string&gt;</code> - proper object  

| Param | Type | Description |
| --- | --- | --- |
| envVarArr | <code>Array.&lt;TYPE.EnvVar&gt;</code> | - |

<a name="Util._convertEnvChildVars"></a>

### Util.\_convertEnvChildVars(envChildVarArr) ⇒ <code>Object.&lt;string, string&gt;</code>
helper that converts the copado-internal format for "environment variables" into an object

**Kind**: static method of [<code>Util</code>](#Util)  
**Returns**: <code>Object.&lt;string, string&gt;</code> - proper object  

| Param | Type | Description |
| --- | --- | --- |
| envChildVarArr | <code>Array.&lt;TYPE.EnvChildVar&gt;</code> | - |

<a name="Util.getBuName"></a>

### Util.getBuName(credName, mid) ⇒ <code>string</code>
Determines the retrieve folder from MC Dev configuration (.mcdev.json)

**Kind**: static method of [<code>Util</code>](#Util)  
**Returns**: <code>string</code> - retrieve folder  

| Param | Type | Description |
| --- | --- | --- |
| credName | <code>string</code> | - |
| mid | <code>string</code> | - |

<a name="run"></a>

## run() ⇒ <code>void</code>
main method that combines runs this function

**Kind**: global function  

* [run()](#run) ⇒ <code>void</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>

<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run"></a>

## run() ⇒ <code>void</code>
main method that combines runs this function

**Kind**: global function  

* [run()](#run) ⇒ <code>void</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>

<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run"></a>

## run() ⇒ <code>void</code>
main method that combines runs this function

**Kind**: global function  

* [run()](#run) ⇒ <code>void</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>

<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run"></a>

## run() ⇒ <code>void</code>
main method that combines runs this function

**Kind**: global function  

* [run()](#run) ⇒ <code>void</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
    * [~commitSelectionArr](#run..commitSelectionArr) : <code>Array.&lt;TYPE.CommitSelection&gt;</code>

<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="run..commitSelectionArr"></a>

### run~commitSelectionArr : <code>Array.&lt;TYPE.CommitSelection&gt;</code>
**Kind**: inner property of [<code>run</code>](#run)  
<a name="EnvChildVar"></a>

## EnvChildVar : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| n | <code>string</code> | Name |
| k | <code>string</code> | Key (Customer Key / External Key) |
| t | <code>string</code> | metadata type |
| [cd] | <code>string</code> | created date |
| [cb] | <code>string</code> | created by name |
| [ld] | <code>string</code> | last modified date |
| [lb] | <code>string</code> | last modified by name |
| value | <code>string</code> | variable value |
| scope | <code>string</code> | ? |
| name | <code>string</code> | variable name |
| environmentVariables | <code>Array.&lt;EnvVar&gt;</code> | list of environment variables |
| environmentName | <code>string</code> | name of environment in Copado |

<a name="CommitSelection"></a>

## CommitSelection : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [u] | <code>string</code> | copado__User_Story__c.Name (US-00000101) only available during Deploy |
| t | <code>string</code> | type |
| n | <code>string</code> | name |
| m | <code>string</code> | ??? |
| j | <code>string</code> | json string with exta info "{\"key\":\"test-joern-filter-de\"}" |
| c | <code>&#x27;sfmc&#x27;</code> | system |
| a | <code>&#x27;add&#x27;</code> | action |

<a name="DeltaPkgItem"></a>

## DeltaPkgItem : <code>&#x27;accountUser&#x27;</code> \| <code>&#x27;asset&#x27;</code> \| <code>&#x27;attributeGroup&#x27;</code> \| <code>&#x27;automation&#x27;</code> \| <code>&#x27;campaign&#x27;</code> \| <code>&#x27;contentArea&#x27;</code> \| <code>&#x27;dataExtension&#x27;</code> \| <code>&#x27;dataExtensionField&#x27;</code> \| <code>&#x27;dataExtensionTemplate&#x27;</code> \| <code>&#x27;dataExtract&#x27;</code> \| <code>&#x27;dataExtractType&#x27;</code> \| <code>&#x27;discovery&#x27;</code> \| <code>&#x27;email&#x27;</code> \| <code>&#x27;emailSendDefinition&#x27;</code> \| <code>&#x27;eventDefinition&#x27;</code> \| <code>&#x27;fileTransfer&#x27;</code> \| <code>&#x27;filter&#x27;</code> \| <code>&#x27;folder&#x27;</code> \| <code>&#x27;ftpLocation&#x27;</code> \| <code>&#x27;importFile&#x27;</code> \| <code>&#x27;interaction&#x27;</code> \| <code>&#x27;list&#x27;</code> \| <code>&#x27;mobileCode&#x27;</code> \| <code>&#x27;mobileKeyword&#x27;</code> \| <code>&#x27;query&#x27;</code> \| <code>&#x27;role&#x27;</code> \| <code>&#x27;script&#x27;</code> \| <code>&#x27;setDefinition&#x27;</code> \| <code>&#x27;triggeredSendDefinition&#x27;</code>
TYPES DEFINED BY mcdev. copied here for easier reference

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>SupportedMetadataTypes</code> | metadata type |
| externalKey | <code>string</code> | key |
| name | <code>string</code> | name |
| gitAction | <code>&#x27;move&#x27;</code> \| <code>&#x27;add/update&#x27;</code> \| <code>&#x27;delete&#x27;</code> | what git recognized as an action |
| _credential | <code>string</code> | mcdev credential name |
| _businessUnit | <code>string</code> | mcdev business unit name inside of _credential |

