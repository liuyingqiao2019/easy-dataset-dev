'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const { projectId } = params;
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [t] = useTranslation();
  // 定义获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取用户创建的项目详情
      const projectsResponse = await fetch(`/api/projects`);
      if (!projectsResponse.ok) {
        throw new Error(t('projects.fetchFailed'));
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // 获取当前项目详情
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        // 如果项目不存在，跳转到首页
        if (projectResponse.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('获取项目详情失败');
      }
      const projectData = await projectResponse.json();
      setCurrentProject(projectData);
    } catch (error) {
      console.error('加载项目数据出错:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    // 如果 projectId 是 undefined 或 "undefined"，直接重定向到首页
    if (!projectId || projectId === 'undefined') {
      router.push('/');
      return;
    }

    fetchData();
  }, [projectId, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>加载项目数据...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <Typography color="error">
          {t('projects.fetchFailed')}: {error}
        </Typography>
        <Button variant="contained" onClick={() => router.push('/')} sx={{ mt: 2 }}>
          {t('projects.backToHome')}
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Navbar projects={projects} currentProject={projectId} />
      <main>{children}</main>
    </>
  );
}
