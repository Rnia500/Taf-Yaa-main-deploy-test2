import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Column from '../layout/containers/Column';
import Row from '../layout/containers/Row';
import Button from '../components/Button';
import Grid from '../layout/containers/Grid';
import { useAuth } from '../context/AuthContext';
import dataService from '../services/dataService';
import ImageCard from '../layout/containers/ImageCard';
import { SearchInput } from '../components/Input';
import SelectDropdown from '../components/SelectDropdown';
import useModalStore from '../store/useModalStore';
import Toast from '../components/toasts/Toast';
import useToastStore from '../store/useToastStore';
import { authService } from '../services/authService';
import TreeInfoModal from '../components/modals/TreeInfoModal';
import WarningModal from '../components/modals/WarningModal';
import PurgeModal from '../components/modals/PurgeModal';
import TreeCard from '../components/TreeCard';
import Pagination from '../components/Pagination';
import LottieLoader from '../components/LottieLoader';

import '../styles/PersonMenu.css';
import { Users, User, CircleUserRound, MapPinHouse, GitCompareArrows, Settings, Filter } from 'lucide-react';
import PageFrame from '../layout/containers/PageFrame';
import MyTreeNavBar from '../components/navbar/MyTreeNavBar';

const MyTreesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const [trees, setTrees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [rootNames, setRootNames] = useState({});
  const addToast = useToastStore(state => state.addToast);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, treeId: null });
  const menuRef = useRef();
  const [isTreeInfoModalOpen, setIsTreeInfoModalOpen] = useState(false);
  const [treeInfoData, setTreeInfoData] = useState({ tree: null, rootName: 'N/A', creatorName: 'N/A' });
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [treeToPurge, setTreeToPurge] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; 
  const [peopleCounts, setPeopleCounts] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  const filterOptions = [
    { value: 'all', label: 'All Trees' },
    { value: 'active', label: 'Active' },
    { value: 'deleted', label: 'Deleted' }
  ];

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [contextMenu.visible]);

  useEffect(() => {
    const fetchTrees = async () => {
      if (!currentUser) return;
      try {
        const userTrees = await dataService.getTreesByUserId(currentUser.uid, true); // Include deleted

        // Automatic purging of expired trees (30 days)
        const now = new Date();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const activeTrees = [];
        for (const tree of userTrees) {
          if (tree.deletedAt && (now - new Date(tree.deletedAt)) > thirtyDaysMs) {
            try {
              await dataService.purgeTree(tree.id);
              console.log(`Automatically purged expired tree: ${tree.id}`);
            } catch (error) {
              console.error('Failed to auto-purge tree:', error);
            }
          } else {
            activeTrees.push(tree);
          }
        }

        setTrees(activeTrees);

        // Fetch root person names and people counts
        const names = {};
        const counts = {};
        for (const tree of activeTrees) {
          if (tree.currentRootId) {
            try {
              const person = await dataService.getPerson(tree.currentRootId);
              names[tree.id] = person ? person.name : 'Unknown';
            } catch (error) {
              console.error('Failed to fetch root person:', error);
              names[tree.id] = 'Unknown';
            }
          } else {
            names[tree.id] = 'No Root';
          }

          // Fetch people count for the tree
          try {
            console.log('Fetching people for tree query1:', tree.id, 'User:', currentUser?.uid, tree);
            const people = await dataService.getPeopleByTreeId(tree.id);
            counts[tree.id] = people.length;
          } catch (error) {
            console.error('Failed to fetch people count for tree:', error);
            counts[tree.id] = 0;
          }
        }
        setRootNames(names);
        setPeopleCounts(counts);
      } catch (error) {
        console.error('Failed to fetch trees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrees();
  }, [currentUser]);

  const filteredTrees = trees.filter(tree => {
    const matchesSearch = tree.familyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && !tree.deletedAt) ||
      (filterStatus === 'deleted' && tree.deletedAt);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredTrees.length / pageSize);
  const paginatedTrees = filteredTrees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const handleCreateTree = () => {
    openModal('treeModal', {
      createdBy: currentUser?.uid,
      navigate: navigate,
      onSuccess: async (result) => {
        console.log('Tree operation successful:', result);
        setTrees(prevTrees => {
          const existingIndex = prevTrees.findIndex(t => t.id === result.tree.id);
          if (existingIndex >= 0) {
            // Update existing tree
            const updatedTrees = [...prevTrees];
            updatedTrees[existingIndex] = result.tree;
            return updatedTrees;
          } else {
            // Add new tree
            return [...prevTrees, result.tree];
          }
        });

        // Fetch root name and people count for the tree (new or updated)
        if (result.tree.currentRootId) {
          try {
            const person = await dataService.getPerson(result.tree.currentRootId);
            setRootNames(prev => ({
              ...prev,
              [result.tree.id]: person ? person.name : 'Unknown'
            }));
          } catch (error) {
            console.error('Failed to fetch root person for tree:', error);
            setRootNames(prev => ({
              ...prev,
              [result.tree.id]: 'Unknown'
            }));
          }
        } else {
          setRootNames(prev => ({
            ...prev,
            [result.tree.id]: 'No Root'
          }));
        }

        // Fetch people count for the new/updated tree
        try {
           console.log('Fetching people for tree query2:', result.tree.id, 'User:', currentUser?.uid, result.tree);
          const people = await dataService.getPeopleByTreeId(result.tree.id);
          setPeopleCounts(prev => ({
            ...prev,
            [result.tree.id]: people.length
          }));
        } catch (error) {
          console.error('Failed to fetch people count for new tree:', error);
          setPeopleCounts(prev => ({
            ...prev,
            [result.tree.id]: 0
          }));
        }

        // Navigate to TreeCanvas with rootPerson preloaded
        if (result.tree && result.rootPerson) {
          const treeId = result.tree.id || result.tree._id || null;
          const rootPersonId = result.rootPerson.id || result.rootPerson._id || null;
          if (treeId && rootPersonId) {
            navigate(`/family-tree/${treeId}?root=${rootPersonId}`);
          }
        }
      }
    });
  };

  const handleJoinTree = () => {
    openModal('joinModal');
  }


  const handleTreeClick = (treeId) => {
    navigate(`/family-tree/${treeId}`);
  };

  const handleContextMenu = (e, treeId) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, treeId });
  };

  const handleManageMembers = (treeId) => {
    setContextMenu({ ...contextMenu, visible: false });
    navigate(`/family-tree/${treeId}/members`);
  };

  const handleDeleteTree = (treeId) => {
    setContextMenu({ ...contextMenu, visible: false });
    setTreeToDelete(treeId);
    setIsWarningModalOpen(true);
  };

  const confirmDeleteTree = async (_dontRemindMe) => {
    if (!treeToDelete) return;
    try {
      await dataService.softDeleteTree(treeToDelete);
      setTrees(trees.map(t => t.id === treeToDelete ? { ...t, deletedAt: new Date() } : t));
      addToast('Tree soft deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to soft delete tree:', error);
      addToast('Failed to soft delete tree', 'error');
    }
    setTreeToDelete(null);
  };

  const handleRestoreTree = async (treeId) => {
    try {
      await dataService.restoreTree(treeId);
      setTrees(trees.map(t => t.id === treeId ? { ...t, deletedAt: null } : t));
      addToast('Tree restored successfully', 'success');
    } catch (error) {
      console.error('Failed to restore tree:', error);
      addToast('Failed to restore tree', 'error');
    }
  };

  const handlePurgeTree = async (treeId) => {
    const tree = trees.find(t => t.id === treeId);
    if (!tree) return;
    setTreeToPurge(tree);
    setIsPurgeModalOpen(true);
  };

  const confirmPurgeTree = async () => {
    if (!treeToPurge) return;
    try {
      await dataService.purgeTree(treeToPurge.id);
      setTrees(trees.filter(t => t.id !== treeToPurge.id));
      addToast('Tree permanently deleted', 'success');
    } catch (error) {
      console.error('Failed to purge tree:', error);
      addToast('Failed to permanently delete tree', 'error');
    }
    setTreeToPurge(null);
  };

  const handleViewTreeInfo = async (treeId) => {
    setContextMenu({ ...contextMenu, visible: false });
    const tree = trees.find(t => t.id === treeId);
    if (!tree) return;

    // Fetch creator's user name for display
    let creatorName = 'N/A';
    if (tree.createdBy) {
      try {
        const userData = await authService.getUserById(tree.createdBy);
        if (userData?.displayName && userData.displayName !== tree.createdBy && userData.displayName !== 'Unknown') {
          creatorName = userData.displayName;
        } else {
          creatorName = `Anonymous User`; // Show anonymous if no proper name
        }
      } catch (error) {
        console.error('Failed to fetch creator name:', error);
        creatorName = `Anonymous User`;
      }
    }

    setTreeInfoData({
      tree,
      rootName: rootNames[treeId] || 'N/A',
      creatorName,
    });
    setIsTreeInfoModalOpen(true);
  };

  const handleSettings = (treeId) => {
    setContextMenu({ ...contextMenu, visible: false });
    navigate(`/family-tree/${treeId}/settings`);
  };




  const handleShareTree = () => {
    setContextMenu({ ...contextMenu, visible: false });
    addToast('Share tree functionality not implemented yet', 'info');
  };

  if (!currentUser) {
    return (
      <FlexContainer justify="center" align="center" padding="20px">
        <Text>Please log in to view your trees.</Text>
      </FlexContainer>
    );
  }

  if (loading) {
    return (
      <FlexContainer justify="center" align="center" padding="20px" style={{ height: '100vh' }}>
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="treeDataLoader2" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading your trees...
        </div>
      </FlexContainer>
    );
  }

  return (
    <PageFrame topbar={<MyTreeNavBar />}>
      <FlexContainer backgroundColor="#FDF8F0" direction="vertical" padding="20px" gap="20px">
        <Row justifyContent="space-between" fitContent align="center">
          <Text variant="heading1">My Trees</Text>
          <Row padding='0px' margin='0px' fitContent>
            <Button onClick={handleCreateTree}>Create Tree</Button>
            <Button onClick={handleJoinTree}>Join Tree</Button>
          </Row>

        </Row>

        <Row justify="flex-start" align="center" gap="16px">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search for a tree"
            style={{
              flex: 1,
              maxWidth: '300px'
            }}
          />
          <SelectDropdown
            options={filterOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value || 'all')}
            placeholder="Filter trees"
            style={{ width: '150px' }}
          />
        </Row>

        {filteredTrees.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No trees found. Create your first family tree!</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex flex-col">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-20 max-w-6xl justify-items-center w-full mx-auto">
                {paginatedTrees.map((tree) => {
                  const userMember = tree.members?.find(m => m.userId === currentUser.uid);
                  const userRole = userMember?.role || 'No role';
                  return (
                    <TreeCard
                      key={tree.id}
                      tree={tree}
                      rootName={rootNames[tree.id]}
                      peopleCount={peopleCounts[tree.id] || 0}
                      userRole={userRole}
                      onClick={() => handleTreeClick(tree.id)}
                      onContextMenu={(e) => handleContextMenu(e, tree.id)}
                      onRestore={handleRestoreTree}
                      onPurge={handlePurgeTree}
                    />
                  );
                })}
              </div>
            </div>
            
            {filteredTrees.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {contextMenu.visible && (
          <div
            ref={menuRef}
            className="person-menu"
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 10000,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="person-menu-header">
              <div className="person-menu-title">Tree Actions</div>
            </div>

            <div className="person-menu-items">
              <button className="person-menu-item" onClick={() => handleManageMembers(contextMenu.treeId)}>
                <Users size={15} />
                <span className="person-menu-text">Manage Members</span>
              </button>
              <button className="person-menu-item" onClick={() => handleViewTreeInfo(contextMenu.treeId)}>
                <CircleUserRound size={15} />
                <span className="person-menu-text">View Tree Info</span>
              </button>
              <button className="person-menu-item" onClick={() => handleSettings(contextMenu.treeId)}>
                <Settings size={15} />
                <span className="person-menu-text">Settings</span>
              </button>

              <button className="person-menu-item" onClick={() => handleShareTree()}>
                <GitCompareArrows size={15} />
                <span className="person-menu-text">Share Tree</span>
              </button>
              <button className="person-menu-item" onClick={() => handleDeleteTree(contextMenu.treeId)}>
                <User size={15} />
                <span className="person-menu-text" style={{ color: '#dc3545' }}>Soft Delete Tree</span>
              </button>
            </div>
          </div>
        )}



        <TreeInfoModal
          isOpen={isTreeInfoModalOpen}
          onClose={() => setIsTreeInfoModalOpen(false)}
          tree={treeInfoData.tree}
          rootName={treeInfoData.rootName}
          creatorName={treeInfoData.creatorName}
        />

        <WarningModal
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          onConfirm={confirmDeleteTree}
          title="Delete Tree"
          message="Are you sure you want to delete this tree? It can be restored within 30 days."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />

        <PurgeModal
          isOpen={isPurgeModalOpen}
          onClose={() => setIsPurgeModalOpen(false)}
          onConfirm={confirmPurgeTree}
          familyName={treeToPurge?.familyName || ''}
        />

      </FlexContainer>
    </PageFrame>
  );
};

export default MyTreesPage;
