import React, { useState, useEffect } from 'react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Text from '../Text';
import FlexContainer from '../../layout/containers/FlexContainer';
import Divider from '../Divider';
import dataService from '../../services/dataService';
import Spacer from '../Spacer';
import Card from '../../layout/containers/Card';


const PersonMiniCard = ({ person }) => (
  <Card
    backgroundColor='var(--color-backgound)' 
    borderColor='var(--color-success-light)'
    shadow
    width='90px'
    padding="0.5rem"
  >
    <img
      src={person.image || '/Images/default-avatar.png'}
      alt={person.name}
      className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-700"
    />
    <div className='w-20 mt-1'>
      <Text align='center' variant='caption1' ellipsis >{person.name}</Text>
      {person.relation && (
        <p className="text-xs text-gray-500">{person.relation}</p>
      )}
    </div>
  </Card>
);

//  Section wrapper for each family relationship category 
const SectionCard = ({ title, color, icon, people }) => (
  <Card
    backgroundColor='var(--color-transparent)'
    borderColor='var(--color-gray)'
    alignItems='flex-start'
    padding="0.5rem"
  >
    <h3 className={`flex items-center gap-2 text-${color}-700 dark:text-${color}-300 font-semibold mb-3`}>
      <span>{icon}</span> {title}
    </h3>

    {people?.length ? (
      <div className="grid sm:grid-cols-2 gap-3">
        {people.map((p) => (
          <PersonMiniCard key={p.id} person={p} />
        ))}
      </div>
    ) : (
      <p className="text-gray-400 text-sm italic">No {title.toLowerCase()} found.</p>
    )}
  </Card>
);

