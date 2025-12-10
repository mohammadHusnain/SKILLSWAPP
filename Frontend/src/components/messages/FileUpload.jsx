'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const FileUpload = ({ onFilesUploaded, onRemove }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File "${file.name}" exceeds 10MB limit` };
    }

    // Check file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    const mimeType = file.type;
    
    const allowedExts = Object.values(ALLOWED_TYPES).flat();
    if (!allowedExts.includes(fileExt) && !Object.keys(ALLOWED_TYPES).includes(mimeType)) {
      return { valid: false, error: `File type not allowed for "${file.name}"` };
    }

    return { valid: true };
  };

  const handleFileSelect = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: 'Invalid Files',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    if (validFiles.length === 0) return;

    // Upload files
    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of validFiles) {
        try {
          const response = await messageAPI.uploadFile(file);
          uploadedUrls.push({
            url: response.file_url,
            filename: file.name,
            type: file.type,
            size: file.size,
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: 'Upload Failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setFiles(prev => [...prev, ...uploadedUrls]);
        onFilesUploaded(uploadedUrls);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const removedFile = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (onRemove) {
      onRemove(removedFile);
    }
  };

  const isImage = (type) => {
    return type && type.startsWith('image/');
  };

  const getFileIcon = (type) => {
    if (isImage(type)) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  if (files.length === 0 && !uploading) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-accent/30 rounded-lg p-4 text-center hover:border-accent/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files (PDF, Word, Images)'}
        </Button>
        <p className="text-xs text-text-muted mt-2">Drag and drop files here or click to browse</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-accent/30 rounded-lg p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {uploading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent mr-2" />
            <span className="text-sm text-text-muted">Uploading...</span>
          </div>
        )}

        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3 p-2 bg-accent/10 rounded-lg"
            >
              {isImage(file.type) && file.url ? (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-accent/20 rounded flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text font-medium truncate">{file.filename}</p>
                <p className="text-xs text-text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="h-8 w-8 text-text-muted hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {!uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-full mt-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add More Files
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;

