'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, Tooltip, DialogActions, Button, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';

export default function PdfProcessingDialog({
  open,
  fileName,
  onClose,
  onConfirm,
  onRadioChange,
  value,
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="delete-dialog-title">
        {t('textSplit.pdfProcess')}
      </DialogTitle>
      <DialogContent>
      <DialogContentText id="delete-dialog-description">
          请选择PDF文件处理方式：
        </DialogContentText>
        <FormControl component="fieldset">
          <RadioGroup aria-label="gender" name="gender1" value={value} onChange={onRadioChange}>
            <FormControlLabel value="default" control={<Radio />} label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>默认</span>
                <Tooltip disableFocusListener title="使用内置PDF解析策略"><HelpOutlineIcon sx={{ ml: 35 }} /></Tooltip>
              </div>} />
            <FormControlLabel value="mineru" control={<Radio />} label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>MinerU</span>
                <Tooltip disableFocusListener title="使用MinerU API解析，请先配置MinerU API Token"><HelpOutlineIcon sx={{ ml: 32 }} /></Tooltip>
              </div>} />
            <FormControlLabel value="vision" control={<Radio />} label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>自定义视觉模型</span>
                <Tooltip disableFocusListener title="使用自定义视觉模型解析"><HelpOutlineIcon sx={{ ml: 25 }} /></Tooltip>
              </div>} />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.cancel')}
        </Button>
        <Button onClick={onClose} color="primary" variant="contained">
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}