const RelationshipsModal = ({ isOpen, onClose, personId }) => {
  const [relationships, setRelationships] = useState({
    spouses: [],
    children: [],
    parents: [],
    siblings: [],
    halfSiblings: [],
  });
  const [person, setPerson] = useState(null);
  const [error, setError] = useState(null);

  //  Data fetching & relationship calculation 
  useEffect(() => {
    if (!isOpen || !personId) return;

    setError(null);
    const loadRelationships = async () => {
      try {
        const personData = await dataService.getPerson(personId);
        setPerson(personData);

        const [allPeople, allMarriages] = await Promise.all([
          dataService.getAllPeople(),
          dataService.getAllMarriages(),
        ]);

        const rels = calculateRelationships(personData, allPeople, allMarriages);
        setRelationships(rels);
      } catch (err) {
        console.error('Error loading relationships:', err);
        setError(err.message || 'An error occurred while loading relationships.');
      }
    };
    loadRelationships();
  }, [isOpen, personId]);

  //  Core logic (unchanged from your version) 
  const calculateRelationships = (person, allPeople, allMarriages) => {
    const connections = { spouses: [], children: [], parents: [], siblings: [], halfSiblings: [] };
    const peopleMap = new Map((allPeople || []).map(p => [p.id, p]));

    (allMarriages || []).forEach(m => {
      // MONOGAMOUS
      if (m.marriageType === 'monogamous') {
        if (Array.isArray(m.spouses) && m.spouses.includes(person.id)) {
          (m.spouses || []).forEach(sid => {
            if (sid !== person.id) {
              const spousePerson = peopleMap.get(sid);
              if (spousePerson) connections.spouses.push({
                id: spousePerson.id,
                name: spousePerson.name,
                image: spousePerson.photoUrl || '/Images/default-avatar.png'
              });
            }
          });
          (m.childrenIds || []).forEach(cid => {
            const child = peopleMap.get(cid);
            if (child) connections.children.push({
              id: child.id,
              name: child.name,
              image: child.photoUrl || '/Images/default-avatar.png'
            });
          });
        }

        if (Array.isArray(m.childrenIds) && m.childrenIds.includes(person.id)) {
          (m.spouses || []).forEach(pid => {
            const pperson = peopleMap.get(pid);
            if (pperson) connections.parents.push({
              id: pperson.id,
              name: pperson.name,
              image: pperson.photoUrl || '/Images/default-avatar.png'
            });
          });
          (m.childrenIds || []).forEach(cid => {
            if (cid !== person.id) {
              const sib = peopleMap.get(cid);
              if (sib) connections.siblings.push({
                id: sib.id,
                name: sib.name,
                image: sib.photoUrl || '/Images/default-avatar.png'
              });
            }
          });
        }
      }

      // POLYGAMOUS
      if (m.marriageType === 'polygamous') {
        if (m.husbandId === person.id) {
          (m.wives || []).forEach(w => {
            const spousePerson = peopleMap.get(w.wifeId);
            if (spousePerson) connections.spouses.push({
              id: spousePerson.id,
              name: spousePerson.name,
              image: spousePerson.photoUrl || '/Images/default-avatar.png'
            });
            (w.childrenIds || []).forEach(cid => {
              const child = peopleMap.get(cid);
              if (child) connections.children.push({
                id: child.id,
                name: child.name,
                image: child.photoUrl || '/Images/default-avatar.png'
              });
            });
          });
        } else if ((m.wives || []).some(w => w.wifeId === person.id)) {
          const husband = peopleMap.get(m.husbandId);
          if (husband) connections.spouses.push({
            id: husband.id,
            name: husband.name,
            image: husband.photoUrl || '/Images/default-avatar.png'
          });
          const myWife = (m.wives || []).find(w => w.wifeId === person.id) || { childrenIds: [] };
          (myWife.childrenIds || []).forEach(cid => {
            const child = peopleMap.get(cid);
            if (child) connections.children.push({
              id: child.id,
              name: child.name,
              image: child.photoUrl || '/Images/default-avatar.png'
            });
          });
        }

        (m.wives || []).forEach(w => {
          if ((w.childrenIds || []).includes(person.id)) {
            const father = peopleMap.get(m.husbandId);
            if (father) connections.parents.push({
              id: father.id,
              name: father.name,
              image: father.photoUrl || '/Images/default-avatar.png'
            });
            const mother = peopleMap.get(w.wifeId);
            if (mother) connections.parents.push({
              id: mother.id,
              name: mother.name,
              image: mother.photoUrl || '/Images/default-avatar.png'
            });
            (m.wives || []).forEach(w2 => {
              (w2.childrenIds || []).forEach(sibId => {
                if (sibId !== person.id) {
                  const sib = peopleMap.get(sibId);
                  if (sib) {
                    const isHalfSibling = w.wifeId !== w2.wifeId;
                    const targetArray = isHalfSibling ? connections.halfSiblings : connections.siblings;
                    targetArray.push({
                      id: sib.id,
                      name: sib.name,
                      image: sib.photoUrl || '/Images/default-avatar.png'
                    });
                  }
                }
              });
            });
          }
        });
      }
    });

    const uniqueById = arr => Array.from(new Map((arr || []).map(a => [a.id, a])).values());
    connections.spouses = uniqueById(connections.spouses);
    connections.children = uniqueById(connections.children);
    connections.parents = uniqueById(connections.parents);
    connections.siblings = uniqueById(connections.siblings);
    connections.halfSiblings = uniqueById(connections.halfSiblings);

    return connections;
  };

  //  Summary line under person's name 
  const summaryText = relationships
    ? [
        relationships.children.length ? `Parent of ${relationships.children.length}` : '',
        relationships.spouses.length ? `Married to ${relationships.spouses.map(s => s.name).join(', ')}` : '',
        relationships.parents.length ? `Child of ${relationships.parents.map(p => p.name).join(' & ')}` : '',
      ]
        .filter(Boolean)
        .join(' • ')
    : '';

  //  RENDER 
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <FlexContainer
        padding="1.5rem"
        direction="column"
        gap="1rem"
        style={{ maxWidth: '700px' }}
      >
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {person ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src={person.photoUrl || '/Images/default-avatar.png'}
                alt={person.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
              />
              <div>
                <Text variant="h3" color="primary">{person.name}</Text>
                <p className="text-gray-500 text-sm">{summaryText}</p>
              </div>
            </div>

            <Divider />

            {/* Relationship sections */}
            
              <SectionCard title="Spouses" color="rose" icon="❤️" people={relationships.spouses} />
              <SectionCard title="Children" color="sky" icon="👶" people={relationships.children} />
              <SectionCard title="Parents" color="green" icon="🌿" people={relationships.parents} />
              <SectionCard title="Siblings" color="indigo" icon="👭" people={relationships.siblings} />
              {relationships.halfSiblings?.length > 0 && (
                <SectionCard title="Half-Siblings" color="amber" icon="⚖️" people={relationships.halfSiblings} />
              )}
            
            <Spacer size="sm" />
          </>
        ) : (
          <Text variant="body1">Loading relationships...</Text>
        )}

        <Button variant='primary' fullWidth onClick={onClose}>Close</Button>
      </FlexContainer>
    </Modal>
  );
};

export default RelationshipsModal;
