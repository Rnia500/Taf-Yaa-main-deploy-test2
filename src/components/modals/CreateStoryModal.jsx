// Taf'Yaa — Create / Edit Story Modal with integrated Voice Recorder

import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Card from '../../layout/containers/Card';
import Text from '../Text';
import Spacer from '../Spacer';
import Row from '../../layout/containers/Row';
import Button from '../Button';
import { TextInput, TextArea } from '../Input';
import VoiceStoryRecorder from '../VoiceStoryRecorder';
import dataService from '../../services/dataService';
import { Mic, PenLine } from 'lucide-react';

const TAB_CSS = `
  .csm-tab-bar { display:flex; background:#f3f4f6; border-radius:12px; padding:4px; gap:4px; }
  .csm-tab {
    flex:1; display:flex; align-items:center; justify-content:center; gap:7px;
    padding:9px 14px; border-radius:9px; border:none; font-size:13px;
    font-weight:600; cursor:pointer; transition:all .18s;
    color:#6b7280; background:transparent;
  }
  .csm-tab.active {
    background:#fff; color:var(--color-primary1,#16a34a);
    box-shadow:0 2px 8px rgba(0,0,0,0.1);
  }
  .csm-tab:not(.active):hover { color:#374151; }
`;

const CreateStoryModal = ({ isOpen, onClose, personId, treeId, addedBy, personName, editingStory }) => {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation]       = useState('');
  const [time, setTime]               = useState('');
  const [tags, setTags]               = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState(null);

  // Tab: 'text' | 'voice'
  const [tab, setTab] = useState('text');

  // Populate form when editing
  useEffect(() => {
    if (editingStory) {
      setTitle(editingStory.title || '');
      setDescription(editingStory.description || '');
      setLocation(editingStory.location || '');
      setTime(editingStory.time || '');
      setTags(editingStory.tags ? editingStory.tags.join(', ') : '');
    } else {
      setTitle(''); setDescription(''); setLocation('');
      setTime(''); setTags('');
    }
    setTab('text');
  }, [editingStory, isOpen]);

  const handleClose = () => {
    setTitle(''); setDescription(''); setLocation(''); setTime(''); setTags('');
    setError(null); setTab('text'); onClose();
  };

  // Called when VoiceStoryRecorder finishes — fills description automatically
  const handleTranscript = (text) => {
    setDescription(prev => prev ? `${prev}\n\n${text}` : text);
    setTab('text'); // Switch to text tab so user sees the filled field
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setIsSubmitting(true); setError(null);
    try {
      const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (editingStory) {
        await dataService.updateStory(editingStory.id, {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          time: time.trim() || null,
          tags: parsedTags.length ? parsedTags : null,
        });
      } else {
        await dataService.addStory({
          id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          personId, treeId, createdBy: addedBy,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          time: time.trim() || null,
          tags: parsedTags.length ? parsedTags : null,
          attachments: [], contributors: [addedBy], active: true,
        });
      }
      window.dispatchEvent(new Event('familyDataChanged'));
      handleClose();
    } catch (err) {
      console.error('Failed to save story:', err);
      setError(`Failed to ${editingStory ? 'update' : 'create'} story. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="640px">
      <style>{TAB_CSS}</style>
      <Card fitContent padding='10px' backgroundColor="var(--color-transparent)">
        <Text variant='heading2'>{editingStory ? 'Edit Story' : 'Create New Story'}</Text>
        <Spacer size='md'/>

        {/* ── Tab switcher (only on create, not edit) ──────────────── */}
        {!editingStory && (
          <>
            <div className="csm-tab-bar">
              <button className={`csm-tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>
                <PenLine size={14}/> Type Manually
              </button>
              <button className={`csm-tab ${tab === 'voice' ? 'active' : ''}`} onClick={() => setTab('voice')}>
                <Mic size={14}/> Record Voice
              </button>
            </div>
            <Spacer size='lg'/>
          </>
        )}

        {/* ── Voice tab ─────────────────────────────────────────────── */}
        {tab === 'voice' && !editingStory && (
          <div style={{ animation:'vsr-fadeUp .3s ease' }}>
            <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 14px', lineHeight:1.6 }}>
              Record a voice story in any language — it will be automatically transcribed and placed into the description field.
            </p>
            <VoiceStoryRecorder
              treeId={treeId}
              personId={personId}
              personName={personName || 'this person'}
              onTranscript={handleTranscript}
              compact={false}
            />
            <Spacer size='lg'/>
            {description && (
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#15803d' }}>
                ✅ Transcript added to description. Switch to "Type Manually" to review and complete your story.
              </div>
            )}
          </div>
        )}

        {/* ── Text tab ──────────────────────────────────────────────── */}
        {(tab === 'text' || editingStory) && (
          <>
            <TextInput
              label="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter story title"
              required
            />
            <Spacer size='md'/>

            <div style={{ position:'relative' }}>
              <TextArea
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story… or switch to Record Voice to transcribe automatically"
                rows={5}
              />
              {/* Inline voice hint button */}
              {!editingStory && !description && (
                <button
                  onClick={() => setTab('voice')}
                  style={{
                    position:'absolute', bottom:12, right:12,
                    display:'flex', alignItems:'center', gap:5,
                    background:'linear-gradient(135deg,#1F724A,#16a34a)',
                    color:'#fff', border:'none', borderRadius:20,
                    padding:'5px 12px', fontSize:11, fontWeight:700,
                    cursor:'pointer', boxShadow:'0 2px 8px rgba(22,163,74,0.3)',
                  }}>
                  <Mic size={11}/> Record instead
                </button>
              )}
            </div>
            <Spacer size='md'/>

            <Row gap='1rem' padding='0px' margin='0px'>
              <TextInput label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g., Yaoundé, Cameroon"/>
              <TextInput label="Time" value={time} onChange={e => setTime(e.target.value)} placeholder="e.g., 1995, Summer 2020"/>
            </Row>
            <Spacer size='md'/>

            <TextInput
              label="Tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Comma-separated (e.g., family, childhood, celebration)"
            />
            <Spacer size='lg'/>

            {error && (
              <Text variant='body2' color='error' style={{ textAlign:'center' }}>{error}</Text>
            )}
            <Spacer size='md'/>

            <Row gap='1rem' justifyContent='flex-end'>
              <Button fullWidth variant='secondary' onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
              <Button fullWidth variant='primary' onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (editingStory ? 'Updating…' : 'Creating…') : (editingStory ? 'Update Story' : 'Create Story')}
              </Button>
            </Row>
          </>
        )}
      </Card>
    </Modal>
  );
};

export default CreateStoryModal;