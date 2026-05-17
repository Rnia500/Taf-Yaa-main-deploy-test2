// src/components/sidebar/ProfileSidebarComponents/BiographySection.jsx
// Updated with AWS Translate auto-translation

import React from 'react';
import Card from '../../../layout/containers/Card';
import Text from '../../Text';
import ClampText from '../../ClampText';
import Button from '../../Button';
import Spacer from '../../Spacer';
import { SquarePen, Languages } from 'lucide-react';
import { useAutoTranslate } from '../../../hooks/useAutoTranslate';
import { useContentTranslation } from '../../../context/TranslationContext';

export default function BiographySection({ biographyText, onEdit }) {
  // Auto-translate bio when language changes
  const translatedBio = useAutoTranslate(biographyText);
  const { needsTranslation, currentLang } = useContentTranslation();

  return (
    <Card alignItems='start' margin='0px 0px 0px 0px' padding='0px' backgroundColor="var(--color-background)">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Text variant='heading3'>Biography and Story</Text>
        {needsTranslation && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#16a34a', fontWeight: 600,
          }}>
            <Languages size={12} />
            Auto-translated
          </div>
        )}
      </div>
      <Spacer size='sm' />
      <ClampText lines={10}>
        {translatedBio || 'No biography available. Click edit to add a biography.'}
      </ClampText>
      <Spacer size='sm' />
      <Button variant='primary' fullWidth={true} onClick={onEdit}>
        <SquarePen size={20} />Edit Info
      </Button>
    </Card>
  );
}
