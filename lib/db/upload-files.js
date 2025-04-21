'use server';
import { db } from '@/lib/db/index';

//获取文件列表
export async function getUploadFilesPagination(projectId, page = 1, pageSize = 10, fileName) {
  try {
    const whereClause = {
      projectId,
      fileName: { contains: fileName }
    };
    const [data, total] = await Promise.all([
      db.uploadFiles.findMany({
        where: whereClause,
        orderBy: {
          createAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.uploadFiles.count({
        where: whereClause
      })
    ]);
    return { data, total };
  } catch (error) {
    console.error('Failed to get uploadFiles by pagination in database');
    throw error;
  }
}

export async function getUploadFileInfoById(fileId) {
  try {
    return await db.uploadFiles.findUnique({ where: { id: fileId } });
  } catch (error) {
    console.error('Failed to get uploadFiles by id in database');
    throw error;
  }
}

export async function delUploadFileInfoById(fileId) {
  try {
    return await db.uploadFiles.delete({ where: { id: fileId } });
  } catch (error) {
    console.error('Failed to delete uploadFiles by id in database');
    throw error;
  }
}
