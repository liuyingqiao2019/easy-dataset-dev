/**
 * Ollama API 调用工具类
 */
const http = require('http');

class OllamaAPI {
  constructor(config = {}) {
    this.host = config.host || '127.0.0.1';
    this.port = config.port || 11434;
    this.model = config.model || 'llama2';
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  /**
   * 获取本地可用的模型列表
   * @returns {Promise<Array>} 返回模型列表
   */
  async getModels() {
    try {
      const response = await this._makeRequest('/api/tags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 处理响应，提取模型名称
      if (response && response.models) {
        return response.models.map(model => ({
          name: model.name,
          modified_at: model.modified_at,
          size: model.size
        }));
      }

      return [];
    } catch (error) {
      console.error('获取 Ollama 模型列表出错:', error);
      throw error;
    }
  }

  /**
   * 发送HTTP请求
   * @private
   */
  _makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: options.method,
        headers: options.headers
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
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
}

module.exports = OllamaAPI;
