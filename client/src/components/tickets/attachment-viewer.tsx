import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface AttachmentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  } | null;
  ticketId: string;
}

export default function AttachmentViewer({
  isOpen,
  onClose,
  attachment,
  ticketId,
}: AttachmentViewerProps) {
  if (!attachment) return null;

  const isImage = attachment.mimeType.startsWith('image/');
  const isPDF = attachment.mimeType === 'application/pdf';
  const isText = attachment.mimeType.startsWith('text/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(`/api/tickets/${ticketId}/attachments/${attachment.id}/download`, '_blank');
  };

  const renderContent = () => {
    if (isImage) {
      return (
        <img
          src={`/api/tickets/${ticketId}/attachments/${attachment.id}/view`}
          alt={attachment.fileName}
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={`/api/tickets/${ticketId}/attachments/${attachment.id}/view`}
          className="w-full h-[70vh] border-0"
          title={attachment.fileName}
        />
      );
    }

    if (isText) {
      return (
        <iframe
          src={`/api/tickets/${ticketId}/attachments/${attachment.id}/view`}
          className="w-full h-[70vh] border-0"
          title={attachment.fileName}
        />
      );
    }

    // For other file types, show a message with download option
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          This file type cannot be previewed
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          {attachment.fileName} ({formatFileSize(attachment.fileSize)})
        </p>
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <DownloadIcon className="w-4 h-4" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-left flex-1 min-w-0">
            <span className="truncate block" title={attachment.fileName}>
              {attachment.fileName}
            </span>
          </DialogTitle>
          {!isImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Download
            </Button>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
