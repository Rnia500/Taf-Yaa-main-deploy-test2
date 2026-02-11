import React from 'react';
import { Shield, Users, Globe, Settings, TreeDeciduous, CalendarDays, Lock, HeartHandshake, Eye } from 'lucide-react';
import Modal from '../../layout/containers/Modal';
import Button from '../Button';
import Divider from '../Divider';

export default function TreeInfoModal({ isOpen, onClose, tree, rootName, creatorName }) {
  if (!isOpen || !tree) return null;

  console.log('user name:', creatorName);
  console.log('user id:', tree.createdBy);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          borderRadius: '1rem',
          padding: '1rem',
          color: 'var(--color-primary-text)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, var(--color-success), var(--color-success-light))',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TreeDeciduous size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {tree.familyName || 'Unknown Family'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Family Tree Information</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Section title="Basic Information" icon={<Globe color="var(--color-success)" />}>
            <Grid>
              <Info label="Role" value={tree.role} />
              <Info label="Origin Tribe" value={tree.orgineTribe} />
              <Info label="Origin Tongue" value={tree.origineTongue} />
              <Info label="Origin Homeland" value={tree.origineHomeLand} />
            </Grid>
            {tree.familyDescription && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{tree.familyDescription}</p>
            )}
          </Section>

          <Section title="Statistics" icon={<Users color="var(--color-info)" />}>
            <Grid>
              <Info label="Members" value={tree.members?.length || 0} />
              <Info label="Root Person" value={rootName} />
              <Info label="Created By" value={creatorName || 'N/A'} />
              <Info
                label="Created At"
                value={
                  tree.createdAt
                    ? new Date(tree.createdAt.seconds * 1000).toLocaleDateString()
                    : 'N/A'
                }
              />
            </Grid>
          </Section>

          <Section title="Settings" icon={<Settings color="var(--color-warning)" />}>
            <Category
              title="Privacy"
              icon={<Lock color="var(--color-warning)" />}
              items={[
                ['Public', tree.settings?.privacy?.isPublic],
                ['Allow Merge Requests', tree.settings?.privacy?.allowMergeRequests],
                ['Global Match Opt-in', tree.settings?.privacy?.globalMatchOptIn],
              ]}
            />
            <Category
              title="Relationships"
              icon={<HeartHandshake color="var(--color-pink)" />}
              items={[
                ['Polygamy', tree.settings?.relationship?.allowPolygamy],
                ['Multiple Marriages', tree.settings?.relationship?.allowMultipleMarriages],
                ['Unknown Parents', tree.settings?.relationship?.allowUnknownParentLinking],
              ]}
            />
            <Category
              title="Display"
              icon={<Eye color="var(--color-info)" />}
              items={[
                ['Role Badges', tree.settings?.display?.showRoleBadges],
                ['Gender Icons', tree.settings?.display?.showGenderIcons],
              ]}
            />
            <Category
              title="Life Events"
              icon={<CalendarDays color="var(--color-primary)" />}
              items={[
                ['Birth', tree.settings?.lifeEvents?.birth],
                ['Death', tree.settings?.lifeEvents?.death],
                ['Marriage', tree.settings?.lifeEvents?.marriage],
                ['Divorce', tree.settings?.lifeEvents?.divorce],
              ]}
            />
          </Section>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1.5rem',
          }}
        >
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* - Helper Components - */

function Section({ title, icon, children }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border-light)',
        borderRadius: '0.75rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {icon}
        <h3 style={{ fontWeight: '600', fontSize: '1rem', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div >
      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>{label}</p>
      <p style={{ margin: 0, fontWeight: '500' }}>{value || 'N/A'}</p>
    </div>
  );
}

function Category({ title, icon, items }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        {icon}
        <h4 style={{ margin: 0, fontWeight: '500' }}>{title}</h4>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          paddingLeft: '1.75rem',
        }}
      >
        {items.map(([k, v]) => (
          <p key={k} style={{ fontSize: '0.9rem', margin: '2px 0' }}>
            {k}: <span style={{ fontWeight: '500' }}>{v ? 'Yes' : 'No'}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function Grid({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  );
}
