const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Función genérica para llamar a IAs (DeepSeek, OpenAI, Anthropic)
 */
async function callAI(prompt, systemPrompt, config = {}) {
    const {
        provider = 'deepseek',
        apiKey = '',
        model = '',
        temperature = 0.7
    } = config;

    if (!apiKey) throw new Error('API Key is missing for ' + provider);

    let apiEndpoint = '';
    let authHeader = `Bearer ${apiKey}`;
    let body = {};

    if (provider === 'deepseek') {
        apiEndpoint = 'https://api.deepseek.com/chat/completions';
        body = {
            model: model || "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            stream: false,
            temperature: temperature
        };
    } else if (provider === 'openai') {
        apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        body = {
            model: model || "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: temperature
        };
    } else if (provider === 'anthropic') {
        apiEndpoint = 'https://api.anthropic.com/v1/messages';
        authHeader = ''; // Se usa x-api-key
        body = {
            model: model || "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: temperature
        };
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
                ...(provider === 'anthropic' && {
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                })
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || `AI API Error ${response.status}`);
        }

        const data = await response.json();

        if (provider === 'anthropic') return data.content[0].text;
        return data.choices[0].message.content;

    } catch (error) {
        console.error(`[AI UTIL ERROR] ${provider}:`, error.message);
        throw error;
    }
}

module.exports = { callAI };
