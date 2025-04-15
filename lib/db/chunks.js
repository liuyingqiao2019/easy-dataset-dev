'use server';
import {db} from "@/lib/db/index";

export async function saveChunks(chunks) {
    try {
        return await db.chunks.createMany({data: chunks})
    } catch (error) {
        console.error('Failed to create chunks in database');
        throw error;
    }
}

export async function getChunkById(chunkId) {
    try {
        return await db.chunks.findUnique({where: {id: chunkId}})
    } catch (error) {
        console.error('Failed to get chunks by id in database');
        throw error;
    }
}

// 获取项目中所有文本片段的ID
export async function getChunkByProjectId(projectId, filter) {
    try {
        const whereClause = {
            projectId,
        };
        if (filter === 'generated') {
            whereClause.Questions = {
                some: {}
            };
        } else if (filter === 'ungenerated') {
            whereClause.Questions = {
                none: {}
            };
        }
        return await db.chunks.findMany({
            where: whereClause
        });
    } catch (error) {
        console.error('Failed to get chunks by projectId in database');
        throw error;
    }
}


export async function deleteChunkById(chunkId) {
    try {
        const delQuestions = db.questions.deleteMany({where: {chunkId}})
        const delChunk = db.chunks.delete({where: {id: chunkId}})
        return await prisma.$transaction([delQuestions, delChunk])
    } catch (error) {
        console.error('Failed to delete chunks by id in database');
        throw error;
    }
}

export async function updateChunkById(chunkId, chunkData) {
    try {
        return await db.chunks.update({where: {id: chunkId}, data: chunkData})
    } catch (error) {
        console.error('Failed to update chunks by id in database');
        throw error;
    }
}
