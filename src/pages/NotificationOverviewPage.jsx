import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import Column from "../layout/containers/Column";
import Card from "../layout/containers/Card";
import Row from "../layout/containers/Row";
import Text from "../components/Text";
import Button from "../components/Button";
import NotificationOverviewCard from "../components/NotificationOverviewCard";
import { formatArrivalTime } from "../utils/featuresUtils/formatArrivalTime";
import { Lightbulb, GitMerge, Clock as ClockIcon, Users } from "lucide-react";
import { getJoinRequestsForTree } from "../services/joinRequestService";
// import { useAuth } from "../context/AuthContext"; // Commented out as not currently used
import "../styles/NotificationCenter.css";




const NotificationOverviewPage = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { onNotificationClick } = useOutletContext();
  // const { currentUser } = useAuth(); // Commented out as not currently used
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!treeId) return;

      try {
        setLoading(true);
        const requests = await getJoinRequestsForTree(treeId);
        // Sort by createdAt descending (latest first)
        const sortedRequests = requests.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setJoinRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching join requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinRequests();
  }, [treeId]);

  return (
    <div className="overview-section">
      <Row justifyContent="space-between" alignItems="center" padding="0.5rem 1rem 0.25rem 1rem" margin="0">
        <Text as="h3" variant="h3">{t('navbar.recent_activity')}</Text>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/family-tree/${treeId}/notificationcenter/activity`)}>
          {t('navbar.view_all')}
        </Button>
      </Row>

      <div className="notification-grid">
        {loading ? (
          <Text variant="body2" color="secondary-text">Loading...</Text>
        ) : joinRequests.length === 0 ? (
          <Text variant="body2" color="secondary-text">No join requests found.</Text>
        ) : (
          joinRequests.map((request) => {
            const icon = <ClockIcon size={16} />;
            const timeLabel = formatArrivalTime({ createdAt: request.createdAt });

            return (
              <NotificationOverviewCard
                key={request.JoinRequestId}
                type="requests"
                title={`Join Request: ${request.name}`}
                description={`New join request from ${request.name}`}
                createdAt={request.createdAt}
                onClick={() => {
                  // Navigate to the requests page
                  navigate(`/family-tree/${treeId}/notificationcenter/requests`);
                  // Also open the notification in the sidebar
                  onNotificationClick({
                    id: request.JoinRequestId,
                    type: "joinRequest",
                    title: `Join Request: ${request.name}`,
                    description: `New join request from ${request.name} (${request.gender}). ${request.notes ? `Notes: ${request.notes}` : ''}`,
                    createdAt: request.createdAt,
                    icon: icon,
                    timeLabel: timeLabel,
                    details: `Join request details: ${request.name}, ${request.gender}, ${request.birthDate || 'No birth date'}, ${request.notes || 'No notes'}. Proof files: ${request.proofFiles.length}`,
                    requestData: request // Pass full request data for sidebar
                  });
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationOverviewPage; 