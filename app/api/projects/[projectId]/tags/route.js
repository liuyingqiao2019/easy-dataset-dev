import { NextResponse } from 'next/server';
import { getTags, createTag, updateTag, deleteTag } from '@/lib/db/tags';
import { getQuestionsByTagName } from '@/lib/db/questions';

// 获取项目的标签树
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 获取标签树
    const tags = await getTags(projectId);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Failed to obtain the label tree:', error);
    return NextResponse.json({ error: error.message || 'Failed to obtain the label tree' }, { status: 500 });
  }
}

// 更新项目的标签树
export async function PUT(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 获取请求体
    const { tags } = await request.json();
    if (tags.id === undefined || tags.id === null || tags.id === '') {
      console.log('createTag', tags);
      let res = await createTag(projectId, tags.label, tags.parentId);
      return NextResponse.json({ tags: res });
    } else {
      let res = await updateTag(tags.label, tags.id);
      return NextResponse.json({ tags: res });
    }
  } catch (error) {
    console.error('Failed to update tags:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tags' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const { tagName } = await request.json();
    console.log('tagName', tagName);
    let data = await getQuestionsByTagName(projectId, tagName);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to obtain the label tree:', error);
    return NextResponse.json({ error: error.message || 'Failed to obtain the label tree' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { projectId } = params;

    // 验证项目ID
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let res = await deleteTag(id);
    return NextResponse.json(res);
  } catch (error) {
    console.error('Failed to obtain the label tree:', error);
    return NextResponse.json({ error: error.message || 'Failed to obtain the label tree' }, { status: 500 });
  }
}
