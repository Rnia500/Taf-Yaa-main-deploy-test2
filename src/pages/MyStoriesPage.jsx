import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/dataService';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Grid from '../layout/containers/Grid';
import Spacer from '../components/Spacer';
import Column from '../layout/containers/Column';
import StoryModal from '../components/modals/StoryModal';
import Pagination from '../components/Pagination';
import { Paperclip, User, File, Download, Play, Music } from 'lucide-react';
import MediaPlayerBox from '../components/MediaPlayerBox';
import Row from '../layout/containers/Row';

const MyStoriesPage = () => {
  const { currentUser } = useAuth();
  const [stories, setStories] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [attachmentPage, setAttachmentPage] = useState(1);

  const storiesPerPage = 25; // 5x5 grid = 25 stories
  const attachmentsPerPage = 25; // 5x5 grid = 25 attachments

  useEffect(() => {
    fetchUserStories();
    fetchAllAttachments();
  }, [currentUser]);

  const fetchUserStories = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all stories where the user is a contributor (created or added attachments)
      const userStories = await dataService.getStoriesByContributor(currentUser.uid);

      // Sort by creation date (newest first)
      const sortedStories = userStories.sort((a, b) =>
        new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt)
      );

      setStories(sortedStories);
    } catch (err) {
      console.error('Failed to fetch user stories:', err);
      setError('Failed to load your stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttachments = async () => {
    if (!currentUser?.uid) {
      return;
    }

    try {
      // Get all stories where the user is a contributor (created or added attachments)
      const allStories = await dataService.getStoriesByContributor(currentUser.uid);

      // Collect all attachments uploaded by the current user across all stories
      const allAttachments = [];
      allStories.forEach(story => {
        if (story.attachments && story.attachments.length > 0) {
          story.attachments.forEach(att => {
            // Only include attachments uploaded by the current user
            if (att.uploadedBy === currentUser.uid) {
              allAttachments.push({
                ...att,
                storyId: story.id,
                storyTitle: story.title || 'Untitled Story',
                storyCreatedBy: story.createdBy,
                storyCreatedAt: story.createdAt,
                treeId: att.treeId || story.treeId,
                personId: att.personId || story.personId
              });
            }
          });
        }
      });

      // Sort by attachment creation date (newest first)
      const sortedAttachments = allAttachments.sort((a, b) =>
        new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt)
      );

      setAttachments(sortedAttachments);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };

  const handleStoryClick = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAttachmentPageChange = (page) => {
    setAttachmentPage(page);
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      if (attachment.url) {
        // For Firebase Storage URLs, fetch the blob to force download
        const response = await fetch(attachment.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.caption || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('No download URL available for attachment');
      }
    } catch (error) {
      console.error('Failed to download attachment:', error);
      // Fallback: open in new tab
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(stories.length / storiesPerPage);
  const startIndex = (currentPage - 1) * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const currentStories = stories.slice(startIndex, endIndex);

  // Calculate attachment pagination
  const totalAttachmentPages = Math.ceil(attachments.length / attachmentsPerPage);
  const attachmentStartIndex = (attachmentPage - 1) * attachmentsPerPage;
  const attachmentEndIndex = attachmentStartIndex + attachmentsPerPage;
  const currentAttachments = attachments.slice(attachmentStartIndex, attachmentEndIndex);

  const CustomStoryCard = ({ story, onClick }) => {
    const [treeName, setTreeName] = useState('');
    const [personName, setPersonName] = useState('');
    const [creatorName, setCreatorName] = useState('');
    const attachmentCount = story.attachments?.length || 0;

    useEffect(() => {
      const fetchAdditionalInfo = async () => {
        try {
          if (story.treeId) {
            const tree = await dataService.getTree(story.treeId);
            setTreeName(tree?.familyName || 'Unknown Family');
          } else {
            setTreeName('Unknown Family');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching tree info for story:', story.id, 'treeId:', story.treeId);
          } else {
            console.error('Error fetching tree info:', error);
          }
          setTreeName('Unknown Family');
        }

        try {
          if (story.personId) {
            console.log('Fetching person info for story:', story.id, 'personId:', story.personId);
            const person = await dataService.getPerson(story.personId);
            console.log('Person data received for story:', story.id, 'person:', person);
            setPersonName(person?.name || 'Unknown Person');
          } else {
            console.log('No personId for story:', story.id);
            setPersonName('Unknown Person');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching person info for story:', story.id, 'personId:', story.personId);
          } else {
            console.error('Error fetching person info for story:', story.id, 'personId:', story.personId, 'Error:', error.message, error);
          }
          setPersonName('Unknown Person');
        }

        try {
          if (story.createdBy) {
            if (story.createdBy === currentUser.uid) {
              setCreatorName('You');
            } else {
              // Attempt to fetch other user's info
              const userDoc = await dataService.getUser(story.createdBy);
              setCreatorName(userDoc?.displayName || userDoc?.name || 'Unknown User');
            }
          } else {
            setCreatorName('Unknown User');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching creator info for story:', story.id, 'createdBy:', story.createdBy);
          } else {
            console.error('Error fetching creator info for story:', story.id, 'createdBy:', story.createdBy, 'Error:', error.message, error);
          }
          setCreatorName('Unknown User');
        }
      };

      fetchAdditionalInfo();
    }, [story.treeId, story.personId, story.createdBy]);

    return (
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200 p-4"
        onClick={() => onClick && onClick(story)}
        style={{
          width: "280px",
          minWidth: "280px",
        }}
      >
        {/* Header with title and attachment count */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
            {story.title || "Untitled Story"}
          </h3>
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
              <Paperclip size={12} />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-3">
          {story.subTitle || story.description || "No description available"}
        </p>

        {/* Family and Person info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Family: {treeName}</span>
          <span>Person: {personName}</span>
        </div>

        {/* Footer with author and creation date */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{creatorName}</span>
          </div>
          <span>
            {story.createdAt
              ? new Date(story.createdAt?.toDate?.() || story.createdAt).toLocaleDateString()
              : "Unknown date"
            }
          </span>
        </div>
      </div>
    );
  };

  const CustomAttachmentCard = ({ attachment, onDownload }) => {
    const [treeName, setTreeName] = useState('');
    const [personName, setPersonName] = useState('');
    const [storyCreatorName, setStoryCreatorName] = useState('');

    useEffect(() => {
      const fetchAdditionalInfo = async () => {
        try {
          if (attachment.treeId) {
            const tree = await dataService.getTree(attachment.treeId);
            setTreeName(tree?.familyName || 'Unknown Family');
          } else {
            setTreeName('Unknown Family');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching tree info for attachment:', attachment.id, 'treeId:', attachment.treeId);
          } else {
            console.error('Error fetching tree info:', error);
          }
          setTreeName('Unknown Family');
        }

        try {
          if (attachment.personId) {
            console.log('Fetching person info for attachment:', attachment.id, 'personId:', attachment.personId);
            const person = await dataService.getPerson(attachment.personId);
            console.log('Person data received for attachment:', attachment.id, 'person:', person);
            setPersonName(person?.name || 'Unknown Person');
          } else {
            console.log('No personId for attachment:', attachment.id);
            setPersonName('Unknown Person');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching person info for attachment:', attachment.id, 'personId:', attachment.personId);
          } else {
            console.error('Error fetching person info for attachment:', attachment.id, 'personId:', attachment.personId, 'Error:', error.message, error);
          }
          setPersonName('Unknown Person');
        }

        try {
          if (attachment.storyCreatedBy) {
            if (attachment.storyCreatedBy === currentUser.uid) {
              setStoryCreatorName('You');
            } else {
              // Attempt to fetch other user's info
              const userDoc = await dataService.getUser(attachment.storyCreatedBy);
              setStoryCreatorName(userDoc?.displayName || userDoc?.name || 'Unknown User');
            }
          } else {
            setStoryCreatorName('Unknown User');
          }
        } catch (error) {
          if (error.message?.includes('Missing or insufficient permissions')) {
            console.log('Permission issue fetching creator info for attachment:', attachment.id, 'storyCreatedBy:', attachment.storyCreatedBy);
          } else {
            console.error('Error fetching creator info for attachment:', attachment.id, 'storyCreatedBy:', attachment.storyCreatedBy, 'Error:', error.message, error);
          }
          setStoryCreatorName('Unknown User');
        }
      };

      fetchAdditionalInfo();
    }, [attachment.treeId, attachment.personId, attachment.storyCreatedBy]);

    const formatFileSize = (bytes) => {
      if (!bytes) return 'Unknown size';
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const renderPreview = () => {
      if (!attachment.url) return null;
      return (
        <MediaPlayerBox
          file={attachment.url}
          name={attachment.caption}
          style={{ width: '100%', height: '128px', borderRadius: '8px', marginBottom: '12px' }}
        />
      );
    };

    const handleAttachmentClick = () => {
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    };

    return (
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-4 cursor-pointer"
        onClick={handleAttachmentClick}
        style={{
          width: "280px",
          minWidth: "280px",
        }}
      >
        {/* Preview */}
        {renderPreview()}

        {/* Header with file icon and download button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <File size={20} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
              <h3 className="text-sm font-semibold text-gray-900 truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px]" title={attachment.caption || "Unnamed File"}>
                {attachment.caption || "Unnamed File"}
              </h3>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDownload && onDownload(attachment)}
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded flex-shrink-0"
          >
            <Download size={12} />
            
          </button>
        </div>

        {/* Story info */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">
            <span className="font-medium">Story:</span> {attachment.storyTitle}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Created by:</span> {storyCreatorName}
          </p>
        </div>

        {/* Family and Person info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Family: {treeName}</span>
          <span>Person: {personName}</span>
        </div>

        {/* Footer with attachment date */}
        <div className="text-xs text-gray-500">
          <span>
            Created: {(attachment.createdAt || attachment.storyCreatedAt)
              ? new Date((attachment.createdAt || attachment.storyCreatedAt)?.toDate?.() || (attachment.createdAt || attachment.storyCreatedAt)).toLocaleDateString()
              : "Unknown date"
            }
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text variant="heading2">Loading your stories...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Text variant="heading2" color="error">{error}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Column padding='0px' justifyContent='flex-start' margin='0px' fitContent gap='0.5rem'>
        <Text variant="heading1" style={{ marginBottom: '1rem', marginTop: '3rem', textAlign: 'center' }}>
          Section I : Stories
        </Text>

        <Row padding='0px' justifyContent='flex-start' fitContent alignItems='center' gap='1rem'>
          <Text variant="body1" color="secondary-text" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            Stories and memories you've contributed to across all your family trees :
          </Text>

          <Text variant="body2" color="secondary-text" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} contributed to
          </Text>
        </Row>
      </Column>
      <Spacer size="md" />

      {stories.length === 0 ? (
        <Card padding="3rem" backgroundColor="var(--color-background-secondary)" style={{ textAlign: 'center' }}>
          <Text variant="heading3" color="tertiary-text">
            No stories yet
          </Text>
          <Spacer size="md" />
          <Text variant="body1" color="tertiary-text">
            Start creating stories in your family trees to see them here.
          </Text>
        </Card>
      ) : (
        <>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'flex-start' }}>
            {currentStories.map((story) => (
              <CustomStoryCard
                key={story.id}
                story={story}
                onClick={handleStoryClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <Spacer size="lg" />
      <Spacer size="lg" />

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <>
          <Column padding='0px' justifyContent='flex-start' margin='0px' fitContent gap='0.5rem'>
            <Text variant="heading1" style={{ marginBottom: '1rem', marginTop: '3rem', textAlign: 'center' }}>
             Section II : Attachments
          </Text>

          <Row padding='0px' justifyContent='flex-start' fitContent alignItems='center' gap='1rem'>
          <Text variant="body1" color="secondary-text" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            All files attached to your stories :
          </Text>

          <Text variant="body2" color="secondary-text" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'} found
          </Text>
          </Row>


          </Column>
          <Spacer size="md" />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'flex-start' }}>
            {currentAttachments.map((attachment, index) => (
              <CustomAttachmentCard
                key={`${attachment.storyId}-${attachment.id}-${index}`}
                attachment={attachment}
                onDownload={handleDownloadAttachment}
              />
            ))}
          </div>

          {/* Attachment Pagination */}
          {totalAttachmentPages > 1 && (
            <Pagination
              currentPage={attachmentPage}
              totalPages={totalAttachmentPages}
              onPageChange={handleAttachmentPageChange}
            />
          )}
        </>
      )}

      {/* Story Modal */}
      <StoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        story={selectedStory}
      />
    </div>
  );
};

export default MyStoriesPage;
