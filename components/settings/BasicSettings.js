'use client';

import { useState, useEffect } from 'react';
import {
  Typography, Box, Button, TextField, Grid, Card, CardContent, Alert, Snackbar, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';

export default function BasicSettings ({ projectId }) {
  const { t } = useTranslation();
  const [projectInfo, setProjectInfo] = useState({
    id: '',
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmAction: null
  });
  useEffect(() => {
    async function fetchProjectInfo () {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error(t('projects.fetchFailed'));
        }

        const data = await response.json();
        setProjectInfo(data);
      } catch (error) {
        setConfirmDialog({
          open: true,
          title: '错误提示',
          content: '获取项目信息出错:' + error.message,
        });
        console.error('获取项目信息出错:', error);
        // setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectInfo();
  }, [projectId, t]);

  // 处理项目信息变更
  const handleProjectInfoChange = e => {
    const { name, value } = e.target;
    setProjectInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存项目信息
  const handleSaveProjectInfo = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: projectInfo.name,
          description: projectInfo.description
        })
      });

      if (!response.ok) {
        throw new Error(t('projects.saveFailed'));
      }

      setSuccess(true);
    } catch (error) {
      setConfirmDialog({
        open: true,
        title: '错误提示',
        content: '保存项目信息出错:' + error.message,
      });
      console.error('保存项目信息出错:', error);
      // setError(error.message);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  if (loading) {
    return <Typography>{t('common.loading')}</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('settings.basicInfo')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.id')}
              value={projectInfo.id}
              disabled
              helperText={t('settings.idNotEditable')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.name')}
              name="name"
              value={projectInfo.name}
              onChange={handleProjectInfoChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('projects.description')}
              name="description"
              value={projectInfo.description}
              onChange={handleProjectInfoChange}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProjectInfo}>
              {t('settings.saveBasicInfo')}
            </Button>
          </Grid>
        </Grid>
      </CardContent>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('settings.saveSuccess')}
        </Alert>
      </Snackbar>
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
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Card>
  );
}
