import { generateText, streamText } from 'ai';

class BaseClient {
  constructor(config) {
    this.endpoint = config.endpoint || '';
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.modelConfig = {
      temperature: config.temperature || 0.7,
      top_p: config.top_p || 0.9,
      max_tokens: config.max_tokens || 8192
    };
  }

  /**
   * chat（普通输出）
   */
  async chat(messages, options) {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    const model = this._getModel();
    return await generateText({
      model,
      messages: this._convertJson(messages),
      temperature: options.temperature || this.modelConfig.temperature,
      topP: options.top_p || this.modelConfig.top_p,
      maxTokens: options.max_tokens || this.modelConfig.max_tokens
    });
  }

  /**
   * chat（流式输出）
   */
  async chatStream(messages, options) {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;
    const model = this._getModel();
    const stream = streamText({
      model,
      messages: this._convertJson(messages),
      temperature: options.temperature || this.modelConfig.temperature,
      topP: options.top_p || this.modelConfig.top_p,
      maxTokens: options.max_tokens || this.modelConfig.max_tokens
    });
    return stream.toTextStreamResponse();
  }

  // 抽象方法
  _getModel() {
    throw new Error('_getModel 子类方法必须实现');
  }

  _convertJson(data) {
    return data.map(item => {
      // 只处理 role 为 "user" 的项
      if (item.role !== 'user') return item;

      const newItem = {
        role: 'user',
        content: '',
        experimental_attachments: [],
        parts: []
      };

      // 情况1：content 是字符串
      if (typeof item.content === 'string') {
        newItem.content = item.content;
        newItem.parts.push({
          type: 'text',
          text: item.content
        });
      }
      // 情况2：content 是数组
      else if (Array.isArray(item.content)) {
        item.content.forEach(contentItem => {
          if (contentItem.type === 'text') {
            // 文本内容
            newItem.content = contentItem.text;
            newItem.parts.push({
              type: 'text',
              text: contentItem.text
            });
          } else if (contentItem.type === 'image_url') {
            // 图片内容
            const imageUrl = contentItem.image_url.url;

            // 提取文件名（如果没有则使用默认名）
            let fileName = 'image.jpg';
            if (imageUrl.startsWith('data:')) {
              // 如果是 base64 数据，尝试从 content type 获取扩展名
              const match = imageUrl.match(/^data:image\/(\w+);base64/);
              if (match) {
                fileName = `image.${match[1]}`;
              }
            }

            newItem.experimental_attachments.push({
              url: imageUrl,
              name: fileName,
              contentType: imageUrl.startsWith('data:') ? imageUrl.split(';')[0].replace('data:', '') : 'image/jpeg' // 默认为 jpeg
            });
          }
        });
      }

      return newItem;
    });
  }
}

module.exports = BaseClient;
