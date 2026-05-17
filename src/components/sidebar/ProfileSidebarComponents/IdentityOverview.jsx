// src/components/sidebar/ProfileSidebarComponents/IdentityOverview.jsx
// Updated with AWS Translate auto-translation

import { React, useEffect, useState } from "react";
import Card from "../../../layout/containers/Card";
import Text from "../../Text";
import Divider from "../../Divider";
import Spacer from "../../Spacer";
import Row from "../../../layout/containers/Row";
import { authService } from "../../../services/authService";
import { Languages } from 'lucide-react';
import { useAutoTranslateFields } from '../../../hooks/useAutoTranslate';
import { useContentTranslation } from '../../../context/TranslationContext';

export default function IdentityOverview({ identity }) {
  const [UserName, getUserName] = useState("");
  const { needsTranslation } = useContentTranslation();

  // Fields to auto-translate when language switches
  const translatable = useAutoTranslateFields({
    tribe:             identity?.tribe            || '',
    language:          identity?.language         || '',
    nationality:       identity?.nationality      || '',
    countryOfResidence:identity?.countryOfResidence || '',
    placeOfBirth:      identity?.placeOfBirth     || '',
    placeOfDeath:      identity?.placeOfDeath     || '',
    status:            identity?.status           || '',
    gender:            identity?.gender           || '',
  });

  useEffect(() => {
    if (identity?.linkedAccount) fetchUserName();
  }, [identity?.linkedAccount]);

  async function fetchUserName() {
    try {
      const user = await authService.getUserById(identity.linkedAccount);
      getUserName(user?.displayName || "Unknown");
    } catch (error) {
      console.error("Error fetching user name:", error);
      getUserName("Unknown");
    }
  }

  return (
    <Card alignItems="start" margin="0px" padding="0px" backgroundColor="var(--color-background)">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
        <Text align="left" variant="heading3">Identity Overview</Text>
        {needsTranslation && (
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#16a34a', fontWeight:600 }}>
            <Languages size={12} /> Auto-translated
          </div>
        )}
      </div>
      <Spacer size="md" />
      <Divider color="var(--color-gray)" thickness="2px" borderRadius="3px" />

      {/* Gender + Tribe */}
      <Row padding="0px">
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text align="top" variant="caption1" color="tertiary-text">Gender</Text>
          <Text variant="caption1" color="secondary">{translatable.gender}</Text>
        </Card>
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text align="top" variant="caption1" color="tertiary-text">Tribe</Text>
          <Text variant="caption1" color="secondary">{translatable.tribe}</Text>
        </Card>
      </Row>

      <Divider color="var(--color-gray)" thickness="2px" borderRadius="3px" style={{ margin: "15px 0" }} />

      {/* Language + Status */}
      <Row padding="0px">
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Language</Text>
          <Text variant="caption1" color="secondary">{translatable.language}</Text>
        </Card>
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Status</Text>
          <Text variant="caption1" color="secondary">{translatable.status}</Text>
        </Card>
      </Row>

      <Divider color="var(--color-gray)" thickness="2px" borderRadius="3px" style={{ margin: "15px 0" }} />

      {/* Nationality + Country */}
      <Row padding="0px">
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Nationality</Text>
          <Text variant="caption1" color="secondary">{translatable.nationality}</Text>
        </Card>
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Country of Residence</Text>
          <Text variant="caption1" color="secondary">{translatable.countryOfResidence}</Text>
        </Card>
      </Row>

      <Divider color="var(--color-gray)" thickness="2px" borderRadius="3px" style={{ margin: "15px 0" }} />

      {/* Role + Linked Account */}
      <Row padding="0px">
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Role</Text>
          <Text variant="caption1" color="secondary">
            {identity.role ? identity.role : (identity.linkedUserId ? 'Member' : 'Not Linked')}
          </Text>
        </Card>
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Linked Account</Text>
          <Text variant="caption1" color="secondary">
            {identity.linkedUserId ? UserName : 'Not linked'}
          </Text>
        </Card>
      </Row>

      <Divider color="var(--color-gray)" thickness="2px" borderRadius="3px" style={{ margin: "15px 0" }} />

      {/* Place of Birth + Death */}
      <Row padding="0px">
        <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
          <Text variant="caption1" color="tertiary-text">Place of birth</Text>
          <Text variant="caption1" color="secondary">{translatable.placeOfBirth}</Text>
        </Card>
        {identity.placeOfDeath && (
          <Card alignItems="start" padding="0px" margin="0px" backgroundColor="var(--color-transparent)">
            <Text variant="caption1" color="tertiary-text">Place of death</Text>
            <Text variant="caption1" color="secondary">{translatable.placeOfDeath}</Text>
          </Card>
        )}
      </Row>
    </Card>
  );
}
