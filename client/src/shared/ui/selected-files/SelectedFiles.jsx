import React from 'react';
import './SelectedFiles.css';
import { getFileIcon } from '../../api/utils';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SelectedFiles = ({ files, onFileClick, onDeleteFile, currentWid, widModeShared }) => {
  const handleDelete = (e, file) => {
    e.stopPropagation(); // Prevent click event bubbling
    onDeleteFile(file);
  };

  return (
    <>
      {files?.length > 0 && (
        <div className="slcfls_container">
          {files.map((file) => (
            <div key={file.id} className="slcfls_item">
              <div className="slcfls_info">
                {(() => {
                  const ext = (file.original_name || '').split('.').pop()?.toLowerCase();
                  return (
                    <div className={`flslc_thumb ext-${ext || 'file'}`}>
                      <span className="flslc_ext">{ext?.toUpperCase() || 'FILE'}</span>
                    </div>
                  );
                })()}
                <span className="slcfls_name">{file.original_name}</span>

                {file.upload_date && (
                  <span className="slcfls_date">{new Date(file.upload_date).toLocaleString()}</span>
                )}
              </div>
              <div className="slcfls_actions">
                <span className="slcfls_download" onClick={() => onFileClick(file)}>
                  Download
                </span>
                <button className="slcfls_delete" onClick={(e) => handleDelete(e, file)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default SelectedFiles;
