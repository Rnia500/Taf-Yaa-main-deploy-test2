import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dataService from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import PageFrame from '../layout/containers/PageFrame';
import MyTreeNavBar from '../components/navbar/MyTreeNavBar';
import TreeCard from '../components/TreeCard';
import Pagination from '../components/Pagination';
import LottieLoader from '../components/LottieLoader';
import { SearchInput } from '../components/Input';
import SelectDropdown from '../components/SelectDropdown';
import Text from '../components/Text';
import Button from '../components/Button';
import { Compass, Globe2, MapPin, Bookmark, Users, Sparkles, BookOpen, Clock } from 'lucide-react';

const PAGE_SIZE = 9;
const MEDALLION_LIMIT = 10;
const SAVED_TREES_KEY = 'tafyaa_saved_trees';
const FEATURED_STORY_TREE_SAMPLE = 6;
const FEATURED_STORY_LIMIT = 4;

const sortOptions = [
  { value: 'newest', label: 'Newest trees' },
  { value: 'oldest', label: 'Oldest trees' },
  { value: 'az', label: 'Family name A–Z' },
];

// The Tree model fills these in with placeholder text when a family hasn't
// set them, so we hide the placeholder rather than display it as if real.
const PLACEHOLDER_TRIBE = 'No tribe given';
const PLACEHOLDER_HOMELAND = 'No homeland given';
const isMeaningful = (value, placeholder) => Boolean(value) && value !== placeholder;

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function timeAgo(isoString) {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (Number.isNaN(diffMs)) return null;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function loadSavedTreeIds() {
  try {
    const raw = window.localStorage.getItem(SAVED_TREES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// Fades + lifts content into place the first time it scrolls into view.
// With reduced motion, content is just shown immediately.
function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [trees, setTrees] = useState([]);
  const [myTrees, setMyTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [rootNames, setRootNames] = useState({});
  const [peopleCounts, setPeopleCounts] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tribeFilter, setTribeFilter] = useState(null);
  const [homelandFilter, setHomelandFilter] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedTreeIds, setSavedTreeIds] = useState(() => loadSavedTreeIds());
  const [featuredStories, setFeaturedStories] = useState([]);

  // Public trees only. We deliberately don't reuse SearchTreesPage's filter
  // (`tree.isPublic`) since that field doesn't exist on the Tree model —
  // visibility actually lives at tree.settings.privacy.isPublic.
  useEffect(() => {
    const fetchPublicTrees = async () => {
      try {
        setLoading(true);
        const allTrees = await dataService.getAllTrees();
        const publicTrees = allTrees.filter(
          (tree) => !tree.deletedAt && tree.settings?.privacy?.isPublic === true
        );
        setTrees(publicTrees);
      } catch (error) {
        console.error('Failed to fetch public trees:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicTrees();
  }, []);

  // The viewer's own trees — used only for the "possible relatives" matching
  // below. Failing quietly here just means that section doesn't render.
  useEffect(() => {
    if (!currentUser) return;
    dataService
      .getTreesByUserId(currentUser.uid)
      .then(setMyTrees)
      .catch((error) => console.error('Failed to fetch your trees for matching:', error));
  }, [currentUser]);

  // Sample a handful of public trees for a "Featured Stories" strip. Capped
  // and tree-scoped so it never turns into an expensive cross-tree query.
  useEffect(() => {
    if (trees.length === 0) return;

    const sample = [...trees]
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, FEATURED_STORY_TREE_SAMPLE);

    const fetchFeaturedStories = async () => {
      const results = await Promise.all(
        sample.map(async (tree) => {
          try {
            const stories = await dataService.getStoriesByTreeId(tree.id);
            return stories
              .filter((s) => s.visibility === 'public' && !s.deletedAt)
              .map((s) => ({ ...s, _treeName: tree.familyName }));
          } catch {
            return [];
          }
        })
      );
      setFeaturedStories(results.flat().slice(0, FEATURED_STORY_LIMIT));
    };

    fetchFeaturedStories();
  }, [trees]);

  const toggleSaved = (treeId) => {
    setSavedTreeIds((prev) => {
      const next = new Set(prev);
      if (next.has(treeId)) next.delete(treeId);
      else next.add(treeId);
      try {
        window.localStorage.setItem(SAVED_TREES_KEY, JSON.stringify([...next]));
      } catch {
        // localStorage unavailable (private browsing etc.) — saving just won't persist
      }
      return next;
    });
  };

  // Trees the viewer is matched against — same family name, tribe, or
  // homeland as one of the viewer's own opted-in trees. Both sides need
  // globalMatchOptIn for a pairing to count, same opt-in model Ancestry/
  // FamilySearch use for "potential matches."
  const possibleRelatives = useMemo(() => {
    if (!currentUser || myTrees.length === 0) return [];

    const myOptedInTrees = myTrees.filter((t) => t.settings?.privacy?.globalMatchOptIn === true);
    if (myOptedInTrees.length === 0) return [];

    const matches = [];
    for (const tree of trees) {
      if (tree.settings?.privacy?.globalMatchOptIn !== true) continue;
      if (tree.members?.some((m) => m.userId === currentUser.uid)) continue; // already theirs

      for (const mine of myOptedInTrees) {
        const reasons = [];
        if (mine.familyName && tree.familyName && mine.familyName.toLowerCase() === tree.familyName.toLowerCase()) {
          reasons.push('Same family name');
        }
        if (
          isMeaningful(mine.orgineTribe, PLACEHOLDER_TRIBE) &&
          mine.orgineTribe === tree.orgineTribe
        ) {
          reasons.push(`Same tribe: ${tree.orgineTribe}`);
        }
        if (
          isMeaningful(mine.origineHomeLand, PLACEHOLDER_HOMELAND) &&
          mine.origineHomeLand === tree.origineHomeLand
        ) {
          reasons.push(`Same homeland: ${tree.origineHomeLand}`);
        }
        if (reasons.length > 0) {
          matches.push({ tree, reasons });
          break; // one match entry per public tree is enough
        }
      }
    }

    return matches.sort((a, b) => b.reasons.length - a.reasons.length).slice(0, 6);
  }, [trees, myTrees, currentUser]);

  const featuredTrees = useMemo(() => trees.filter((t) => t.featured === true), [trees]);

  // Most frequent tribes/homelands, used as filter chips. Skipped entirely
  // when there's nothing meaningful to filter by.
  const { topTribes, topHomelands } = useMemo(() => {
    const tribeCounts = {};
    const homelandCounts = {};
    trees.forEach((t) => {
      if (isMeaningful(t.orgineTribe, PLACEHOLDER_TRIBE)) {
        tribeCounts[t.orgineTribe] = (tribeCounts[t.orgineTribe] || 0) + 1;
      }
      if (isMeaningful(t.origineHomeLand, PLACEHOLDER_HOMELAND)) {
        homelandCounts[t.origineHomeLand] = (homelandCounts[t.origineHomeLand] || 0) + 1;
      }
    });
    const sortByCount = (counts) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value]) => value);
    return { topTribes: sortByCount(tribeCounts), topHomelands: sortByCount(homelandCounts) };
  }, [trees]);

  const filteredTrees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = trees;

    if (term) {
      result = result.filter((tree) =>
        [tree.familyName, tree.familyDescription, tree.orgineTribe, tree.origineHomeLand]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
      );
    }
    if (tribeFilter) {
      result = result.filter((tree) => tree.orgineTribe === tribeFilter);
    }
    if (homelandFilter) {
      result = result.filter((tree) => tree.origineHomeLand === homelandFilter);
    }
    if (showSavedOnly) {
      result = result.filter((tree) => savedTreeIds.has(tree.id));
    }

    const sorted = [...result];
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'az') {
      sorted.sort((a, b) => a.familyName.localeCompare(b.familyName));
    }
    return sorted;
  }, [trees, searchTerm, sortBy, tribeFilter, homelandFilter, showSavedOnly, savedTreeIds]);

  const totalPages = Math.ceil(filteredTrees.length / PAGE_SIZE) || 1;
  const paginatedTrees = filteredTrees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const paginatedIds = paginatedTrees.map((t) => t.id).join(',');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, tribeFilter, homelandFilter, showSavedOnly]);

  // Only fetch root-person name + member count for the trees actually visible
  // on the current page, so Discover stays fast regardless of how many public
  // trees exist platform-wide.
  useEffect(() => {
    if (paginatedTrees.length === 0) return;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      const names = {};
      const counts = {};

      await Promise.all(
        paginatedTrees.map(async (tree) => {
          try {
            if (tree.currentRootId) {
              const person = await dataService.getPerson(tree.currentRootId);
              names[tree.id] = person ? person.name : 'Unknown';
            } else {
              names[tree.id] = 'No root yet';
            }
          } catch {
            names[tree.id] = 'Unknown';
          }

          try {
            const people = await dataService.getPeopleByTreeId(tree.id);
            counts[tree.id] = people.length;
          } catch {
            counts[tree.id] = 0;
          }
        })
      );

      setRootNames((prev) => ({ ...prev, ...names }));
      setPeopleCounts((prev) => ({ ...prev, ...counts }));
      setDetailsLoading(false);
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedIds]);

  // Real, already-in-memory stats — no extra Firestore reads.
  const stats = useMemo(() => {
    const tribes = new Set(
      trees.filter((t) => isMeaningful(t.orgineTribe, PLACEHOLDER_TRIBE)).map((t) => t.orgineTribe)
    );
    const homelands = new Set(
      trees
        .filter((t) => isMeaningful(t.origineHomeLand, PLACEHOLDER_HOMELAND))
        .map((t) => t.origineHomeLand)
    );
    return { treeCount: trees.length, tribeCount: tribes.size, homelandCount: homelands.size };
  }, [trees]);

  const medallionPhotos = useMemo(
    () => trees.filter((t) => t.familyPhoto).slice(0, MEDALLION_LIMIT),
    [trees]
  );

  const handleTreeClick = (treeId) => navigate(`/public-tree/${treeId}`);

  if (loading) {
    return (
      <PageFrame topbar={<MyTreeNavBar />}>
        <div className="flex flex-col items-center justify-center" style={{ height: '70vh' }}>
          <div style={{ width: 220, maxWidth: '60vw' }}>
            <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
          </div>
          <div style={{ marginTop: 12, color: 'var(--color-secondary-text)', fontSize: 14 }}>
            Finding public family trees...
          </div>
        </div>
      </PageFrame>
    );
  }

  const chipStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: `1.5px solid ${active ? '#1F724A' : '#D8CDB8'}`,
    backgroundColor: active ? '#1F724A' : 'transparent',
    color: active ? '#FFFFFF' : '#5C4A33',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <PageFrame topbar={<MyTreeNavBar />}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

        .discover-display { font-family: 'Fraunces', Georgia, serif; }

        .discover-branch-row {
          display: flex;
          overflow-x: auto;
          gap: 28px;
          padding: 28px 8px 18px;
          scrollbar-width: none;
          background-repeat: repeat-x;
          background-position: center 50%;
          background-size: 160px 56px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='56' viewBox='0 0 160 56'%3E%3Cpath d='M0,28 Q40,2 80,28 T160,28' fill='none' stroke='%238B5E3C' stroke-width='2.5' stroke-linecap='round' opacity='0.35'/%3E%3C/svg%3E");
        }
        .discover-branch-row::-webkit-scrollbar { display: none; }
        .discover-scroll-strip {
          display: flex;
          overflow-x: auto;
          gap: 18px;
          scrollbar-width: none;
          padding: 4px 2px 14px;
        }
        .discover-scroll-strip::-webkit-scrollbar { display: none; }

        .discover-medallion {
          flex-shrink: 0;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #F3EDE0;
          box-shadow: 0 0 0 2px #C9731E, 0 6px 14px rgba(139, 94, 60, 0.25);
          animation: discover-bob 5s ease-in-out infinite;
        }
        .discover-medallion:nth-child(odd) { transform: translateY(10px); animation-delay: -1.5s; }
        .discover-medallion:nth-child(even) { transform: translateY(-6px); }

        @keyframes discover-bob {
          0%, 100% { margin-top: 0px; }
          50% { margin-top: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .discover-medallion { animation: none; }
        }

        .discover-divider {
          height: 14px;
          background-image: repeating-linear-gradient(
            -45deg,
            #C9731E 0px, #C9731E 8px,
            transparent 8px, transparent 16px
          );
          opacity: 0.3;
          border-radius: 8px;
        }

        .discover-bookmark-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      `}</style>

      <div className="w-full" style={{ backgroundColor: '#F3EDE0', minHeight: '100%' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-14">

          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <Compass size={16} color="#1F724A" />
              <span
                style={{
                  color: '#1F724A',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                Discover
              </span>
            </div>

            <h1
              className="discover-display"
              style={{
                color: '#1F2A1F',
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 600,
                lineHeight: 1.12,
                maxWidth: '40rem',
              }}
            >
              Every family has roots.
              <br />
              Come see where they lead.
            </h1>

            {medallionPhotos.length > 0 && (
              <div className="discover-branch-row w-full" style={{ maxWidth: 720 }} aria-hidden="true">
                {medallionPhotos.map((tree, i) => (
                  <img
                    key={tree.id}
                    src={tree.familyPhoto}
                    alt=""
                    className="discover-medallion"
                    style={{ animationDelay: `${(i % 5) * -0.6}s` }}
                  />
                ))}
              </div>
            )}

            <p style={{ color: 'var(--color-secondary-text)', fontSize: '1.05rem', maxWidth: '34rem', margin: '8px 0 28px' }}>
              Browse family trees that members have chosen to share publicly — explore
              who's related to whom, and the stories passed down between them.
            </p>

            <div style={{ width: '100%', maxWidth: 420 }}>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by family name, tribe, or homeland"
                backgroundColor="var(--color-white)"
                size="md"
              />
            </div>

            {stats.treeCount > 0 && (
              <div
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-6"
                style={{ color: '#8B5E3C', fontSize: '0.9rem', fontWeight: 600 }}
              >
                <span>{stats.treeCount} public {stats.treeCount === 1 ? 'tree' : 'trees'}</span>
                {stats.tribeCount > 0 && (
                  <span>{stats.tribeCount} {stats.tribeCount === 1 ? 'tribe' : 'tribes'} represented</span>
                )}
                {stats.homelandCount > 0 && (
                  <span>{stats.homelandCount} {stats.homelandCount === 1 ? 'homeland' : 'homelands'}</span>
                )}
              </div>
            )}
          </div>

          {/* Possible relatives */}
          {possibleRelatives.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} color="#1F724A" />
                <Text variant="heading3" className="discover-display" style={{ display: 'block' }}>
                  You might be related
                </Text>
              </div>
              <Text variant="body2" style={{ color: 'var(--color-secondary-text)', display: 'block', marginBottom: 12 }}>
                These public trees share a family name, tribe, or homeland with one of your own trees.
              </Text>
              <div className="discover-scroll-strip">
                {possibleRelatives.map(({ tree, reasons }) => (
                  <div
                    key={tree.id}
                    onClick={() => handleTreeClick(tree.id)}
                    role="button"
                    tabIndex={0}
                    className="flex-shrink-0"
                    style={{
                      width: 230,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 14,
                      cursor: 'pointer',
                      border: '1px solid #EADFC8',
                      boxShadow: '0 2px 8px rgba(139,94,60,0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {tree.familyPhoto ? (
                        <img src={tree.familyPhoto} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#E7DCC4' }} />
                      )}
                      <Text variant="body1" style={{ fontWeight: 700 }}>{tree.familyName}</Text>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reasons.map((reason) => (
                        <span
                          key={reason}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#1F724A',
                            backgroundColor: '#E4F0E9',
                            borderRadius: 999,
                            padding: '2px 8px',
                          }}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured trees */}
          {featuredTrees.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} color="#C9731E" />
                <Text variant="heading3" className="discover-display" style={{ display: 'block' }}>
                  Featured this month
                </Text>
              </div>
              <div className="discover-scroll-strip">
                {featuredTrees.map((tree) => (
                  <div key={tree.id} style={{ flexShrink: 0 }}>
                    <TreeCard
                      tree={tree}
                      rootName={rootNames[tree.id] || ''}
                      peopleCount={peopleCounts[tree.id] || 0}
                      userRole="Featured"
                      onClick={() => handleTreeClick(tree.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured stories */}
          {featuredStories.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={18} color="#8B5E3C" />
                <Text variant="heading3" className="discover-display" style={{ display: 'block' }}>
                  Stories worth reading
                </Text>
              </div>
              <div className="discover-scroll-strip">
                {featuredStories.map((story) => {
                  const cover = story.attachments?.find((a) => a.type === 'image')?.url;
                  return (
                    <div
                      key={story.id}
                      onClick={() => navigate(`/public-tree/${story.treeId}`)}
                      role="button"
                      tabIndex={0}
                      className="flex-shrink-0"
                      style={{
                        width: 240,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #EADFC8',
                        boxShadow: '0 2px 8px rgba(139,94,60,0.08)',
                      }}
                    >
                      {cover ? (
                        <img src={cover} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: 120, backgroundColor: '#F3EDE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={28} color="#C9B89A" />
                        </div>
                      )}
                      <div style={{ padding: 12 }}>
                        <Text variant="body1" style={{ fontWeight: 700, display: 'block', marginBottom: 2 }}>
                          {story.title}
                        </Text>
                        <Text variant="body2" style={{ color: 'var(--color-secondary-text)', fontSize: '0.78rem' }}>
                          {story._treeName}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="discover-divider my-10" />

          {/* Filter chips */}
          {(topTribes.length > 1 || topHomelands.length > 1) && (
            <div className="flex flex-col gap-3 mb-6">
              {topTribes.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: '0.8rem', color: '#8B5E3C', fontWeight: 700, marginRight: 4 }}>Tribe</span>
                  {topTribes.map((tribe) => (
                    <button
                      key={tribe}
                      style={chipStyle(tribeFilter === tribe)}
                      onClick={() => setTribeFilter(tribeFilter === tribe ? null : tribe)}
                    >
                      {tribe}
                    </button>
                  ))}
                </div>
              )}
              {topHomelands.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: '0.8rem', color: '#8B5E3C', fontWeight: 700, marginRight: 4 }}>Homeland</span>
                  {topHomelands.map((homeland) => (
                    <button
                      key={homeland}
                      style={chipStyle(homelandFilter === homeland)}
                      onClick={() => setHomelandFilter(homelandFilter === homeland ? null : homeland)}
                    >
                      {homeland}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Text variant="body1" style={{ color: 'var(--color-secondary-text)' }}>
                {filteredTrees.length === 0
                  ? 'No public trees found'
                  : `${filteredTrees.length} public ${filteredTrees.length === 1 ? 'tree' : 'trees'}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </Text>
              <button
                style={chipStyle(showSavedOnly)}
                onClick={() => setShowSavedOnly((prev) => !prev)}
              >
                <span className="flex items-center gap-1">
                  <Bookmark size={13} fill={showSavedOnly ? '#FFFFFF' : 'none'} />
                  Saved
                </span>
              </button>
            </div>
            <SelectDropdown
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value || 'newest')}
              placeholder="Sort by"
              style={{ width: '180px' }}
            />
          </div>

          {/* Grid / empty state */}
          {filteredTrees.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Globe2 size={40} style={{ color: '#8B5E3C', margin: '0 auto 14px' }} />
              <Text variant="heading3" className="discover-display" style={{ display: 'block', marginBottom: 8 }}>
                {showSavedOnly
                  ? "You haven't saved any trees yet"
                  : searchTerm || tribeFilter || homelandFilter
                  ? 'Nothing matches that search'
                  : 'No public trees yet'}
              </Text>
              <Text variant="body2" style={{ color: 'var(--color-secondary-text)' }}>
                {showSavedOnly
                  ? 'Tap the bookmark icon on a tree to save it for later.'
                  : searchTerm || tribeFilter || homelandFilter
                  ? 'Try a different family name, tribe, or homeland.'
                  : "Once a family makes their tree public, it'll show up here for others to explore."}
              </Text>
              {!searchTerm && !tribeFilter && !homelandFilter && !showSavedOnly && (
                <Button onClick={() => navigate('/my-trees')} style={{ marginTop: 20 }}>
                  Go to My Trees
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 mt-6 justify-items-center">
                {paginatedTrees.map((tree, i) => {
                  const showOrigin =
                    isMeaningful(tree.orgineTribe, PLACEHOLDER_TRIBE) ||
                    isMeaningful(tree.origineHomeLand, PLACEHOLDER_HOMELAND);
                  const updated = timeAgo(tree.updatedAt);
                  const saved = savedTreeIds.has(tree.id);

                  return (
                    <RevealOnScroll key={tree.id} delay={(i % PAGE_SIZE) * 60}>
                      <div className="flex flex-col items-center">
                        <div style={{ position: 'relative' }}>
                          <button
                            className="discover-bookmark-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaved(tree.id);
                            }}
                            aria-label={saved ? 'Remove from saved trees' : 'Save tree for later'}
                          >
                            <Bookmark size={16} color="#C9731E" fill={saved ? '#C9731E' : 'none'} />
                          </button>
                          <TreeCard
                            tree={tree}
                            rootName={detailsLoading ? 'Loading...' : rootNames[tree.id]}
                            peopleCount={peopleCounts[tree.id] || 0}
                            userRole="Public"
                            onClick={() => handleTreeClick(tree.id)}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
                          {showOrigin && (
                            <div className="flex items-center gap-1" style={{ color: '#8B5E3C', fontSize: '0.85rem' }}>
                              <MapPin size={14} />
                              <span>
                                {[
                                  isMeaningful(tree.orgineTribe, PLACEHOLDER_TRIBE) ? tree.orgineTribe : null,
                                  isMeaningful(tree.origineHomeLand, PLACEHOLDER_HOMELAND) ? tree.origineHomeLand : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </div>
                          )}
                          {updated && (
                            <div className="flex items-center gap-1" style={{ color: '#A89578', fontSize: '0.8rem' }}>
                              <Clock size={12} />
                              <span>Updated {updated}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </RevealOnScroll>
                  );
                })}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </PageFrame>
  );
}