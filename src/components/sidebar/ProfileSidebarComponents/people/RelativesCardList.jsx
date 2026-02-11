import React from 'react';
import '../../../../styles/RelativesCard.css';
import RelativesCard from './RelativesCard';


function RelativesCardList({
  relatives = [],
  stacked = relatives.length > 1,
  onRelativeClick  = () => {},
}) {
  return (
    <div className={`relatives-list ${stacked ? 'stacked' : ''}`}>
      {relatives.map((relative, i) => (
        <RelativesCard
          key={relative.id || i}
          image={relative.image}
          name={relative.name}
          onClick={() => onRelativeClick(relative)}
        />
      ))}
    </div>
  );
}

export default RelativesCardList;

