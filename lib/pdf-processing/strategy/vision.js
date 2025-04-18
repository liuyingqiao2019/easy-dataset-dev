import { getProjectRoot } from '@/lib/db/base';
import { getTaskConfig, getProjectModelConfig } from '@/lib/db/projects';
import convertPrompt from '@/lib/llm/prompts/pdfToMarkdown';
import convertPromptEn from '@/lib/llm/prompts/pdfToMarkdownEn';
import reTitlePrompt from '@/lib/llm/prompts/optimalTitle';
import reTitlePromptEn from '@/lib/llm/prompts/optimalTitleEn';
import path from 'path';
//import parsePdf from 'pdf2md-js'

class VisionStrategy {
  async process (projectId, fileName, options) {
    // try {
    //     console.log("正在执行Vision转换策略......");
    //     const pdf2md = await import('pdf2md-js/src/index')

    //     // 获取项目路径
    //     const projectRoot = await getProjectRoot();
    //     const projectPath = path.join(projectRoot, projectId);
    //     const filePath = path.join(projectPath, 'files', fileName);
    //     // 获取项目 task-config 和 models 信息
    //     const taskConfig = await getTaskConfig(projectId);
    //     const modelConfig = await getProjectModelConfig(projectId);
    //     const visionId = options.visionModelId;
    //     if (visionId === undefined || visionId === null || visionId === '') {
    //         throw new Error('请检查是否配置PDF转换视觉大模型');
    //     }

    //     const model = modelConfig.find(item => item.id === visionId);

    //     //模型使用前检查
    //     if (!model) {
    //         throw new Error('请检查是否配置PDF转换视觉大模型');
    //     }

    //     if (model.type !== "vision") {
    //         throw new Error(`${model.name}(${model.provider}) 此模型不是视觉大模型，请检查【模型配置】`);
    //     }

    //     if (!model.apiKey) {
    //         throw new Error(`${model.name}(${model.provider}) 此模型未配置API密钥，请检查【模型配置】`);
    //     }

    //     //豆包和chatgpt模型特殊处理一下
    //     let baseUrl = model.endpoint;
    //     if (model.name.startsWith('gpt-4') || model.name.startsWith('gpt-3.5') || model.name.startsWith('doubao')) {
    //         if (!baseUrl.includes('/chat/completions')) {
    //             baseUrl = baseUrl.endsWith('/')
    //                 ? `${baseUrl}chat/completions`
    //                 : `${baseUrl}/chat/completions`;
    //         }
    //     }

    //     const convert = options.language === 'en' ? convertPrompt : convertPromptEn;

    //     const reTitle = options.language === 'en' ? reTitlePrompt : reTitlePromptEn;

    //     const config = {
    //         // 测试PDF文件路径
    //         pdfPath: filePath,

    //         // 输出目录
    //         outputDir: path.join(projectPath, 'files'),

    //         // API密钥 (从环境变量获取或手动设置)
    //         apiKey: model.apiKey,

    //         // 模型配置
    //         model: model.name,
    //         baseUrl: baseUrl,

    //         // 使用全页模式
    //         useFullPage: true,

    //         // 是否保留中间生成的图像文件
    //         verbose: false,

    //         // 并发处理数量
    //         concurrency: taskConfig.visionConcurrencyLimit,

    //         //设置PDF转换提示词
    //         prompt: convert(),

    //         //设置优化md文件标题提示词
    //         textPrompt: reTitle()

    //     }
    //     //先尝试正常调
    //     console.log('Vison策略 开始处理PDF文件');
    //     try {
    //         console.log('Vison策略 尝试调用原生接口。');
    //         await pdf2md.parsePdf(filePath, config);
    //     } catch (error) {
    //         console.error('Vison策略 尝试调用原生接口出错:', error);
    //         console.log('Vison策略 重新尝试OPENAI兼容接口');
    //         //如果出现异常，尝试使用openai兼容接口
    //         if (!baseUrl.includes('/chat/completions')) {
    //             baseUrl = baseUrl.endsWith('/')
    //                 ? `${baseUrl}chat/completions`
    //                 : `${baseUrl}/chat/completions`;
    //         }
    //         config.baseUrl = baseUrl;
    //         const openAiApicompatibleConfig = {
    //             ...config,
    //             openAiApicompatible: true //开启使用openai兼容接口配置
    //         };
    //         try {
    //             await pdf2md.parsePdf(filePath, openAiApicompatibleConfig);
    //         } catch (error) {
    //             console.error('Vision 策略 OPENAI兼容接口调用出错:', error);
    //         }
    //     }
    // } catch (error) {
    //     console.error('Vision 策略调用出错:', error);
    //     throw error;
    // }
  }
}

module.exports = VisionStrategy;