import { createOllama } from 'ollama-ai-provider';
import BaseClient from './base.js';

class OllamaClient extends BaseClient {
  constructor(config) {
    super(config);
    this.ollama = createOllama({
      baseURL: this.endpoint,
      apiKey: this.apiKey
    });
  }

  _getModel() {
    return this.ollama(this.model);
  }

  /**
   * 获取本地可用的模型列表
   * @returns {Promise<Array>} 返回模型列表
   */
  async getModels() {
    try {
      const response = await fetch(this.endpoint + '/tags');
      const data = await response.json();
      // 处理响应，提取模型名称
      if (data && data.models) {
        return data.models.map(model => ({
          name: model.name,
          modified_at: model.modified_at,
          size: model.size
        }));
      }
      return [];
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
}

module.exports = OllamaClient;
