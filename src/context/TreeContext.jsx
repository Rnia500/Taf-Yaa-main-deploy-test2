import React, { createContext, useContext } from 'react';

export const TreeContext = createContext();

export const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTree must be used within a TreeProvider');
  }
  return context;
};

export const TreeProvider = ({ children, treeId }) => {
  const value = {
    treeId,
  };

  return (
    <TreeContext.Provider value={value}>
      {children}
    </TreeContext.Provider>
  );
};
