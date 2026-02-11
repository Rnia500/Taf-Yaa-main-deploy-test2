import React from 'react';
import Card from '../../../layout/containers/Card'
import Text from '../../Text';
import Category from './people/category';
import RelativesCardList from './people/RelativesCardList';
import Button from '../../Button';
import Spacer from '../../Spacer';

export default function FamilyConnections({ connections }) {
  return (
    <Card alignItems='start' margin='0px 0px 0px 0px' padding='0px' backgroundColor="var(--color-background)" >
      <Text variant='heading3'>Family Connections</Text>
      <Spacer size='sm' />

      <Category title="Spouses">
        <RelativesCardList relatives={connections.spouses} />
      </Category>

      <Category title="Children">
        <RelativesCardList relatives={connections.children} />
      </Category>

      <Category title="Parents">
        <RelativesCardList relatives={connections.parents} />
      </Category>

      <Category title="Siblings">
        <RelativesCardList relatives={connections.siblings} />
      </Category>
    </Card>
  );
}
