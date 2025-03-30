import pdf2md from '@opendocsg/pdf2md';
import { getProjectRoot } from '@/lib/db/base';
import fs from 'fs';
import path from 'path';

class DefaultStrategy {
    async process(projectId,fileName) {
        console.log("正在执行PDF默认转换策略......")
        // 获取项目根目录
        const projectRoot = await getProjectRoot();
        const projectPath = path.join(projectRoot, projectId);

        // 获取文件路径
        const filePath = path.join(projectPath, 'files', fileName);

        //获取文件
        const pdfBuffer = fs.readFileSync(filePath);

        //转后文件名
        const convertName = fileName.replace(/\.([^.]*)$/, '') + ".md";

        await pdf2md(pdfBuffer)
            .then(text => {
                let outputFile = path.join(projectPath, 'files', convertName);
                console.log(`Writing to ${outputFile}...`);
                fs.writeFileSync(path.resolve(outputFile), text);
                console.log('Done.');
            })
            .catch(err => {
                console.error(err);
            })
        console.log("PDF转换完成！")
        //仅将修改后的文件名返回即可，不需要完整路径
        return convertName;
    }
}

module.exports = DefaultStrategy;
