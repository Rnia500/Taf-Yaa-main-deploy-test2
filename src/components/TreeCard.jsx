import React from 'react';
import Text from './Text';
import Button from './Button';
import DeletionCountdown from './DeletionCountdown';

const TreeCard = ({ tree, rootName, peopleCount, userRole, onClick, onContextMenu, onRestore, onPurge }) => {
  const isDeleted = tree.deletedAt;
  const timeRemaining = isDeleted ? 30 * 24 * 60 * 60 * 1000 - (new Date() - new Date(tree.deletedAt.toDate ? tree.deletedAt.toDate() : tree.deletedAt)) : 0;

  return (
<div
  onClick={onClick}
  onContextMenu={onContextMenu}
  className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 group w-[320px] sm:w-[340px] lg:w-[360px] ${isDeleted ? 'opacity-75' : ''}`}
>

      <div className="relative h-64 w-full">
        <img
          src={tree.familyPhoto}
          alt={`${tree.familyName} family`}
          className="w-full h-full object-cover aspect-square"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        {isDeleted && (
          <>
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              Deleted
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex flex-col items-center gap-1">
              <DeletionCountdown timeRemaining={timeRemaining} />
              <div className="flex justify-center gap-2">
                <Button size="small" variant="primary" onClick={(e) => { e.stopPropagation(); onRestore(tree.id); }}>Restore</Button>
                <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); onPurge(tree.id); }}>Purge</Button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-6">
        <Text variant='heading3' bold>The {tree.familyName} Family Tree</Text>
        <div className="text-gray-600 space-y-1 mt-2">
          <p><span className="text-sm font-semibold">Role:</span> {userRole}</p>
          <p><span className="text-sm font-semibold">Root Person:</span> {rootName || 'Loading...'}</p>
          <p><span className="text-sm font-semibold">Number of members:</span> {peopleCount}</p>
        </div>

      </div>
    </div>
  );
};

export default TreeCard;
