import React, { useState, useEffect } from "react";
import { Play, ZoomIn, Trash2 } from "lucide-react";
import { authService } from '../services/authService';
import Card from '../layout/containers/Card';
import DeleteAttachmentModal from './modals/DeleteAttachmentModal';

// Helper function to format duration in MM:SS or HH:MM:SS format
const formatDuration = (duration) => {
  const totalSeconds = Math.round(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

export const VideoAttachmentCard = ({ src, alt, caption, uploader, duration, onClick, showAuthor = true, onDelete, showDeletButton = true, attachmentId }) => {
  const [uploaderName, setUploaderName] = useState('Unknown');
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUploaderName = async () => {
      if (uploader) {
        try {
          const userData = await authService.getUserById(uploader);
          setUploaderName(userData?.displayName || 'Unknown');
        } catch (error) {
          console.error('Error fetching uploader name:', error);
          setUploaderName('Unknown');
        }
      }
    };

    fetchUploaderName();
  }, [uploader]);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(attachmentId);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div
        className="relative w-[120px] h-[120px] rounded-xl overflow-hidden shadow-md group cursor-pointer"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - top right corner */}
        { showDeletButton && isHovered && (
          <div className="absolute top-1 right-1 z-20">
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={{
                padding: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Trash2 size={12} color="#dc2626" />
            </Card>
          </div>
        )}

        {/* Background image */}
        <img
          src={src}
          alt={alt || "Video"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

        {/* Glass play icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors duration-300 rounded-full p-2.5 shadow-lg">
            <Play className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Top-right timestamp */}
        <div className="absolute top-1.5 right-1.5 text-white text-[11px] font-medium">
          {duration ? formatDuration(duration) : "00:00"}
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-2 left-2 text-white">
          <p className="text-[11px] font-semibold leading-tight truncate max-w-[100px]">
            {caption || "Video"}
          </p>
          {showAuthor && <p className="text-[10px] text-gray-200 leading-tight truncate max-w-[100px]">
            by {uploaderName}
          </p>
      }
        </div>
      </div>

      <DeleteAttachmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        attachmentType="video"
        isDeleting={isDeleting}
      />
    </>
  );
};

export const ImageAttachmentCard = ({ src, alt, caption, showDeletButton = true, uploader, onClick, onDelete, attachmentId, showAuthor = true, showCaption = true }) => {
  const [uploaderName, setUploaderName] = useState('Unknown');
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUploaderName = async () => {
      if (uploader) {
        try {
          const userData = await authService.getUserById(uploader);
          setUploaderName(userData?.displayName || 'Unknown');
        } catch (error) {
          console.error('Error fetching uploader name:', error);
          setUploaderName('Unknown');
        }
      }
    };

    fetchUploaderName();
  }, [uploader]);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(attachmentId);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div
        className="relative w-[120px] h-[120px] rounded-xl overflow-hidden shadow-md group cursor-pointer"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - top right corner */}
        {showDeletButton && isHovered && (
          <div className="absolute top-1 right-1 z-20">
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={{
                padding: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Trash2 size={12} color="#dc2626" />
            </Card>
          </div>
        )}

        <img
          src={src}
          alt={alt || "Image"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors duration-300 rounded-full p-2.5 shadow-lg">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-2 left-2 text-white">
         
         {showCaption && <p className="text-[11px] font-semibold leading-tight truncate max-w-[100px]">
            {caption || "Image"}
          </p>
          }
          {showAuthor && <p className="text-[10px] text-gray-200 leading-tight truncate max-w-[100px]">
            by {uploaderName}
          </p>
      }
        </div>
      </div>

      <DeleteAttachmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        attachmentType="image"
        isDeleting={isDeleting}
      />
    </>
  );
};

export const AudioAttachmentCard = ({ thumbnail, duration, title, uploader, onClick, onDelete, attachmentId, showDeletButton = true, showAuthor = true }) => {
  const [uploaderName, setUploaderName] = useState('Unknown');
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUploaderName = async () => {
      if (uploader) {
        try {
          const userData = await authService.getUserById(uploader);
          setUploaderName(userData?.displayName || 'Unknown');
        } catch (error) {
          console.error('Error fetching uploader name:', error);
          setUploaderName('Unknown');
        }
      }
    };

    fetchUploaderName();
  }, [uploader]);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(attachmentId);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div
        className={`relative w-[120px] h-[120px] rounded-xl overflow-hidden shadow-sm flex flex-col items-center justify-center text-white cursor-pointer ${
          thumbnail ? "bg-gray-800" : "bg-blue-100"
        }`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - top right corner */}
        {showDeletButton && isHovered && (
          <div className="absolute top-1 right-1 z-20">
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={{
                padding: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Trash2 size={12} color="#dc2626" />
            </Card>
          </div>
        )}
        {/* Thumbnail (only if provided) */}
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title || "Audio thumbnail"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay for better visibility if thumbnail exists */}
        {thumbnail && <div className="absolute inset-0 bg-black/30" />}

        <div className="absolute top-2 text-white z-10">
          <p className="text-[11px] font-semibold truncate max-w-[100px] text-gray-600">{title || "Audio"}</p>
        </div>

        {/* Play button */}
        <div className="z-10 flex flex-col items-center">
          <button className="bg-green-500 hover:bg-green-600 transition-colors rounded-full p-2 shadow-md">
            <Play className="w-4 h-4 text-white" />
          </button>
          <p className="text-[10px] text-gray-800 mt-1">
            {duration ? formatDuration(duration) : "00:00"}
          </p>
        </div>

        {/* Bottom text */}
          {showAuthor && <p className="text-[10px] text-gray-200 leading-tight truncate max-w-[100px]">
            by {uploaderName}
          </p>
      }
      </div>

      <DeleteAttachmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        attachmentType="audio"
        isDeleting={isDeleting}
      />
    </>
  );
};

export const FileAttachmentCard = ({ fileUrl, showDeletButton = true, fileName, onClick, onDelete, attachmentId, showAuthor = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(attachmentId);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <>
      <div
        className="relative w-[120px] h-[120px] rounded-xl overflow-hidden shadow-md group cursor-pointer bg-green-300 border border-zinc-200 flex flex-col items-center justify-center"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - top right corner */}
        {showDeletButton && isHovered && (
          <div className="absolute top-1 right-1 z-20">
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={{
                padding: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Trash2 size={12} color="#dc2626" />
            </Card>
          </div>
        )}

        {/* File icon */}
        <div className="flex items-center justify-center p-4">
          <span className="material-symbols-outlined text-5xl text-red-500">description</span>
        </div>

        {/* File name */}
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-[11px] font-semibold leading-tight text-zinc-800 truncate">
            {fileName || "File"}
          </p>
        </div>
      </div>

      <DeleteAttachmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        attachmentType="file"
        isDeleting={isDeleting}
      />
    </>
  );
};
