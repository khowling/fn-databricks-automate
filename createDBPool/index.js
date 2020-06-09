const https = require('https')
async function fetch(bearertoken, method, url, headers = {}, body) {

    return new Promise(function(resolve, reject) {
        const req = https.request(url, {method, "headers": {...headers, 'Authorization': 'Bearer ' + bearertoken, 'Content-type': 'application/json'}}, (res) => {
            const   { statusCode, statusMessage } = res,
                    contentType = res.headers['content-type']
                    
            res.setEncoding('utf8')
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; })

            res.on('end', () => {
                if (statusCode > 299 ) {
                    return reject(`API Call [${url}] Failed : ${statusCode} ${statusMessage} ${rawData}`)
                } else if (!/^application\/json/.test(contentType)) {
                    return resolve(rawData)
                } else {
                    try {
                        const parsedData = JSON.parse(rawData)
                        return resolve (parsedData)
                    } catch (e) {
                        return reject(e.message)
                    }
                }
            });
            }).on('error', (e) => {  return reject(e.message)  })

        if (method === 'POST' || method === 'PUT') {
            req.write(body)
        }
        req.end()
    })
}

module.exports = async function (context, req) {

    const 
        kvName = process.env.VAULT_NAME,
        poolName = process.env.DB_POOL_NAME,
        secretName = process.env.VAULT_SECRET_NAME,
        dbOrgId = process.env.DB_ORG_ID,
        // using the 'token' binding, this requries the binding and the functionapp authorisation to be configured, and it doesnt use managed identity :(
        {kvToken, dbToken} = context.bindings

    try {

        if (!kvName || !poolName || !secretName || !dbOrgId) {
            throw "Function settings not configured, please contact your administrator"
        }

        const createPool = await fetch (dbToken, 'POST', `https://adb-${dbOrgId}.azuredatabricks.net/api/2.0/instance-pools/create`, {'X-Databricks-Org-Id': dbOrgId.split(".")[0]}, 
            JSON.stringify({
                "instance_pool_name": poolName,
                "node_type_id": "Standard_D3_v2",
                "min_idle_instances": 0, "max_capacity":2
            })
        )

        const insertSecret = await fetch (kvToken, 'PUT',  `https://${kvName}.vault.azure.net/secrets/${secretName}?api-version=7.0`, {},
            JSON.stringify({"value": createPool.instance_pool_id})
        )

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: JSON.stringify(insertSecret)
        }
    } catch (e) {
        context.res = {
            status: 500,
            body: e
        }
    }
};



