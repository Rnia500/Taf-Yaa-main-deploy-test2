import React from 'react';
import Card from '../../../layout/containers/Card'
import Text from '../../Text';
import ClampText from '../../ClampText';
import Button from '../../Button';
import Spacer from '../../Spacer';
import { SquarePen } from 'lucide-react';

export default function BiographySection({ biographyText, onEdit }) {
  return (
    <Card alignItems='start' margin='0px 0px 0px 0px' padding='0px' backgroundColor="var(--color-background)" >
      <Text variant='heading3'>Biography and Story</Text>
      <Spacer size='sm' />

      <Spacer size='sm' />
      <ClampText lines={10}>
        {biographyText || 'No biography available. Click edit to add a biography.'}
      </ClampText>
      <Spacer size='sm' />
      <Button variant='primary' fullWidth={true} onClick={onEdit} ><SquarePen size={20} />Edit Info</Button>
    </Card>
  );
}
