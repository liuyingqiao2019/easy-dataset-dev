'use client';

import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, CircularProgress, Stack, useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import StatsCard from '@/components/home/StatsCard';
import ProjectList from '@/components/home/ProjectList';
import CreateProjectDialog from '@/components/home/CreateProjectDialog';
import MigrationDialog from '@/components/home/MigrationDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Home () {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
<<<<<<< HEAD
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmAction: null
  });
=======
  const [unmigratedProjects, setUnmigratedProjects] = useState([]);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

>>>>>>> 1.3.6
  useEffect(() => {
    async function fetchProjects () {
      try {
        setLoading(true);
        // 获取用户创建的项目详情
        const response = await fetch(`/api/projects`);

        if (!response.ok) {
          throw new Error(t('projects.fetchFailed'));
        }

        const data = await response.json();
        setProjects(data);

        // 检查是否有未迁移的项目
        await checkUnmigratedProjects();
      } catch (error) {
        setConfirmDialog({
          open: true,
          title: '错误提示',
          content: t('projects.fetchError') + error.message,
        });
        // console.error(t('projects.fetchError'), error);
        // setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    // 检查未迁移的项目
    async function checkUnmigratedProjects() {
      try {
        const response = await fetch('/api/projects/unmigrated');

        if (!response.ok) {
          console.error('检查未迁移项目失败');
          return;
        }

        const { success, data } = await response.json();

        if (success && Array.isArray(data) && data.length > 0) {
          setUnmigratedProjects(data);
          setMigrationDialogOpen(true);
        }
      } catch (error) {
        console.error('检查未迁移项目出错', error);
      }
    }

    fetchProjects();
  }, []);

  const theme = useTheme();

  return (
    <main style={{ overflow: 'hidden', position: 'relative' }}>
      <Navbar projects={projects} />

      <HeroSection onCreateProject={() => setCreateDialogOpen(true)} />

      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 6, md: 8 },
          mb: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* 确认对话框 */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 200 }
          }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>{confirmDialog.title}</DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }} >
            <DialogContentText id="alert-dialog-description">{confirmDialog.content}</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setConfirmDialog({ ...confirmDialog, open: false });
                if (confirmDialog.confirmAction) {
                  confirmDialog.confirmAction();
                }
              }}
              color="primary"
              variant="contained"
              autoFocus
            >
              {t('common.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
        {/* <StatsCard projects={projects} /> */}

        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mt: 6,
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              {t('projects.loading')}
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'error.light',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorOutlineIcon color="error" />
              <Typography color="error.dark">
                {t('projects.fetchFailed')}: {error}
              </Typography>
            </Stack>
          </Box>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProjectList projects={projects} onCreateProject={() => setCreateDialogOpen(true)} />
          </motion.div>
        )}
      </Container>

      <CreateProjectDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />

      {/* 项目迁移对话框 */}
      <MigrationDialog
        open={migrationDialogOpen}
        onClose={() => setMigrationDialogOpen(false)}
        projectIds={unmigratedProjects}
      />
    </main>
  );
}
