/**
 * LLM API 统一调用工具类
 * 支持多种模型提供商：OpenAI、Ollama、智谱AI等
 * 支持普通输出和流式输出
 */
import http from 'http';
import https from 'https';
import { generateText, streamText } from 'ai';

class LLMClient {
    /**
     * 创建 LLM 客户端实例
     * @param {Object} config - 配置信息
     * @param {string} config.provider - 提供商名称，如 'openai', 'ollama', 'zhipu' 等
     * @param {string} config.endpoint - API 端点，如 'https://api.openai.com/v1/'
     * @param {string} config.apiKey - API 密钥（如果需要）
     * @param {string} config.model - 模型名称，如 'gpt-3.5-turbo', 'llama2' 等
     */
    constructor(config = {}) {
        this.provider = config.provider || 'openai';
        this.endpoint = config.endpoint || '';
        this.apiKey = config.apiKey || '';
        this.model = config.model || '';
    }

    /**
     * 生成对话响应
     * @param {string|Array} prompt - 用户输入的提示词或对话历史
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} 返回模型响应
     */
    async chat(prompt, options = {}) {
        // 处理不同格式的 prompt
        const messages = Array.isArray(prompt)
            ? prompt
            : [{ role: 'user', content: prompt }];

        // 根据不同提供商调用不同的 API
        switch (this.provider.toLowerCase()) {
            case 'ollama':
                return this._chatOllama(messages, options);
            case 'deepseek':
                return this._chatDeepSeek(messages, options);
            case 'openai':
            case 'siliconflow': // 硅基流动兼容 OpenAI 接口
                return this._chatOpenAI(messages, options);
            case 'zhipu': { // 智谱 AI
                // 智谱 AI 的消息格式转换
                const zhipuMessages = messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }));

