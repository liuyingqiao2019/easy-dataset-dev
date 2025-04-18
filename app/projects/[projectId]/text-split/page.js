'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Backdrop,
  Paper,
  LinearProgress,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import FileUploader from '@/components/text-split/FileUploader';
import ChunkList from '@/components/text-split/ChunkList';
import DomainAnalysis from '@/components/text-split/DomainAnalysis';
import request from '@/lib/util/request';
import { processInParallel } from '@/lib/util/async';
import useTaskSettings from '@/hooks/useTaskSettings';
import { finished } from 'stream';

export default function TextSplitPage ({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const [activeTab, setActiveTab] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [showChunks, setShowChunks] = useState([]);
  const [tocData, setTocData] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [error, setError] = useState(null); // 可以是字符串或对象 { severity, message }
  const { taskSettings } = useTaskSettings(projectId);
  const [pdfStrategy, setPdfStrategy] = useState("default");;
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all', 'generated', 'ungenerated'
  const [selectedViosnModel, setSelectedViosnModel] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmAction: null
  });

  // 进度状态
  const [progress, setProgress] = useState({
    total: 0, // 总共选择的文本块数量
    completed: 0, // 已处理完成的数量
    percentage: 0, // 进度百分比
    questionCount: 0 // 已生成的问题数量
  });
  const [controller, setController] = useState(null)

  // 加载文本块数据
  useEffect(() => {
    fetchChunks();
  }, []);
  // 获取文本块列表
  const fetchChunks = async () => {
    try {
      setLoading(true);
      let control = new AbortController()
      let signal = control.signal
      setController(control)
      const response = await fetch(`/api/projects/${projectId}/split`, { signal: signal });
      if (!response.ok) {
        const errorData = await response.json();
        setConfirmDialog({
          open: true,
          title: '错误提示',
          content: errorData.error || t('textSplit.fetchChunksFailed'),
        });
        throw new Error(errorData.error || t('textSplit.fetchChunksFailed'));
      }

      const data = await response.json();
      setChunks(data.chunks || []);

      // Apply filter when setting showChunks
      const filteredChunks = (data.chunks || []).filter(chunk => {
        if (questionFilter === 'generated') {
          return chunk.questions && chunk.questions.length > 0;
        } else if (questionFilter === 'ungenerated') {
          return !chunk.questions || chunk.questions.length === 0;
        }
        return true;
      });
      setShowChunks(filteredChunks);

      // 如果有文件结果，处理详细信息
      if (data.toc) {
        console.log(t('textSplit.fileResultReceived'), data.fileResult);
        // 如果有目录结构，设置目录数据
        setTocData(data.toc);
      }

      // 如果有标签，设置标签数据
      if (data.tags) {
        setTags(data.tags);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setConfirmDialog({
          open: true,
          title: '操作提示',
          content: '用户取消操作',
        });
      } else {
        setConfirmDialog({
          open: true,
          title: '错误提示',
          content: t('textSplit.fetchChunksError') + error.message,
        });
        console.error(t('textSplit.fetchChunksError'), error);
      }
      // setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const abortFetchChunks = () => {
    console.log('%c [ controller ]-124', 'font-size:13px; background:pink; color:#bf2c9f;', controller)
    controller.abort();
    setController(null)
    console.log("中断请求", controller)
    setLoading(false);
  }
  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 处理文件上传成功
  const handleUploadSuccess = async (fileNames, model, pdfFiles) => {
    console.log(t('textSplit.fileUploadSuccess'), fileNames);
    //上传完处理PDF文件
    try {
      setPdfProcessing(true);
      setError(null);
      // 重置进度状态
      setProgress({
        total: pdfFiles.length,
        completed: 0,
        percentage: 0,
        questionCount: 0
      });
      for (const file of pdfFiles) {
        const response = await fetch(`/api/projects/${projectId}/pdf?fileName=` + file.name + `&strategy=` + pdfStrategy);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(t('textSplit.pdfProcessingFailed') + errorData.error);
        }
        const data = await response.json();
        // 更新进度状态
        setProgress(prev => {
          const completed = prev.completed + 1;
          const percentage = Math.round((completed / prev.total) * 100);
          return {
            ...prev,
            completed,
            percentage
          };
        });
      }
    } catch (error) {
      setConfirmDialog({
        open: true,
        title: '错误提示',
        content: t('textSplit.pdfProcessingFailed') + error.message,
      });
      console.error(t('textSplit.pdfProcessingFailed'), error);
      // setError({ severity: 'error', message: error.message });
    } finally {
      setPdfProcessing(false);
      // 重置进度状态
      setTimeout(() => {
        setProgress({
          total: 0,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });
      }, 1000); // 延迟重置，让用户看到完成的进度
    }

    // 如果有文件上传成功，自动处理第一个文件
    if (fileNames && fileNames.length > 0) {
      handleSplitText(fileNames[0], model);
    }
  };

  // 处理文本分割
  const handleSplitText = async (fileName, model) => {
    try {
      setProcessing(true);
      let control = new AbortController()
      let signal = control.signal
      setController(control)
      const language = i18n.language === 'zh-CN' ? '中文' : 'en';
      const response = await fetch(`/api/projects/${projectId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: signal,
        body: JSON.stringify({ fileName, model, language })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.splitTextFailed'));
      }

      const data = await response.json();

      // 更新文本块列表
      setChunks(prev => {
        const newChunks = [...prev];
        data.chunks.forEach(chunk => {
          if (!newChunks.find(c => c.id === chunk.id)) {
            newChunks.push(chunk);
          }
        });
        return newChunks;
      });

      setShowChunks(prev => {
        const newChunks = [...prev];
        data.chunks.forEach(chunk => {
          if (!newChunks.find(c => c.id === chunk.id)) {
            newChunks.push(chunk);
          }
        });
        return newChunks;
      });

      // 更新目录结构
      if (data.toc) {
        setTocData(data.toc);
      }

      // 自动切换到智能分割标签
      setActiveTab(0);
      location.reload();
    } catch (error) {
      if (error.name === 'AbortError') {
        setConfirmDialog({
          open: true,
          title: '操作提示',
          content: '用户取消操作',
        });
      } else {
        setConfirmDialog({
          open: true,
          title: '错误提示',
          content: t('textSplit.splitTextError') + error.message,
        });
        console.error(t('textSplit.splitTextError'), error);
      }
      // setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // 处理删除文本块
  const handleDeleteChunk = async chunkId => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.deleteChunkFailed'));
      }

      // 更新文本块列表
      setChunks(prev => prev.filter(chunk => chunk.id !== chunkId));
      setShowChunks(prev => prev.filter(chunk => chunk.id !== chunkId));
    } catch (error) {
      setConfirmDialog({
        open: true,
        title: '错误提示',
        content: t('textSplit.deleteChunkError') + error.message,
      });
      console.error(t('textSplit.deleteChunkError'), error);
      // setError(error.message);
    }
  };

  // 处理生成问题
  const handleGenerateQuestions = async chunkIds => {
    try {
      setProcessing(true);
      setError(null);

      // 重置进度状态
      setProgress({
        total: chunkIds.length,
        completed: 0,
        percentage: 0,
        questionCount: 0
      });

      let model = null;

      // 尝试从 localStorage 获取完整的模型信息
      const modelInfoStr = localStorage.getItem('selectedModelInfo');

      if (modelInfoStr) {
        try {
          model = JSON.parse(modelInfoStr);
        } catch (e) {
          console.error('解析模型信息出错:', e);
          // 继续执行，将在下面尝试获取模型信息
        }
      }

      // 如果仍然没有模型信息，抛出错误
      if (!model) {
        throw new Error(t('textSplit.selectModelFirst'));
      }

      // 如果是单个文本块，直接调用单个生成接口
      if (chunkIds.length === 1) {
        const chunkId = chunkIds[0];
        // 获取当前语言环境
        const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

        const response = await request(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ model, language: currentLanguage })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t('textSplit.generateQuestionsFailed', { chunkId }));
        }

        const data = await response.json();

        console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));
        setConfirmDialog({
          open: true,
          title: '操作提示',
          content: t('textSplit.questionsGeneratedSuccess', {
            total: data.total
          })
        });
        // setError({
        //   severity: 'success',
        //   message: t('textSplit.questionsGeneratedSuccess', {
        //     total: data.total
        //   })
        // });
      } else {
        // 如果是多个文本块，循环调用单个文本块的问题生成接口，限制并行数为2
        let totalQuestions = 0;
        let successCount = 0;
        let errorCount = 0;

        // 单个文本块处理函数
        const processChunk = async chunkId => {
          try {
            // 获取当前语言环境
            const currentLanguage = i18n.language === 'zh-CN' ? '中文' : 'en';

            const response = await request(
              `/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}/questions`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model, language: currentLanguage })
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.error(t('textSplit.generateQuestionsForChunkFailed', { chunkId }), errorData.error);
              errorCount++;
              return { success: false, chunkId, error: errorData.error };
            }

            const data = await response.json();
            console.log(t('textSplit.questionsGenerated', { chunkId, total: data.total }));

            // 更新进度状态
            setProgress(prev => {
              const completed = prev.completed + 1;
              const percentage = Math.round((completed / prev.total) * 100);
              const questionCount = prev.questionCount + (data.total || 0);

              return {
                ...prev,
                completed,
                percentage,
                questionCount
              };
            });

            totalQuestions += data.total || 0;
            successCount++;
            return { success: true, chunkId, total: data.total };
          } catch (error) {
            console.error(t('textSplit.generateQuestionsForChunkError', { chunkId }), error);
            errorCount++;

            // 更新进度状态（即使失败也计入已处理）
            setProgress(prev => {
              const completed = prev.completed + 1;
              const percentage = Math.round((completed / prev.total) * 100);

              return {
                ...prev,
                completed,
                percentage
              };
            });

            return { success: false, chunkId, error: error.message };
          }
        };

        // 并行处理所有文本块，最多同时处理2个
        await processInParallel(chunkIds, processChunk, taskSettings.concurrencyLimit);

        // 处理完成后设置结果消息
        if (errorCount > 0) {
          setConfirmDialog({
            open: true,
            title: '操作提示',
            content: t('textSplit.partialSuccess', {
              successCount,
              total: chunkIds.length,
              errorCount
            })
          });

        } else {
          setConfirmDialog({
            open: true,
            title: '操作提示',
            content: t('textSplit.allSuccess', {
              successCount,
              totalQuestions
            })
          });
        }
      }

      // 刷新文本块列表
      fetchChunks();
    } catch (error) {
      setConfirmDialog({
        open: true,
        title: '错误提示',
        content: t('textSplit.generateQuestionsError') + error.message,
      });
      console.error(t('textSplit.generateQuestionsError'), error);
      // setError({ severity: 'error', message: error.message });
    } finally {
      setProcessing(false);
      // 重置进度状态
      setTimeout(() => {
        setProgress({
          total: 0,
          completed: 0,
          percentage: 0,
          questionCount: 0
        });
      }, 1000); // 延迟重置，让用户看到完成的进度
    }
  };

  // 处理文本块编辑
  const handleEditChunk = async (chunkId, newContent) => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/chunks/${encodeURIComponent(chunkId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('textSplit.editChunkFailed'));
      }

      // 更新成功后刷新文本块列表
      fetchChunks();

      setError({
        severity: 'success',
        message: t('textSplit.editChunkSuccess')
      });
    } catch (error) {
      console.error(t('textSplit.editChunkError'), error);
      setError({ severity: 'error', message: error.message });
    } finally {
      setProcessing(false);
    }
  };

  // 处理文件删除
  const handleFileDeleted = (fileName, filesCount) => {
    console.log(t('textSplit.fileDeleted', { fileName }));
    // 从 localStorage 获取当前选择的模型信息
    let selectedModelInfo = null;

    // 尝试从 localStorage 获取完整的模型信息
    const modelInfoStr = localStorage.getItem('selectedModelInfo');

    if (modelInfoStr) {
      try {
        selectedModelInfo = JSON.parse(modelInfoStr);
      } catch (e) {
        throw new Error(t('textSplit.modelInfoParseError'));
      }
    } else {
      throw new Error(t('textSplit.selectModelFirst'));
    }
    //如果多个文件的情况下，删除的不是最后一个文件，就复用handleSplitText重新构建领域树
    if (filesCount > 1) {
      handleSplitText(['rebuildToc.md'], selectedModelInfo);
    } else {
      //删除最后一个文件仅刷新界面即可
      location.reload();
    }
  };

  // 关闭错误提示
  const handleCloseError = () => {
    setError(null);
  };

  // 处理错误或成功提示
  const renderAlert = () => {
    if (!error) return null;

    const severity = error.severity || 'error';
    const message = typeof error === 'string' ? error : error.message;

    return (
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    );
  };

  // 处理筛选器变更
  const handleQuestionFilterChange = value => {
    setQuestionFilter(value);

    // 应用筛选
    const filteredChunks = chunks.filter(chunk => {
      if (value === 'generated') {
        return chunk.questions && chunk.questions.length > 0;
      } else if (value === 'ungenerated') {
        return !chunk.questions || chunk.questions.length === 0;
      }
      return true;
    });
    setShowChunks(filteredChunks);
  };

  const handleSelected = array => {
    if (array.length > 0) {
      let selectedChunks = [];
      for (let i = 0; i < array.length; i++) {
        const name = array[i].replace(/\.md$/, '');
        console.log(name);
        const tempChunks = chunks.filter(item => item.id.includes(name));
        tempChunks.forEach(item => {
          selectedChunks.push(item);
        });
      }
      setShowChunks(selectedChunks);
      console.log(selectedChunks);
    } else {
      const allChunks = chunks;
      setShowChunks(allChunks);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8, position: 'relative' }}>
      {/* 文件上传组件 */}
      <FileUploader
        projectId={projectId}
        onUploadSuccess={handleUploadSuccess}
        onProcessStart={handleSplitText}
        onFileDeleted={handleFileDeleted}
        setPdfStrategy={setPdfStrategy}
        setPageLoading={setLoading}
        pdfStrategy={pdfStrategy}
        selectedViosnModel={selectedViosnModel}
        setSelectedViosnModel={setSelectedViosnModel}
        sendToPages={handleSelected}
      />

      {/* 标签页 */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label={t('textSplit.tabs.smartSplit')} />
          <Tab label={t('textSplit.tabs.domainAnalysis')} />
        </Tabs>

        {/* 智能分割标签内容 */}
        {activeTab === 0 && (
          <ChunkList
            projectId={projectId}
            chunks={showChunks}
            onDelete={handleDeleteChunk}
            onEdit={handleEditChunk}
            onGenerateQuestions={handleGenerateQuestions}
            loading={loading}
            questionFilter={questionFilter}
            onQuestionFilterChange={handleQuestionFilterChange}
          />
        )}

        {/* 领域分析标签内容 */}
        {activeTab === 1 && <DomainAnalysis projectId={projectId} toc={tocData} loading={loading} tags={tags} />}
      </Box>

      {/* 加载中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={loading}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 200
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">{t('textSplit.loading')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('textSplit.fetchingDocuments')}
          </Typography>

        </Paper>

      </Backdrop>

      {/* 处理中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={processing}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 300
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">{t('textSplit.loading')}</Typography>

          {progress.total > 1 ? (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('textSplit.progressStatus', {
                    total: progress.total,
                    completed: progress.completed
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.percentage}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {t('textSplit.questionsGenerated', {
                  total: progress.questionCount
                })}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('textSplit.processingPleaseWait')}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Button
              onClick={abortFetchChunks}
              color="primary"
              variant="contained"
              autoFocus
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Paper>
      </Backdrop>
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
      {/* PDF处理中蒙版 */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          position: 'fixed',
          backdropFilter: 'blur(3px)'
        }}
        open={pdfProcessing}
      >
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            minWidth: 300
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">{t('textSplit.pdfProcessing')}</Typography>

          {progress.total > 1 ? (
            <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('textSplit.pdfProcessStatus', {
                    total: progress.total,
                    completed: progress.completed
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.percentage}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('textSplit.processingPleaseWait')}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Button
              onClick={abortFetchChunks}
              color="primary"
              variant="contained"
              autoFocus
            >
              {t('common.cancel')}
            </Button>
          </Box>
        </Paper>
      </Backdrop>

      {/* 错误或成功提示 */}
      {renderAlert()}
    </Container>
  );
}
