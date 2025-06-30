
/**
 * 问题生成提示模板。
 * @param {string} text - 待处理的文本。
 * @param {number} number - 问题数量。
 * @param {string} language - 问题所使用的语言。
 * @param {string} globalPrompt - LLM 的全局提示。
 * @param {string} questionPrompt - 问题生成的特定提示。
 * @param {Object} activeGaPair - 当前激活的 GA对。
 * @returns {string} - 完整的提示词。
 */
module.exports = function getProblemToKeywords ({
  text,
  globalPrompt = '',
  questionPrompt = '',
}) {
  if (globalPrompt) {
    globalPrompt = `在后续的任务中，你务必遵循这样的规则：${globalPrompt}`;
  }
  if (questionPrompt) {
    questionPrompt = `- 在生成问题时，你务必遵循这样的规则：${questionPrompt}`;
  }

  return `
  <instruction>
  <instructions>
  请根据以下步骤完成关键词提取任务：
  1. 仔细阅读用户提供的问题，理解其核心内容和关注点。
  2. 识别问题中所有具有实际意义的名词、术语或短语，包括但不限于技术名称、产品名称、功能描述、核心概念等。
  3. 筛选出与问题主题直接相关的关键词，排除冗余或泛化的词汇（例如“如何”“吗”“的”等虚词）。
  4. 确保关键词的完整性，例如“PC+PHONE模式”需作为一个整体保留，而非拆分为“PC”和“PHONE”。
  5. 按照问题中出现的顺序排列关键词，用中文顿号（、）分隔，避免使用任何格式化符号（如方括号、引号等）。
  6. 最终输出仅包含关键词列表，无需添加额外说明或解释。
  7. 关键词最多提取10个,请确保这些关键词与问题之间存在强关联的关系.${globalPrompt}
  </instructions>
  </instruction>
  
  <examples>
  <example>
  <input>
  云呼的PC+PHONE模式如何提升企业通信效率和用户体验？
  </input>
  <output>
  云呼、PC+PHONE模式、企业通信效率、用户体验
  </output>
  </example>
  <example>
  <input>
  云计算技术在大数据分析中的应用有哪些优势？
  </input>
  <output>
  云计算技术、大数据分析、应用、优势
  </output>
  </example>
  <example>
  <input>
  人工智能如何改变现代客户服务的流程？
  </input>
  <output>
  人工智能、现代客户服务、流程
  </output>
  </example>
  </examples>
  <user_input>
  ${text}
  </user_input>
  <notes>
  - 关键词需严格基于问题原文，不得自行添加或推断未提及的内容。
  - 若问题中包含复合术语（如“PC+PHONE模式”），需保持其完整形式。
  - 若问题涉及多个独立主题，需分别提取每个主题的关键词。
  ${questionPrompt} 
  </notes>/no_think
    `;
};
