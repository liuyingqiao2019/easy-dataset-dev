/**
 * Builds the GA prompt string.
 * @param {Object} activeGaPair - The currently active GA pair.
 * @returns {String} The constructed GA prompt string.
 */
function buildGaPrompt (activeGaPair = null) {
  if (activeGaPair && activeGaPair.active) {
    return `
## Special Requirements - Genre & Audience Perspective Questioning:
Adjust your questioning approach and question style based on the following genre and audience combination:

**Target Genre**: ${activeGaPair.genre}
**Target Audience**: ${activeGaPair.audience}

Please ensure:
1. The question should fully conform to the style, focus, depth, and other attributes defined by "${activeGaPair.genre}".
2. The question should consider the knowledge level, cognitive characteristics, and potential points of interest of "${activeGaPair.audience}".
3. Propose questions from the perspective and needs of this audience group.
4. Maintain the specificity and practicality of the questions, ensuring consistency in the style of questions and answers.
5. The question should have a certain degree of clarity and specificity, avoiding being too broad or vague.
`;
  }

  return '';
}

/**
 * Question generation prompt template.
 * @param {string} text - The text to be processed.
 * @param {number} number - The number of questions.
 * @param {string} language - The language of the questions.
 * @param {string} globalPrompt - Global prompt for the LLM.
 * @param {string} questionPrompt - Specific prompt for question generation.
 * @param {Object} activeGaPair - The currently active GA pair.
 * @returns {string} The complete prompt for question generation.
 */
module.exports = function getQuestionPrompt ({
  text,
  number = number || 3,
  keywords,
  globalPrompt = '',
  questionPrompt = '',
  activeGaPair = null
}) {
  if (globalPrompt) {
    globalPrompt = `In subsequent tasks, you must strictly follow these rules: ${globalPrompt}`;
  }
  if (questionPrompt) {
    questionPrompt = `- In generating questions, you must strictly follow these rules: ${questionPrompt}`;
  }

  // Build GA pairs related prompts
  const gaPrompt = buildGaPrompt(activeGaPair);

  return `
  #Role mission
  You are an LLM language modeling scientist skilled in extracting key information from complex text and constructing fine tune data that conforms to specifications (only generating problems).
  ${globalPrompt}
  
  ##Core tasks
  Generate no less than ${number} high-quality questions related to ${keywords} based on the text provided by the user (length: ${text.length} words).
  
  ##Constraints (Important!!!)
  -Must be directly generated based on text content
  -Questions should have clear answer directionality
  -Need to cover different aspects of the text
  -Prohibit generating hypothetical, repetitive, or similar questions
  -The problem should be in plain language to avoid being "false, big, and empty"
  -The problem is closely related to contemporary real life, avoiding direct reference to 'content'
  -When there is too little effective key information in the text of the material, there is no need to generate a problem and output a blank problem
  
  ${gaPrompt}
  
  ##Process flow
  1. [Text parsing] Segmented processing of content, identifying key entities and core concepts
  2. [Question Generation] Based on information density, select the best question point ${gaPrompt ? 'and combine it with the specified genre audience perspective' : ''}
  3. [Quality Inspection] Ensure:
  -The answer to the question can be found in the original text
  -Strong correlation between tags and problem content
  -No formatting errors
  ${gaPrompt ? '- The question style matches the specified genre audience' : ''}
      
  ##Output format
  -The JSON array format must be correct
  -Use double quotation marks for field names in English
  -The output JSON array must strictly adhere to the following structure:
  \`\`\`json
  [Question 1, Question 2,...]
  \`\`\`
  
  ##Output Example
  \`\`\`json
  What core elements should be included in the ethical framework of artificial intelligence? What new provisions does the Civil Code have for personal data protection
  \`\`\`
  
  ##Pending Text
  ${text}
  
  ##Restrictions
  -It must be output in the prescribed JSON format, and no other irrelevant content should be output
  -Generate no less than ${number} high-quality questions
  -The problem should not be related to the material itself, such as prohibiting the appearance of author, chapter, table of contents, and other related issues
  -The question must not contain the language mentioned in reports, articles, literature, tables, and must be a natural question
  -The subject of the question cannot be a demonstrative pronoun of 'this, these, which, which'. The subject must be clear and cannot be referred to by pronouns
  -The subject of the question must not be the material itself, and it must not generate low efficiency questions such as' What is the publication time of the document? How many documents have been published, what content has been issued, and what is the main purpose of the document 'that have no substantive meaning or practical value
  ${questionPrompt}
    `;
};
