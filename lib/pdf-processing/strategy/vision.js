import { fromPath } from "pdf2pic";

class VisionStrategy {
    async process(fileName, projectId) {
        console.log("正在执行PDF Vision转换策略......");
        // 获取当前文件路径（ES Modules 替代 __dirname）
        // 获取项目根目录
        const projectRoot = await getProjectRoot();
        const projectPath = path.join(projectRoot, projectId);

        const options = {
            density: 100,          // 输出分辨率（DPI）
            saveFilename: "page",  // 输出文件名（不带扩展名）
            savePath: resolve(projectPath, "images"), // 图片保存目录
            format: "png",         // 输出格式（png/jpeg）
            width: 800,            // 宽度（像素）
            height: 1100           // 高度（像素）
        };

        // 指定 PDF 文件路径
        const pdfPath = path.join(projectPath, 'files', fileName);;

        // 初始化转换器
        const convert = await fromPath(pdfPath, options);

        // 转换第1页为图片
        await convert(1)
            .then((result) => {
                console.log("转换成功:", result);
            })
            .catch((err) => {
                console.error("转换失败:", err);
            });

        console.log("PDF转换完成！");
    }
}

module.exports = VisionStrategy;