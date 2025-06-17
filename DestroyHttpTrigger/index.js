const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function for destroy processed a request.');

    // These should be set in your Azure Function App's configuration
    const GITLAB_TOKEN = process.env.DESTROY_GITLAB_TRIGGER_TOKEN;
    const GITLAB_PROJECT_ID = process.env.DESTROY_GITLAB_PROJECT_ID;
    const GITLAB_REF = process.env.DESTROY_GITLAB_REF || 'main';

    if (!GITLAB_TOKEN || !GITLAB_PROJECT_ID) {
        context.res = {
            status: 500,
            body: "GitLab destroy trigger environment variables not set on server."
        };
        return;
    }

    const { VM_NAME } = req.body;

    if (!VM_NAME) {
        context.res = {
            status: 400,
            body: "Missing required VM parameter: VM_NAME"
        };
        return;
    }

    const triggerUrl = `https://gitlab.com/api/v4/projects/${GITLAB_PROJECT_ID}/trigger/pipeline`;
    const formData = new URLSearchParams();
    formData.append('token', GITLAB_TOKEN);
    formData.append('ref', GITLAB_REF);
    formData.append('variables[VM_NAME]', VM_NAME);

    try {
        const response = await fetch(triggerUrl, {
            method: 'POST',
            body: formData
        });

        const jsonResponse = await response.json();

        if (!response.ok) {
            throw new Error(`GitLab API responded with status: ${response.status} - ${JSON.stringify(jsonResponse)}`);
        }
        
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonResponse
        };

    } catch (error) {
        context.log.error('Failed to trigger destroy pipeline:', error);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }
};