import React, { useState, useRef, useContext } from "react";
import Modal from "../../layout/containers/Modal";
import Card from "../../layout/containers/Card";
import Text from "../Text";
import Row from "../../layout/containers/Row";
import Column from "../../layout/containers/Column";
import Spacer from "../Spacer";
import Button from "../Button";
import FileUpload from "../FileUpload";
import AudioPlayer from "../AudioPLayer";
import WaveformPlayer from "../WaveformPlayer";
import { TextInput } from "../Input";
import { Play, Pause, X, Upload } from "lucide-react";
import { TreeContext } from "../../context/TreeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import dataService from "../../services/dataService.js";

const AddAttachmentModal = ({ isOpen, onClose, onAttachmentAdded }) => {
  const context = useContext(TreeContext);
  const treeId = context?.treeId || "creating";
  const { currentUser } = useAuth();

  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [caption, setCaption] = useState("");

  const fileInputRef = useRef(null);

  const detectFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (file.type === "application/pdf") return "pdf";
    return "unknown";
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const type = detectFileType(selectedFile);
    if (type === "unknown") {
      setError("Unsupported file type. Please select an image, video, audio, or PDF file.");
      return;
    }

    setFile(selectedFile);
    setFileType(type);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !fileType) return;
    setUploadStatus("uploading");

    try {
      const result = await dataService.uploadFile(file, fileType, {
        treeId,
        personId: null,
        userId: currentUser?.uid,
      });

      const attachment = {
        attachmentId: `attachment_${Date.now()}`,
        url: result.url,
        type: fileType,
        caption: caption || file.name,
        uploadedBy: currentUser?.uid,
        cloudinaryId: result.cloudinaryId || null,
        format: result.format || null,
        size: result.size || file.size,
        duration: result.duration || null,
        width: result.width || null,
        height: result.height || null,
      };

      setUploadStatus("success");
      if (onAttachmentAdded) onAttachmentAdded(attachment);

      setTimeout(() => handleClose(), 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStatus("error");
      setError("Upload failed. Please try again.");
    }
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setFileType(null);
    setPreviewUrl(null);
    setError(null);
    setUploadStatus("idle");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCaption("");
  };

  const handleClose = () => {
    handleRemove();
    onClose();
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderPreview = () => {
    if (!file || !fileType) return null;

    switch (fileType) {
      case "image":
        return (
          <Column gap="16px"  padding="0px" margin="0px" className="w-full">
            <Text variant="body1" bold className="text-center">{file.name}</Text>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded-lg"
            />

                <div className="flex justify-center">
               <Card
                rounded
                size="40px"
                margin="0.5rem"
                backgroundColor="var(--color-danger)"
                alignItems="center"
                onClick={handleRemove}
              >
                <X size={20}  />
              </Card>

             </div>
          </Column>
        );

      case "audio":
        return (
          <Column gap="16px" padding="0px" margin="0px" className="w-full">
            <Row justifyContent="space-between" alignItems="center">
              <Text variant="body1" bold>{file.name}</Text>
              <Text variant="caption2" color="var(--color-gray)">
                {formatTime(duration)}
              </Text>
            </Row>

            <div className="flex-1 flex items-center justify-center">
              <WaveformPlayer
                audioUrl={previewUrl}
                isPlaying={isPlaying}
                onTogglePlay={setIsPlaying}
                onReady={setDuration}
                onTimeUpdate={setCurrentTime}
              />
            </div>

            <Row justifyContent="center" gap="12px">
              <AudioPlayer
                audioURL={previewUrl}
                isActive={isPlaying}
                onActivate={() => setIsPlaying(!isPlaying)}
              />
              <Card
                rounded
                size="40px"
                margin="0.5rem"
                backgroundColor="var(--color-danger)"
                alignItems="center"
                onClick={handleRemove}
              >
                <X size={20}  />
              </Card>
            </Row>
          </Column>
        );

      case "video":
        return (
          <Column gap="16px" justifyContent="center" alignItems="center"  padding="0px" margin="0px">
            <div className="flex justify-center max-w-800px mx-auto">
              <Text variant="body1" ellipsisLines={2} bold className="text-center">{file.name}</Text>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <video
                src={previewUrl}
                controls
                className="w-full max-h-64 rounded-lg"
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
              />
            </div>

             <div className="flex justify-center">
               <Card
                rounded
                size="40px"
                margin="0.5rem"
                backgroundColor="var(--color-danger)"
                alignItems="center"
                onClick={handleRemove}
              >
                <X size={20}  />
              </Card>

             </div>

          </Column>
        );

      case "pdf":
        return (
          <Column gap="16px" padding="0px" margin="0px" className="w-full">
            <Text variant="body1" bold className="text-center">{file.name}</Text>
            <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="text-6xl text-gray-400 mb-2">📄</div>
                <Text variant="body2" color="var(--color-gray)">PDF Document</Text>
                <Text variant="caption2" color="var(--color-gray-dark)">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
            </div>

            <div className="flex justify-center">
              <Card
                rounded
                size="40px"
                margin="0.5rem"
                backgroundColor="var(--color-danger)"
                alignItems="center"
                onClick={handleRemove}
              >
                <X size={20} />
              </Card>
            </div>
          </Column>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="450px" maxHeight="90vh">
      
        <Text as="span" variant="heading1" color="primary">
          Add Attachment
        </Text>
      
      <Column padding="0px" margin="0px" gap="1.5rem">

        {!file ? (
          <FileUpload
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf"
            label="Choose a file to attach"
          />
        ) : (
          <Card
            padding="0.5rem"
            borderRadius="16px"
            backgroundColor="white"
            className="flex flex-col gap-4 shadow-sm"
          >
            {renderPreview()}

            <TextInput
              label="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter a caption for this attachment"
            />

            {uploadStatus === "uploading" && (
              <Text variant="caption2" color="var(--color-gray)" className="text-center">
                Uploading...
              </Text>
            )}
            {uploadStatus === "success" && (
              <Text variant="caption2" color="var(--color-success)" className="text-center">
                Upload successful!
              </Text>
            )}
            {uploadStatus === "error" && (
              <Text variant="caption2" color="var(--color-danger)" className="text-center">
                {error}
              </Text>
            )}
          </Card>
        )}

        

        <Row padding="0px" margin="0px" gap="12px">
          <Button
            fullWidth
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="primary"
            onClick={handleUpload}
            disabled={!file || uploadStatus === "uploading"}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            {uploadStatus === "Attaching" ? "Attaching..." : "Attach"}
          </Button>
        </Row>

        <Card padding="12px" backgroundColor="var(--color-light-blue)">
          <Text variant="caption2" color="var(--color-primary-dark)">
            Supported formats: Images (JPG, PNG), Videos (MP4, WebM), Audio (MP3, WAV, M4A), PDFs
          </Text>
        </Card>
      </Column>
    </Modal>
  );
};

export default AddAttachmentModal;
