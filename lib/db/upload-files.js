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

export async function getUploadFilesByProjectId(projectId) {
  try {
    return await db.uploadFiles.findMany({
      where: {
        projectId,
        NOT: {
          id: {
            in: await db.chunks
              .findMany({
                where: { projectId },
                select: { fileId: true }
              })
              .then(chunks => chunks.map(chunk => chunk.fileId))
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get uploadFiles by id in database');
    throw error;
  }
}

export async function checkUploadFileInfoByMD5(projectId, md5) {
  try {
    return await db.uploadFiles.findFirst({
      where: {
        projectId,
        md5
      }
    });
  } catch (error) {
    console.error('Failed to check uploadFiles by md5 in database');
    throw error;
  }
}

export async function createUploadFileInfo(fileInfo) {
  try {
    return await db.uploadFiles.create({ data: fileInfo });
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
