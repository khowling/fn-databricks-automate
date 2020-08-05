const https = require('https')
async function fetch(bearertoken, method, url, headers = {}, body) {

    return new Promise(function(resolve, reject) {
        let req_headers = {...headers, 'Authorization': 'Bearer ' + bearertoken, 'Content-type': 'application/json'}
        if (method === `POST`) {
            req_headers["Content-length"] = Buffer.byteLength(body)
        }
        const req = https.request(url, {method, headers: req_headers}, (res) => {
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
        patComment = req.query.patsecretname,
        secretName = req.query.patsecretname,
        dbOrgId = process.env.DB_ORG_ID,
        // using the 'token' binding, this requries the binding and the functionapp authorisation to be configured, and it doesnt use managed identity :(
        {kvToken, dbToken} = context.bindings

    try {

        if (!kvName || !patComment || !secretName || !dbOrgId) {
            throw "Function settings not configured, please contact your administrator"
        }

        const createPAT = await fetch (dbToken, 'POST', `https://adb-${dbOrgId}.azuredatabricks.net/api/2.0/token/create`, {'X-Databricks-Org-Id': dbOrgId.split(".")[0]}, 
            JSON.stringify({"comment":"ADF Blog 56"})
        )

        const insertSecret = await fetch (kvToken, 'PUT',  `https://${kvName}.vault.azure.net/secrets/${secretName}?api-version=7.0`, {},
            JSON.stringify({"value": createPAT.token_value})
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



