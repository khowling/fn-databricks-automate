

##  Function Purpose

To be used in a Pipeline, to automate the creation of a Databricks Pool


##  To Create In Azure

### Prerequisites

 * `func` cli version 3
 * `az` cli
 * `.NET Core SDK` version 3.1

### Steps

 1. Create the __Service Principal__.   This is the identity the function will use to create the Databricks PAT and Pool
 
    ```
    az ad sp create-for-rbac --name <fn_name>
    ```

    *NOTE: record the output, you will need the __appId__, __password__, and __tenant__ later.
    
        ```
        {
        "appId": "xxxx",
        "displayName": "kh-dbricks-fn",
        "name": "http://kh-dbricks-fn",
        "password": "xxxx",
        "tenant": "xxxx"
        }
        ```

2.  Assign Permissions to the __Service Principal__ to operate on the KeyVault and Databricks

    1. Add Access Policy for 'Secret Management' 
    2. Add the service principal to the admin group of the workspace. To do this use the [admin login](https://docs.microsoft.com/en-us/azure/databricks/dev-tools/api/latest/aad/service-prin-aad-token#admin-user-login) as shown in this [sample code](https://github.com/hurtn/databricks/blob/master/Add Service Principal to Workspace (Admin Login).ipynb). The service principal must also be a granted the contributor role in the workspace.

2.  Create the Function App

    ```
    ## Create Storage Account for functionapp
    az storage account create -g <resource_group> -n <storage_account> --location westeurope --sku Standard_LRS --kind StorageV2
    
    ## Create Functionapp
    az functionapp create --functions-version 3 --os-type Windows --runtime node -g <resource_group> -n <fn_name>   --consumption-plan-location westeurope -s <storage_account>


    ## Set App Settings
    az functionapp config appsettings set -g <resource_group> -n <fn_name> --settings "VAULT_NAME=<keyvault_name>" "VAULT_SECRET_NAME=<keyvault_secret_name>" "DB_POOL_NAME=<dbricks_pool_name>" "DB_ORG_ID=<dbricks_org_id>"

    ## Enable Auth token binding
    az webapp auth update --resource-group <resource_group> --name <fn_name> --enabled true --action AllowAnonymous --aad-client-id '<SP_appId>' --aad-token-issuer-url 'https://sts.windows.net/<SP_tenant>/' --aad-client-secret '<SP_password>
    ```

3. Clone this repo to your local environment and deploy the functionapp code

    ```
    func azure functionapp publish <fn_name>
    ```
