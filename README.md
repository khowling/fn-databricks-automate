

##  Function Purpose

To be used in a Pipeline, to automate the creation of a Data Bricks Pool


##  To Create In Azure

### Prerequisites

 * `func` cli version 3
 * `az` cli
 * `.NET Core SDK` version 3.1

### Steps

 1. Create the __Service Principle__.   This is the identity the function will use to create the DataBricks Pool
 
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

2.  Assign Permissions to the __Service Principle__ to operate on the KeyVault and DataBricks

    1. Add Access Policy for 'Secret Management' 
    2. DataBricks ??

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

3. Deploy the functionapp code

    ```
    func azure functionapp publish <fn_name>
    ```
