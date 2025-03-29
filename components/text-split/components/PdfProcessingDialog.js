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
  projectId
}) {
  const { t } = useTranslation();
  const isMinerUEnabled = localStorage.getItem("isSettingMinerU"+projectId);
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
        {t('textSplit.selectPdfProcessingStrategy')}
        </DialogContentText>
        <FormControl component="fieldset">
          <RadioGroup aria-label="gender" name="gender1" value={value} onChange={onRadioChange}>
            <FormControlLabel value="default" control={<Radio />} label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>{t('textSplit.pdfProcessingStrategyDefault')}</span>
                <Tooltip disableFocusListener title={t('textSplit.pdfProcessingStrategyDefaultHelper')}><HelpOutlineIcon sx={{ ml: 35 }} /></Tooltip>
              </div>} />
            <FormControlLabel value="mineru" control={<Radio />} disabled={!isMinerUEnabled} label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>MinerU</span>
                <Tooltip disableFocusListener title={t('textSplit.pdfProcessingStrategyMinerUHelper')}><HelpOutlineIcon sx={{ ml: 32 }} /></Tooltip>
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