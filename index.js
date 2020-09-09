const crypto = require("crypto");
const axios = require('axios');
const AWS = require('aws-sdk');
const asana = require('asana');

exports.handler = async (event) => {

    // SSMからパラメータを取得
    var ssm = new AWS.SSM();
    var params = {
        Names: [
            '/asana-hook/Asana-AuthToken',
            '/asana-hook/slack-notifier-url',
            '/asana-hook/asana-url',
            '/asana-hook/asana-register-section-id'
        ],
        WithDecryption: true
    };
    const secret = await ssm.getParameters(params).promise();
    const ASANA_AUTH_TOKEN = secret.Parameters.filter(params => params.Name === '/asana-hook/Asana-AuthToken')[0].Value
    const SLACK_NOTIFIER_URL = secret.Parameters.filter(params => params.Name === '/asana-hook/slack-notifier-url')[0].Value
    const ASANA_URL = secret.Parameters.filter(params => params.Name === '/asana-hook/asana-url')[0].Value
    const SECTION_ID = secret.Parameters.filter(params => params.Name === '/asana-hook/asana-register-section-id')[0].Value

    const client = asana.Client.create().useAccessToken(ASANA_AUTH_TOKEN);

    const tasks = await client.tasks.getTasks({ section: SECTION_ID, opt_pretty: true })
    .catch(err => console.error(err))
    

    await axios(
        {
            method: 'post',
            url: SLACK_NOTIFIER_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                "task_count": String(tasks.data.length),
                "asana_url": ASANA_URL
            },
        }
    ).catch(err => console.error(err))

    const response = {
        statusCode: 200
    };

    return response;
};

