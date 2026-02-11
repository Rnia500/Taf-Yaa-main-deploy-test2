import React, { useState, useRef, useEffect } from 'react';
import '../styles/FileUpload.css';

function FileUpload({ onChange, accept = '*', label = 'Choose file', variant = 'default', initialPreview = null }) {

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(initialPreview ? 'Current image' : '');
  const [filePreview, setFilePreview] = useState(initialPreview);
  const fileInputRef = useRef(null);

  // Update preview when initialPreview prop changes
  useEffect(() => {
    setFilePreview(initialPreview);
    setFileName(initialPreview ? 'Current image' : '');
  }, [initialPreview]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);

    // Image: create immediate preview and try to persist via dataService.uploadFile(image,'image')
     onChange(file);

    // It can still generate a local preview for the UI without affecting the parent.
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          setFilePreview(dataUrl);
          onChange(file);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
        onChange(file);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`file-upload file-upload--${variant} ${isDragging ? 'file-upload--dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="file-upload__content">
        <div className="file-upload__icon">
          {variant === 'audio' ? (
            /* audio icon (same as before) */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3V12C12 13.6569 10.6569 15 9 15C7.34315 15 6 13.6569 6 12C6 10.3431 7.34315 9 9 9C9.35064 9 9.68722 9.06015 10 9.17071V3H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 22V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 22V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            /* file icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {filePreview ? (
          <div className="file-upload__preview">
            <img src={filePreview} alt="Preview" className="file-upload__preview-image" />
            <div className="file-upload__text">
              <div className="file-upload__filename">{fileName}</div>
              <div className="file-upload__subtext">Click to change image</div>
            </div>
          </div>
        ) : (
          <div className="file-upload__text">
            {fileName ? (
              <div className="file-upload__filename">{fileName}</div>
            ) : (
              <div className="file-upload__label">{label}</div>
            )}
            <div className="file-upload__subtext">
              {fileName ? 'Click to change file' : 'Click or drag to upload'}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="file-upload__input"
        onChange={handleFileChange}
        accept={accept}
      />
    </div>
  );
}

export default FileUpload;
