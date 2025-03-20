// 从 LLM 输出中提取 JSON
function extractJsonFromLLMOutput(output) {
    // 先尝试直接 parse
    try {
        const json = JSON.parse(output);
        return json;
    } catch { }
    const jsonStart = output.indexOf('```json');
    const jsonEnd = output.lastIndexOf('```');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = output.substring(jsonStart + 7, jsonEnd);
        try {
            const json = JSON.parse(jsonString);
            return json;
        } catch (error) {
            console.error('解析 JSON 时出错:', error);
        }
    }
}

module.exports = {
    extractJsonFromLLMOutput
}