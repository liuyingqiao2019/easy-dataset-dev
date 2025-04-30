'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Paper,
  useTheme
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';

/**
 * 项目迁移对话框组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.open - 对话框是否打开
 * @param {Function} props.onClose - 关闭对话框的回调函数
 * @param {Array<string>} props.projectIds - 需要迁移的项目ID列表
 */
export default function MigrationDialog({ open, onClose, projectIds = [] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [migrating, setMigrating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [migratedCount, setMigratedCount] = useState(0);

  // 处理迁移操作
  const handleMigration = async () => {
    try {
      setMigrating(true);
      setError(null);
      setSuccess(false);

      // 调用迁移接口
      const response = await fetch('/api/update', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(t('migration.failed'));
      }

      const count = await response.json();
      setMigratedCount(count);
      setSuccess(true);

      // 迁移成功后，延迟关闭对话框并刷新页面
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('迁移错误:', err);
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={migrating ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5
      }}>
        <WarningAmberIcon color="warning" />
        <Typography variant="h6">
          {t('migration.title')}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('migration.success', { count: migratedCount })}
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t('migration.description')}
        </Typography>
        
        {projectIds.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('migration.projectsList')}:
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 180, overflow: 'auto' }}>
              <List dense>
                {projectIds.map((id) => (
                  <ListItem key={id}>
                    <ListItemText primary={id} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}
        
        {migrating && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={migrating}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleMigration} 
          variant="contained" 
          color="primary"
          disabled={migrating || success}
        >
          {migrating ? t('migration.migrating') : t('migration.migrate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
