import React from 'react';
import Card from '../../../layout/containers/Card'
import Text from '../../Text';
import Pill from '../../pill';
import Row from '../../../layout/containers/Row';

export default function RolePermissions({ roles }) {
  return (
    <>
      <Card alignItems='start' margin='0px 0px 0px 0px' padding='0px' backgroundColor="var(--color-background)" >
        <Text variant='heading3'>Role & Permissions</Text>
      </Card>
      <Row padding='0px' fitContent={true} alignItems='flex-start' justifyContent='flex-start'>
        {roles.map((role, index) => (
          <Pill key={index}><Text variant='caption1'>{role}</Text></Pill>
        ))}
      </Row>
    </>
  );
}
