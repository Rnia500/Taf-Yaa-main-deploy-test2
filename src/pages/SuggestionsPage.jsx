﻿import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import SuggestionCard from "../components/SuggestionCard";
import "../styles/SuggestionsPages.css";
import { TreeProvider } from "../context/TreeContext.jsx";
import {
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle,
  Star,
  Clock,
  Lightbulb,
} from "lucide-react";

// Import your components
import Text from "../components/Text";
import Button from "../components/Button";
import Card from "../layout/containers/Card";
import Row from "../layout/containers/Row";
import Column from "../layout/containers/Column";
import Grid from "../layout/containers/Grid";
import SelectDropdown from "../components/SelectDropdown";
import Slider from "../components/Slider";


import NavigationSideBar from "../components/NavigationSideBar/NavigationSideBar";
import { useTranslation } from "react-i18next";

//  Demo data (UI-only) 
const INITIAL_SUGGESTIONS = [
  {
    id: "s1",
    name1: "John Smith",
    name2: "Robert Johnson",
    relation: "Potential fatherson based on birth records and commonAncestor analysis",
    commonAncestor: "Zef Hamid",
    sender:"Guy Crimson",
    birth: "1945  1970",
    location: "New York",
      date: "20 aug 2021",
    score: 95, // %
  },
  {
    id: "s2",
    name1: "Mary Davis",
    name2: "Susan Wilson",
    relation: "Potential sisters based on shared parents and birth record",
    commonAncestor: "Ganpy boom",
    sender:"Milin Nava",
    birth: "1952  1955",
    location: "California",
    score: 87,
    date: "19 feb 2020",
  },
  {
    id: "s3",
    name1: "William Brown",
    name2: "James Miller",
    relation: "Potential cousins based on shared grandparents",
    commonAncestor: "nkamny weep",
    sender:"Vlad Valentina",
    birth: "1960  1962",
    location: "Texas",
    date: "12 jan 2020",
    score: 25,
  },
];

const SuggestionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { treeId } = useParams();
  const { t } = useTranslation();

  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [acceptedToday, setAcceptedToday] = useState(3); // demo counter
  const [filterOpen, setFilterOpen] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [relType, setRelType] = useState("all");
  const [ordOpt, setOrdOpt] = useState("all");

  const filtered = useMemo(() => {
    let list = [...suggestions];
    list = list.filter((s) => s.score >= minScore);
    if (relType !== "all") {
      const k = relType.toLowerCase();
      list = list.filter((s) => s.relation.toLowerCase().includes(k));
    }
    return list;
  }, [suggestions, minScore, relType]);

  const highConfidenceCount = useMemo(
    () => filtered.filter((s) => s.score >= 85).length,
    [filtered]
  );

  function onAccept(id) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    setAcceptedToday((n) => n + 1);
  }

  function onReject(id) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }

  function refresh() {
    // lightweight visual refresh (shuffle)
    setSuggestions((prev) => [...prev].sort(() => Math.random() - 0.5));
  }

  const relationOptions = [
    { value: "all", label: "All" },
    { value: "father", label: "Father" },
    { value: "sister", label: "Sister" },
    { value: "cousin", label: "Cousin" }
  ];

  const orderOptions = [
    { value: "all", label: "All" },
    { value: "latest", label: "Latest" },
    { value: "oldest", label: "Oldest" },
  ];



  return (
    <TreeProvider treeId={treeId}>
      <div className="suggestions-page">
      {/* Main Content */}
      <Column padding="0px" margin="0px" gap="18px" style={{ flex: 1 }}>
        {/* Header Section */}
        <Row padding="0px" margin="0px" justifyContent="space-between" fitContent alignItems="center">
          <Column padding="0px" margin="0px" gap="4px">
            <Text variant="heading1" as="h1">{t('navbar.ai_match_suggestions')}</Text>
            <Text variant="body2" color="secondary-text">
              {t('navbar.review_potential_connections')}
            </Text>
          </Column>

          <Row padding="0px" margin="0px" fitContent gap="10px">
            <Button
              variant="primary"
              onClick={() => setFilterOpen((v) => !v)}
              icon={<Filter size={16} />}
            >
              {t('navbar.filter')}
            </Button>
            <Button
              variant="primary"
              onClick={refresh}
              icon={<RefreshCw size={16} />}
            >
              {t('navbar.refresh')}
            </Button>
          </Row>
        </Row>

        {/* Stats Cards */}
        <Grid columns={4} gap="14px">

          <StatCards title={t('navbar.pending_suggestions')} value={filtered.length} icon={<Clock size={18} color="var(--color-gray)" />} />

          <StatCards title={t('navbar.high_confidence')} value={highConfidenceCount} icon={<Star size={18} color="var(--color-gray)" />} />

          <StatCards title={t('navbar.this_week')} value={8} icon={<Calendar size={18} color="var(--color-gray)" />} />

          <StatCards title={t('navbar.approved_today')} value={acceptedToday} icon={<CheckCircle size={18} color="var(--color-gray)" />} />

        </Grid>

        {/* Filter Panel */}
        {filterOpen && (
          <Card padding="12px" backgroundColor="var(--color-white)" borderColor="var(--color-gray)">
            <Grid columns={3} gap="0.5rem">

              <Column padding="0px" margin="0px" width="300px" gap="6px">
                <Text variant="body2" bold>{t('navbar.order')}</Text>
                <SelectDropdown
                  value={ordOpt}
                  onChange={(e) => setOrdOpt(e.target.value)}
                  options={orderOptions}
                  placeholder={t('navbar.select_order')}
                />
              </Column>

              <Column padding="0px" margin="0px" fitContent gap="0.25rem">
                <Text variant="body2" bold>{t('navbar.min_score')}</Text>
                <Slider
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={setMinScore}
                />
              </Column>


              <Column padding="0px" margin="0px" width="300px" gap="6px">
                <Text variant="body2" bold>{t('navbar.relation_type')}</Text>
                <SelectDropdown
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  options={relationOptions}
                  placeholder={t('navbar.select_relationship_type')}
                />
              </Column>
            </Grid>
          </Card>
        )}

        {/* Suggestion Cards */}
        <Column padding="0px" margin="0px" gap="14px">
          {filtered.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => onAccept(s.id)}
              onReject={() => onReject(s.id)}
            />
          ))}

          {filtered.length === 0 && (
            <Card
              padding="30px"
              backgroundColor="var(--color-white)"
              borderColor="var(--color-gray)"
              style={{ borderStyle: "dashed", textAlign: "center" }}
            >
              <Text color="secondary-text">{t('navbar.no_suggestions_match')}</Text>
            </Card>
          )}
        </Column>
      </Column>
    </div>
    </TreeProvider>
  );
};

export default SuggestionsPage


const StatCards = ({ title, icon, value }) => {

  return (
    <Card padding="0.5rem" backgroundColor="var(--color-white)" borderColor="var(--color-gray)">
      <Row fitContent padding="0px" margin="0px" justifyContent="space-between" alignItems="flex-start">
        <Column padding="0px" margin="0px" gap="2px">
          <Text as="p" variant="caption" color="secondary-text">{title}</Text>
          <Text variant="heading3" bold>{value}</Text>
        </Column>
        <Card backgroundColor="var(--color-transarent)" borderColor="var(--color-transparent)" fitContent margin="2px 0px 0px 0px" padding="0px">{icon}</Card>
      </Row>
    </Card>
  )
}