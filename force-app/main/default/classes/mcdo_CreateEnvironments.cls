/**
 * This class is used by the MC Init function,
 * responsible for creating all environments 
 */
global class mcdo_CreateEnvironments implements copado.JobExecutionCallback  {    
    global void execute(copado__JobExecution__c job, String status) {        
        // in case of error:
        if(status == 'Error') {
            
            // handle Error            
            System.debug('Error: ' + job.copado__ErrorMessage__c);
            
        } else if(status == 'Successful') {
            
            // handle Success         
            // Go through the environment json array
            List<Object> dataJson = (List<Object>)JSON.deserializeUntyped(job.copado__DataJson__c);
            for(Object env : dataJson){
                
                Map<String,Object> environment = (Map<String,Object>)env;
                String envName = environment.get('Name').toString();
				
                // create the environment
                copado__Environment__c environmentCopado = new copado__Environment__c(
                    copado__Platform__c='Marketing Cloud', 
                    Name=envName
                );
                insert environmentCopado;
                
                // Create a list of environment variables so we can add all of them in here and then insert them
                // this way we will avoid to get into governor limits
                List<copado__Environmental_Variable__c> envVarList = new List<copado__Environmental_Variable__c>();
                
                // Go through the environmentVariables json array                
             	List<Object> environmentVariables = (List<Object>) environment.get('environmentVariables');
                for(Object var: environmentVariables){
                    Map<String,Object> variables = (Map<String,Object>)var;
                    String envVarName = variables.get('name').toString();
                    String envVarValue = variables.get('value').toString();
                    
                    // create the environment variable
                    copado__Environmental_Variable__c environmentVariableCopado = new copado__Environmental_Variable__c(
                        copado__Environment__c=environmentCopado.id,
                        Name=envVarName,
                        copado__Value__c=envVarValue
                    );
                    
                    //add it to the list
                   	envVarList.add(environmentVariableCopado);
                }           
                
              	//insert the list
                insert envVarList;
                
                // Create a list of system properties as well
                // this way we will avoid to get into governor limits
                List<copado__System_Property__c> sysPropList = new List<copado__System_Property__c>();
                
                // Go through the systemProperties json array                
             	List<Object> systemProperties = (List<Object>) environment.get('properties');
                for(Object prop: systemProperties){
                    Map<String,Object> properties = (Map<String,Object>)prop;
                    String sysPropName = properties.get('name').toString();
                    String sysPropApiName = properties.get('apiName').toString();
                    String sysPropValue = properties.get('value').toString();
                    Boolean sysPropHideValue = Boolean.valueOf(properties.get('hideValue'));
                    
                    // create the system property
                    copado__System_Property__c systemPropertyCopado = new copado__System_Property__c(
                        copado__Environment__c=environmentCopado.id,
                        Name=sysPropName,
                        copado__API_Name__c=sysPropApiName,
                        copado__Value__c=sysPropValue,
                        copado__Is_Sensitive__c=sysPropHideValue
                    );
                    
                    //add it to the list
                   	sysPropList.add(systemPropertyCopado);
                }
                
                //insert the list
                insert sysPropList;
            }             
        } else {
            
            // handle In progress if necessary
            System.debug('still in progress...');
            
        }
    }
}