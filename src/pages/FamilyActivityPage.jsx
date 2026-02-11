import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { History, Search, Filter, Download } from "lucide-react";
import Column from "../layout/containers/Column";
import Row from "../layout/containers/Row";
import Text from "../components/Text";
import {SearchInput} from "../components/Input";
import SelectDropdown from "../components/SelectDropdown";
import Loading from "../components/Loading";
import ActivityCard from "../components/ActivityCard";
import Grid from "../layout/containers/Grid";
import Button from "../components/Button";
import dataService from "../services/dataService";
import { useUserRole } from "../hooks/useUserRole";
import ExportActivityModal from "../components/modals/ExportActivityModal";
import "../styles/NotificationCenter.css";

const FamilyActivityPage = () => {
  const { treeId } = useParams();
  const { t } = useTranslation();
  const { isAdmin } = useUserRole(treeId);

  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Activity type options for filter
  const activityTypeOptions = [
    { value: "all", label: t("activity.all_types") || "All Types" },
    { value: "person_added", label: t("activity.person_added") || "Person Added" },
    { value: "person_edited", label: t("activity.person_edited") || "Person Edited" },
    { value: "person_deleted", label: t("activity.person_deleted") || "Person Deleted" },
    { value: "story_added", label: t("activity.story_added") || "Story Added" },
    { value: "story_edited", label: t("activity.story_edited") || "Story Edited" },
    { value: "story_deleted", label: t("activity.story_deleted") || "Story Deleted" },
    { value: "attachment_added", label: t("activity.attachment_added") || "Attachment Added" },
    { value: "role_changed", label: t("activity.role_changed") || "Role Changed" },
    { value: "tree_settings_edited", label: t("activity.tree_settings_edited") || "Settings Edited" },
  ];

  // Load initial activities
  const loadActivities = useCallback(async (loadMore = false) => {
    if (!treeId) return;

    try {
      setLoading(true);
      const result = await dataService.activityService.getActivities(
        treeId,
        50,
        loadMore ? lastDoc : null
      );

      if (loadMore) {
        setActivities(prev => [...prev, ...result.activities]);
      } else {
        setActivities(result.activities);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [treeId, lastDoc]);

  // Filter activities based on search and type
  useEffect(() => {
    let filtered = activities;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(activity => activity.activityType === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity => {
        const userName = activity.userName?.toLowerCase() || "";
        return userName.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, filterType]);

  // Real-time updates setup
  useEffect(() => {
    if (!treeId || !realTimeEnabled) return;

    console.log('Setting up real-time activity updates for tree:', treeId);
    const unsubscribe = dataService.activityService.subscribeToActivities(treeId, (newActivities) => {
      console.log('Received real-time activities update:', newActivities.length, 'activities');
      setActivities(newActivities);
    });

    return () => {
      console.log('Cleaning up real-time activity subscription');
      unsubscribe();
    };
  }, [treeId, realTimeEnabled]);

  // Initial load
  useEffect(() => {
    loadActivities();
    // Enable real-time updates after initial load
    setRealTimeEnabled(true);
  }, [loadActivities]);





  // Check admin access
  if (!isAdmin) {
    return (
      <div className="activity-page">
        <Column padding="2rem" gap="1rem" alignItems="center">
          <History size={48} color="var(--color-secondary-text)" />
          <Text variant="h3" color="secondary-text">
            {t("activity.admin_only") || "Admin Access Required"}
          </Text>
          <Text variant="body1" color="secondary-text" textAlign="center">
            {t("activity.admin_only_desc") || "Only administrators can view the family activity log."}
          </Text>
        </Column>
      </div>
    );
  }

  return (
    <>
      <div className="activity-page">
        <Row justifyContent="space-between" fitContent alignItems="center" padding="0.5rem 1rem 0.25rem 1rem" margin="0">
          <Text as="h3" variant="h3">{t("navbar.family_activity")}</Text>
          <Button
            variant="primary"
            onClick={() => setIsExportModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Export
          </Button>
        </Row>

        {/* Filters */}
        <Row gap="1rem" justifyContent="space-between" fitContent padding="1rem" alignItems="center">
          <div style={{ flex: 1 }}>
            <SearchInput
              placeholder={t("activity.search_placeholder") || "Search activities..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <SelectDropdown
            options={activityTypeOptions}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            placeholder={t("activity.filter_by_type") || "Filter by type"}
            style={{ minWidth: '200px' }}
          />
        </Row>

        {/* Activity List */}
        <div className="activity-list" style={{ padding: '0 1rem 1rem 1rem' }}>
          {loading && activities.length === 0 ? (
            <Loading variant="spinner" size="lg" message={t("activity.loading") || "Loading activities..."} />
          ) : filteredActivities.length === 0 ? (
            <Column padding="2rem" gap="1rem" alignItems="center">
              <History size={48} color="var(--color-secondary-text)" />
              <Text variant="h3" color="secondary-text">
                {t("activity.no_activities") || "No Activities Found"}
              </Text>
              <Text variant="body1" color="secondary-text" textAlign="center">
                {searchTerm || filterType !== "all"
                  ? t("activity.no_filtered_activities") || "No activities match your filters."
                  : t("activity.no_activities_desc") || "Activities will appear here as family members interact with the tree."
                }
              </Text>
            </Column>
          ) : (
            <>
              <Grid
                responsive={true}
                minWidth={280}
                gap="0.5rem"
                style={{ marginBottom: '1rem' }}
              >
                {filteredActivities.map((activity, index) => (
                  <ActivityCard key={activity.id} activity={activity} index={index + 1} />
                ))}
              </Grid>

              {/* Load More Button */}
              {hasMore && (
                <Row justifyContent="center" padding="1rem">
                  <Button
                    variant="secondary"
                    onClick={() => loadActivities(true)}
                    disabled={loading}
                  >
                    {loading ? t("activity.loading_more") || "Loading..." : t("activity.load_more") || "Load More"}
                  </Button>
                </Row>
              )}
            </>
          )}
        </div>
      </div>

      <ExportActivityModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activities={activities}
        filteredActivities={filteredActivities}
        hasMore={hasMore}
        treeId={treeId}
        _searchTerm={searchTerm}
        _filterType={filterType}
      />
    </>
  );
};

export default FamilyActivityPage;
