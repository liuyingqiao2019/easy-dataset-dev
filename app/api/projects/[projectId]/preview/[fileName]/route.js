import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/db/base';

// 获取文件内容
export async function GET(request, { params }) {
  try {
    const { projectId, fileName: f } = params;

    const fileName = decodeURIComponent(f);

    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'file Name cannot be empty' }, { status: 400 });
    }

    // 获取项目根目录
    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);

    // 获取文件路径
    const filePath = path.join(projectPath, 'files', fileName);

    //获取文件
    const buffer = fs.readFileSync(filePath);

    const text = buffer.toString('utf-8');

    return NextResponse.json({fileName:fileName,content:text});
  } catch (error) {
    console.error('Failed to get text block content:', error);
    return NextResponse.json({ error: error.message || 'Failed to get text block content' }, { status: 500 });
  }
}
