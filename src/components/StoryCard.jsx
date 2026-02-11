import React, { useState, useEffect } from "react";
import { Paperclip, User, Edit, Trash2 } from "lucide-react";
import { authService } from "../services/authService";
import DeleteStoryModal from "./modals/DeleteStoryModal";
import dataService from "../services/dataService";
import Card from '../layout/containers/Card';

const StoryCard = ({ story, onClick, isSelected = false, onEdit, onDelete }) => {
  const [authorName, setAuthorName] = useState("Unknown");
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAuthorName = async () => {
      if (story.createdBy) {
        try {
          const userData = await authService.getUserById(story.createdBy);
          setAuthorName(userData?.displayName || "Unknown");
        } catch (error) {
          console.error("Error fetching author name:", error);
          setAuthorName("Unknown");
        }
      }
    };

    fetchAuthorName();
  }, [story.createdBy]);

  const handleEdit = () => {
    console.log('Edit clicked for story:', story.title);
    if (onEdit) {
      onEdit(story);
    }
  };

  const handleDelete = () => {
    console.log('Delete clicked for story:', story.title);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (_dontRemind) => {
    console.log('Confirming delete for story:', story.title);
    setIsDeleting(true);
    try {
      await dataService.deleteStory(story.id);
      if (onDelete) {
        onDelete(story.id);
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStoryThumbnail = (story) => {
    const firstImage = story.attachments?.find((a) => a.type === "image");
    return firstImage ? firstImage.url : "/Images/Logo-square-aspect-ratio.png";
  };

  const getAttachmentCount = (story) => story.attachments?.length || 0;

  const thumbnail = getStoryThumbnail(story);
  const attachmentCount = getAttachmentCount(story);

  return (
    <>
      <div
        className={`relative flex bg-white rounded-xl shadow-sm overflow-hidden hover:bg-green-100 transition-all duration-300 cursor-pointer
        ${isSelected ? "ring-2 ring-blue-500" : ""}`}
        onClick={() => onClick && onClick(story)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "280px",
          height: "90px",
          minWidth: "280px",
        }}
      >
        {/* Action buttons - top right corner */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              style={{
                padding: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Edit size={14} color="#374151" />
            </Card>
            <Card
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={{
                padding: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid #e5e7eb'
              }}
            >
              <Trash2 size={14} color="#dc2626" />
            </Card>
          </div>
        )}

        {/* Cover Image */}
        <div
          className="relative bg-gray-100 overflow-hidden"
          style={{ width: "30%", height: "100%" }}
        >
          <img
            src={thumbnail}
            alt={story.title}
            className="object-cover w-full h-full "
            loading="lazy"
          />

          {/* Attachment count badge */}
          <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm">
            <Paperclip size={10} />
            <span>{attachmentCount}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-2" style={{ width: "70%" }}>
          {/* Title & Subtitle */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-900 truncate">
              {story.title || "Untitled Story"}
            </h3>
            <p className="text-gray-600 mt-0.5 leading-snug line-clamp-1 text-[11px]">
              {story.subTitle || story.description || "No description available"}
            </p>
          </div>

          {/* Author info — bottom right */}
          <div className="flex items-center gap-1 justify-end">
            <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center text-white shrink-0">
              <User size={9} />
            </div>
            <span className="text-gray-700 text-[10px] truncate">
              {authorName ? `By ${authorName}` : "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <DeleteStoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        storyTitle={story.title || "Untitled Story"}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default StoryCard;
