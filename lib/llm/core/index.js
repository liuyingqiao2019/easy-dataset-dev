/**
 * LLM API 统一调用工具类
 * 支持多种模型提供商：OpenAI、Ollama、智谱AI等
 * 支持普通输出和流式输出
 */
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
        let messages = Array.isArray(prompt)
            ? prompt
            : [{ role: 'user', content: prompt }];

        const model = await this._getModel();
        try {
            if(this.provider.toLowerCase() === 'zhipu') {
                // 智谱 AI 的消息格式转换
                messages = messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }));
            }

            return await generateText({
                model,
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });
        } catch (error) {
            console.error('API 调用出错:', error);
            throw error;
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
        try {
            // 处理不同格式的 prompt
            let messages = Array.isArray(prompt) ? prompt : [{ role: 'user', content: prompt }];

            const model = await this._getModel();
            if(this.provider.toLowerCase() === 'zhipu') {
                // 智谱 AI 的消息格式转换
                messages = messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content
                }));
            }

            const result = streamText({
                model,
                messages,
                providerOptions: {
                    temperature: options.temperature || 0.7,
                    top_p: options.top_p || 0.9,
                    max_tokens: options.max_tokens || 2048,
                }
            });

            return result.toTextStreamResponse();
        } catch (error) {
            console.error('流式 API 调用出错:', error);
            throw error;
        }
    }

    async _getModel() {
        switch (this.provider.toLowerCase()) {
            case 'ollama': {
                const { createOllama } = await import('ollama-ai-provider');
                const ollama = createOllama({
                    baseURL: this.endpoint,
                });
                return ollama(this.model);
            }
            case 'deepseek': { // 深度求索兼容 OpenAI 接口
                const { createDeepSeek } = await import('@ai-sdk/deepseek');
                const deepseek = createDeepSeek({
                    apiKey: this.apiKey,
                    baseURL: this.endpoint,
                });
                return deepseek(this.model);
            }
            case 'zhipu':
            case 'openai':
            case 'siliconflow': // 硅基流动兼容 OpenAI 接口
            default: {
                // 默认尝试 OpenAI 兼容接口
                const { createOpenAI } = await import('@ai-sdk/openai');
                const openai = createOpenAI({
                    apiKey: this.apiKey,
                    baseURL: this.endpoint,
                });
                return openai(this.model);
            }
        }
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