                return this._chatOpenAI(zhipuMessages, options);
            }
            default:
                // 默认尝试 OpenAI 兼容接口
                return this._chatOpenAI(messages, options);
        }
    }

    async getResponse(prompt, options = {}) {
        const { text } = await this.chat(prompt, options);
        return text;
    }

    async getResponseWithCOT(prompt, options = {}) {
        const { text, reasoning } = await this.chat(prompt, options);
        return { answer: text, cot: reasoning  ?? ''};
    }

    /**
     * 流式生成对话响应
     * @param {string|Array} prompt - 用户输入的提示词或对话历史
     * @param {Object} options - 可选参数
     * @returns {ReadableStream} 返回可读流
     */
    async chatStream(prompt, options = {}) {
        // 处理不同格式的 prompt
        const messages = Array.isArray(prompt)
            ? prompt
            : [{ role: 'user', content: prompt }];

        // 根据不同提供商调用不同的流式 API
        switch (this.provider.toLowerCase()) {
            case 'ollama':
                return this._chatOllamaStream(messages, options);
            case 'deepseek': // 深度求索兼容 OpenAI 接口
                return this._chatDeepSeekStream(messages, options);
            case 'openai':
            case 'siliconflow': // 硅基流动兼容 OpenAI 接口
                return this._chatOpenAIStream(messages, options);
            case 'zhipu': { // 智谱 AI
                const zhipuMessages = messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }));
                return this._chatOpenAIStream(zhipuMessages, options);
            }
            default:
                // 默认尝试 OpenAI 兼容接口
                return this._chatOpenAIStream(messages, options);
        }
    }

    /**
     * 调用 Ollama API
     * @private
     */
    async _chatOllama(messages, options) {
        try {
            const { createOllama } = await import('ollama-ai-provider');
            const ollama = createOllama({
                baseURL: this.endpoint,
            });

            return await generateText({
                model: ollama(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });
        } catch (error) {
            console.error('Ollama API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用 Ollama 流式 API
     * @private
     */
    async _chatOllamaStream(messages, options) {
        try {
            const { createOllama } = await import('ollama-ai-provider');
            const ollama = createOllama({
                baseURL: this.endpoint,
            });

            const result = streamText({
                model: ollama(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });

            return result.toTextStreamResponse();
        } catch (error) {
            console.error('Ollama 流式 API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用 DeepSeek API
     * @private
     */
    async _chatDeepSeek(messages, options) {
        try {
            const { createDeepSeek } = await import('@ai-sdk/deepseek');
            const deepseek = createDeepSeek({
                apiKey: this.apiKey,
                baseURL: this.endpoint,
            });
            return await generateText({
                model: deepseek(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });
        } catch (error) {
            console.error('DeepSeek API 调用出错:', error);
        }
    }

    /**
     * 调用 OpenAI 兼容的 API
     * @private
     */
    async _chatOpenAI(messages, options) {
        try {
            const { createOpenAI } = await import('@ai-sdk/openai');
            const openai = createOpenAI({
                apiKey: this.apiKey,
                baseURL: this.endpoint,
            });
            return await generateText({
                model: openai(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });
        } catch (error) {
            console.error('OpenAI 兼容 API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用 DeepSeek 流式 API
     * @private
     */
    async _chatDeepSeekStream(messages, options) {
        try {
            const { createDeepSeek } = await import('@ai-sdk/deepseek');
            const deepseek = createDeepSeek({
                apiKey: this.apiKey,
                baseURL: this.endpoint,
            });

            const result = streamText({
                model: deepseek(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                }
            }); 

            return result.toTextStreamResponse();
        } catch (error) {
            console.error('DeepSeek 流式 API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用 OpenAI 兼容的流式 API
     * @private
     */
    async _chatOpenAIStream(messages, options) {
        try {
            const { createOpenAI } = await import('@ai-sdk/openai');
            const openai = createOpenAI({
                apiKey: this.apiKey,
                baseURL: this.endpoint,
            });

            const result = streamText({
                model: openai(this.model),
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });

            return result.toTextStreamResponse();
        } catch (error) {
            console.error('OpenAI 兼容流式 API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用智谱 AI API
     * @private
     */
    async _chatZhipu(messages, options) {
        try {
            const url = new URL(this.endpoint);

            // 智谱 AI 的消息格式转换
            const zhipuMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

            const requestOptions = {
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                max_tokens: options.max_tokens || 2048,
                model: this.model,
                messages: zhipuMessages
            };

            const response = await this._makeHttpRequest(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestOptions)
            });

            return response;
        } catch (error) {
            console.error('智谱 AI API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 调用智谱 AI 流式 API
     * @private
     */
    async _chatZhipuStream(messages, options) {
        try {
            const url = new URL(this.endpoint);

            // 智谱 AI 的消息格式转换
            const zhipuMessages = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));

            const requestOptions = {
                temperature: options.temperature || 0.7,
                top_p: options.top_p || 0.9,
                max_tokens: options.max_tokens || 2048,
                model: this.model,
                messages: zhipuMessages,
                stream: true  // 启用流式输出
            };

            // 保存 this 引用，以在 ReadableStream 中使用
            const apiKey = this.apiKey;

            // 创建一个可读流
            return new ReadableStream({
                async start(controller) {
                    const isHttps = url.toString().startsWith('https');
                    const client = isHttps ? https : http;

                    const urlObj = new URL(url);
                    const requestOpts = {
                        hostname: urlObj.hostname,
                        port: urlObj.port || (isHttps ? 443 : 80),
                        path: `${urlObj.pathname}${urlObj.search}`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                            'Accept': 'text/event-stream'
                        }
                    };

                    // 添加一个标志来跟踪控制器状态
                    let isControllerClosed = false;

                    const req = client.request(requestOpts, (res) => {
                        if (res.statusCode !== 200) {
                            controller.error(new Error(`HTTP error! status: ${res.statusCode}`));
                            isControllerClosed = true;
                            return;
                        }

                        res.on('data', (chunk) => {
                            try {
                                // 解析智谱 AI 的流式响应
                                const text = chunk.toString();
                                const data = JSON.parse(text);

                                if (data.data) {
                                    controller.enqueue(new TextEncoder().encode(data.data.content || ''));
                                }

                                if (data.meta && data.meta.is_end) {
                                    controller.close();
                                }
                            } catch (error) {
                                console.error('处理智谱 AI 流数据出错:', error);
                            }
                        });

                        res.on('end', () => {
                            controller.close();
                        });
                    });

                    req.on('error', (error) => {
                        controller.error(error);
                    });

                    req.write(JSON.stringify(requestOptions));
                    req.end();
                }
            });
        } catch (error) {
            console.error('智谱 AI 流式 API 调用出错:', error);
            throw error;
        }
    }

    /**
     * 发送 HTTP 请求
     * @private
     */
    _makeHttpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith('https');
            const client = isHttps ? https : http;

            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: `${urlObj.pathname}${urlObj.search}`,
                method: options.method,
                headers: options.headers
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(JSON.parse(data));
                        } else {
                            reject(new Error(`请求失败，状态码: ${res.statusCode}, 响应: ${data}`));
                        }
                    } catch (error) {
                        reject(new Error('响应解析失败'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (options.body) {
                req.write(options.body);
            }

            req.end();
        });
    }

    /**
     * 获取模型列表（仅支持 Ollama）
     * @returns {Promise<Array>} 返回模型列表
     */
    async getModels() {
        if (this.provider.toLowerCase() === 'ollama') {
            return this.client.getModels();
        } else {
            throw new Error('当前提供商不支持获取模型列表');
        }
    }
}

module.exports = LLMClient;