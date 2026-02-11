import React from 'react';
import Card from '../../../layout/containers/Card'
import Text from '../../Text';
import Divider from '../../Divider';
import Spacer from '../../Spacer';
import Row from '../../../layout/containers/Row';

export default function ContactMetaInfo({ contact }) {
  return (
    <Card alignItems='start' margin='0px 0px 0px 0px' padding='0px' backgroundColor="var(--color-background)" >
      <Text align='left' variant='heading3' >Contact & Meta Info</Text>
      <Spacer size='md' />
      <Divider color="var(--color-gray)" thickness='2px' borderRadius='3px' />
      <Row padding='0px' maxWidth='100%' style={{ overflow: 'hidden' }}>
        <Card alignItems='start' padding='0px' margin='0px 0px' backgroundColor='var(--color-transparent)'>
          <Text align='top' variant='caption1' color='tertiary-text'>Phone number</Text>
          <Text variant='caption1' color='secondary'>{contact.phoneNumber}</Text>
        </Card>
        <Card  alignItems='start' padding='0px' margin='0px 0px' backgroundColor='var(--color-transparent)' maxWidth='100%'>
          <Text align='flex-left' variant='caption1' color='tertiary-text'>Email</Text>
          <Text variant='caption1' color='secondary' ellipsis>{contact.email}</Text>
        </Card>
      </Row>
      <Divider color="var(--color-gray)" thickness='2px' borderRadius='3px' style={{ margin: '15px 0' }} />
      <Row padding='0px'>
        <Card alignItems='start' padding='0px' margin='0px 0px' backgroundColor='var(--color-transparent)'>
          <Text align='flex-left' variant='caption1' color='tertiary-text'>Privacy status</Text>
          <Text variant='caption1' color='secondary'>{contact.privacyStatus}</Text>
        </Card>
      </Row>
    </Card>
  );
}
