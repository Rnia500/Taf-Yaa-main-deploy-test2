// src/components/PersonMenu.jsx
import React, { useEffect, useRef, useState } from 'react';
import usePersonMenuStore from '../store/usePersonMenuStore';
import useModalStore from '../store/useModalStore';
import dataService from '../services/dataService';
import useToastStore from '../store/useToastStore';
import { usePermissions } from '../hooks/usePermissions';
import { ListCollapse, CircleUserRound, MapPinHouse, GitCompareArrows, UserRoundPlus, UserRoundPen, Heart, Baby, Users, User, ChevronRight, Undo2 } from 'lucide-react';
import '../styles/PersonMenu.css';

function PersonMenu({ treeId, _treeData, handleToggleCollapse, handleOpenProfile, handleTraceLineage, handleSetAsRoot, onAddSpouse, onAddChild, onAddParent, onEditPerson, onDeleteComplete }) {
  const { isOpen, targetNodeId, position, actions, targetPerson } = usePersonMenuStore();
  const menuRef = useRef(null);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const submenuRef = useRef(null);
  const [isSpouse, setIsSpouse] = useState(false);
  const [isSoftDeleted, setIsSoftDeleted] = useState(false);
  const { permissions } = usePermissions(treeId);
  const addToast = useToastStore(state => state.addToast);

  console.log('PersonMenu treeId:', treeId, 'canCreatePerson:', permissions.canCreatePerson?.allowed, 'canEditPerson:', permissions.canEditPerson?.allowed, 'canDeletePerson:', permissions.canDeletePerson?.allowed);


  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      const isClickOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      const isClickOutsideSubmenu = !showSubmenu || (submenuRef.current && !submenuRef.current.contains(event.target));

      if (isClickOutsideMenu && isClickOutsideSubmenu) {
        actions.closeMenu();
        setShowSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, actions, showSubmenu]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showSubmenu) {
          setShowSubmenu(false);
        } else {
          actions.closeMenu();
        }
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, actions, showSubmenu]);

  useEffect(() => {
    if (!isOpen) {
      setShowSubmenu(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !targetNodeId) {
      setIsSpouse(false);
      setIsSoftDeleted(false);
      return;
    }

    // Get person data
    const personPromise = dataService.getPerson(targetNodeId);

    personPromise
      .then((personModel) => {
        if (cancelled) return;

        if (personModel) {
          setIsSpouse(Boolean(personModel.isSpouse));
          setIsSoftDeleted(Boolean(personModel.deletionMode === "soft" && personModel.pendingDeletion));
        } else if (targetPerson && typeof targetPerson.isSpouse !== 'undefined') {
          setIsSpouse(Boolean(targetPerson.isSpouse));
          setIsSoftDeleted(Boolean(targetPerson.isSoftDeleted));
        } else {
          setIsSpouse(Boolean(targetPerson && targetPerson.variant === 'spouse'));
          setIsSoftDeleted(Boolean(targetPerson && targetPerson.isSoftDeleted));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setIsSpouse(Boolean(targetPerson && targetPerson.variant === 'spouse'));
        setIsSoftDeleted(Boolean(targetPerson && targetPerson.isSoftDeleted));
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, targetNodeId, targetPerson]);

  const { openModal } = useModalStore();

  const onDelete = () => {
    const person = targetPerson || { id: targetNodeId, name: targetPerson?.name };
    openModal('deletePerson', { person, onDeleteComplete });
    actions.closeMenu();
    setShowSubmenu(false);
  };

  const onRestore = async () => {
    if (!targetNodeId) return;
    
    try {
      await dataService.undoDelete(targetNodeId);
      addToast('Person restored successfully!', 'success');
      if (onDeleteComplete) onDeleteComplete({ action: 'restore' });
      actions.closeMenu();
      setShowSubmenu(false);
    } catch (error) {
      addToast(`Failed to restore person: ${error.message}`, 'error');
    }
  };

  if (!isOpen) return null;

  const onCollapse = () => {
    if (targetNodeId) handleToggleCollapse(targetNodeId);
    actions.closeMenu();
    setShowSubmenu(false);
  };

  const onOpenProfile = () => {
    if (targetNodeId) handleOpenProfile(targetNodeId);
    actions.closeMenu();
    setShowSubmenu(false);
  };

  const onTraceLineage = () => {
    if (targetNodeId && handleTraceLineage) {
      handleTraceLineage(targetNodeId);
    }
    actions.closeMenu();
    setShowSubmenu(false);
  };

  const onSetAsRoot = () => {
    if (targetNodeId && handleSetAsRoot) {
      handleSetAsRoot(targetNodeId);
    }
    actions.closeMenu();
    setShowSubmenu(false);
  };


  const handleAddRelative = (relativeType) => {
    const currentTargetNodeId = targetNodeId;
    actions.closeMenu();
    setShowSubmenu(false);

    if (relativeType === 'spouse') {
      onAddSpouse(currentTargetNodeId);
      console.log('Adding spouse for node:', currentTargetNodeId);

    } else if (relativeType === 'child') {
      onAddChild(currentTargetNodeId);
      console.log('Adding child for node:', currentTargetNodeId);

    } else if (relativeType === 'parent') {
      onAddParent(currentTargetNodeId);
      console.log('Adding parent for node:', currentTargetNodeId);
    } else {
      console.log(`Unknown relative type: ${relativeType}`);
    }
  };

  const toggleSubmenu = () => {
    setShowSubmenu(!showSubmenu);
  };
  const submenuPosition = {
    top: position.y + 150,
    left: position.x + 113
  };

  return (
    <>
      <div
        ref={menuRef}
        className="person-menu"
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 10000,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="person-menu-header">
          <div className="person-menu-title">Actions</div>
        </div>

        <div className="person-menu-items">
          {isSoftDeleted ? (
            <button className="person-menu-item" onClick={onRestore}>
              <Undo2 size={15} />
              <span className="person-menu-text" style={{ color: '#28a745' }}>Restore Person</span>
            </button>
          ) : (
            <>
              <button className="person-menu-item" onClick={onCollapse}>
                <ListCollapse size={15} />
                <span className="person-menu-text">Collapse / Expand</span>
              </button>
              <button className="person-menu-item" onClick={onOpenProfile}>
                <CircleUserRound size={15} />
                <span className="person-menu-text">Open Profile</span>
              </button>
              <button className="person-menu-item" onClick={onTraceLineage}>
                <MapPinHouse size={15} />
                <span className="person-menu-text">Trace Lineage</span>
              </button>
              <button className="person-menu-item" onClick={onSetAsRoot}>
                <GitCompareArrows size={15} />
                <span className="person-menu-text">Set as Root</span>
              </button>
              {/* Only show Add Relative, Edit Person, and Delete Person for members with appropriate permissions */}
              {permissions.canCreatePerson?.allowed && (
                <button className="person-menu-item" onClick={toggleSubmenu}>
                  <UserRoundPlus size={15} />
                  <span className="person-menu-text">Add Relative</span>
                  <ChevronRight style={{ marginLeft: 'auto' }} size={15} />
                </button>
              )}
              {permissions.canEditPerson?.allowed && (
                <button className="person-menu-item" onClick={() => { if (onEditPerson) onEditPerson(targetNodeId); actions.closeMenu(); setShowSubmenu(false); }}>
                  <UserRoundPen size={15} />
                  <span className="person-menu-text">Edit Person</span>
                </button>
              )}
              {permissions.canDeletePerson?.allowed && (
                <button className="person-menu-item" onClick={onDelete}>
                  <User size={15} />
                  <span className="person-menu-text" style={{ color: '#dc3545' }}>Delete Person</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showSubmenu && (
        <div
          ref={submenuRef}
          className="person-menu person-submenu"
          style={{
            position: 'fixed',
            top: submenuPosition.top,
            left: submenuPosition.left,
            zIndex: 10001,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="person-menu-header">
            <div className="person-menu-title">Add Relative</div>
          </div>

          <div className="person-menu-items">
            {!isSpouse && (
              <button className="person-menu-item" onClick={() => handleAddRelative('spouse')}>
                <Heart size={15} />
                <span className="person-menu-text">Add Spouse</span>
              </button>
            )}
            <button className="person-menu-item" onClick={() => handleAddRelative('child')}>
              <Baby size={15} />
              <span className="person-menu-text">Add Child</span>
            </button>

            {!isSpouse && (
              <button className="person-menu-item" onClick={() => handleAddRelative('parent')}>
                <Users size={15} />
                <span className="person-menu-text">Add Parent</span>
              </button>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default PersonMenu;