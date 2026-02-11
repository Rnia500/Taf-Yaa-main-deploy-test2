import React, { useState, useEffect } from "react";
import { Clock, User } from "lucide-react";
import Card from "../layout/containers/Card";
import Text from "./Text";
import Pill from "./pill";
import { formatArrivalTime } from '../utils/featuresUtils/formatArrivalTime';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const JoinRequestCard = ({ request, onClick }) => {
  const [inviteType, setInviteType] = useState(null);

  useEffect(() => {
    const fetchInviteType = async () => {
      if (request?.inviteId) {
        try {
          const inviteRef = doc(db, 'invites', request.inviteId);
          const inviteDoc = await getDoc(inviteRef);
          if (inviteDoc.exists) {
            const inviteData = inviteDoc.data();
            setInviteType(inviteData.type);
          }
        } catch (error) {
          console.error('Error fetching invite type:', error);
        }
      }
    };

    fetchInviteType();
  }, [request?.inviteId]);

  // Determine request type based on the invite type
  const getRequestType = () => {
    if (inviteType === "targeted") {
      return "Targeted";
    } else if (inviteType === "nontargeted") {
      return "Non-targeted";
    } else if
    (inviteType === "grant") {
      return "Grant";
    } else {
      return "Unknown";
    }
  };

  return (
    <Card
      padding="0.75rem"
      alignItems="flex-start"
      backgroundColor="var(--color-white)"
      shadow
      positionType="relative"
      borderRadius="12px"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(request)}
    >
      
      <Card fitContent positionType="absolute" margin="-5px 0px 0px -5px" backgroundColor="var(--color-transparent)" position="top-left">
        <Pill backgroundColor={
          request?.status === 'pending' ? 'var(--color-warning-light)' :
          request?.status === 'rejected' ? 'var(--color-danger-light)' :
          request?.status === 'approved' ? 'var(--color-success-light)' :
          'var(--color-gray-light)'
        }>
          <Text as="p" color="dark" bold style={{fontSize: "0.5rem"}}>{request?.status || "unknown"}</Text>
        </Pill>
      </Card>
      <Card fitContent positionType="absolute" margin="-5px -5px 0px 0px" backgroundColor="var(--color-transparent)" position="top-right">
          <Pill backgroundColor="var(--color-info-light)">
            <Text as="p" color="dark" style={{fontSize: "0.5rem"}}>{getRequestType()}</Text>
          </Pill>
      </Card>

      {/* Header */}
      <div className="flex items-center gap-2">
        {/* User Icon */}
        <div className="flex-shrink-0">
          <Card rounded fitContent size={28} backgroundColor="var(--color-gray)">
            <User size={14} />
          </Card>
        </div>

        {/* User Info */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex w-60 items-center gap-1">
              <Text as="p"  variant="body2" ellipsis bold>
                {request?.name || "Unknown User"}
              </Text>

            </div>
            <div className="w-60">
              <Text as="p" ellipsis variant="caption2" color="gray">
              {request?.notes || "Wants to join as family member"}
            </Text>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Info */}
        <Card fitContent positionType="absolute" margin="0px px -5px -5px" backgroundColor="var(--color-transparent)" position="bottom-right">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-neutral-500 dark:text-neutral-400" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatArrivalTime({ createdAt: request?.createdAt })}
            </p>
          </div>
        </Card>
    
    </Card>
  );
};

export default JoinRequestCard;
