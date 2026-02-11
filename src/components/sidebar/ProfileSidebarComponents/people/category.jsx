import React from 'react';
import '../../../../styles/RelativesCard.css';

function Category({ title, children }) {
  return (
    <div className="category-block">
      <div className="category-title">{title}</div>
      {children}
    </div>
  );
}

export default Category;
