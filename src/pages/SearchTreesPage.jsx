import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FlexContainer from '../layout/containers/FlexContainer';
import Text from '../components/Text';
import Card from '../layout/containers/Card';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import Button from '../components/Button';
import TreeCard from '../components/TreeCard';
import DataTable from '../components/DataTable';
import dataService from '../services/dataService';
import LottieLoader from '../components/LottieLoader';
import { Search, ArrowLeft } from 'lucide-react';

const SearchTreesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);
  const [filteredTrees, setFilteredTrees] = useState([]);

  useEffect(() => {
    const fetchPublicTrees = async () => {
      try {
        setLoading(true);
        const allTrees = await dataService.getAllTrees();
        // Filter only public trees
        const publicTrees = allTrees.filter(tree => tree.isPublic === true);
        setTrees(publicTrees);
        setFilteredTrees(publicTrees);
      } catch (error) {
        console.error('Failed to fetch public trees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTrees();
  }, []);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
      filterTrees(query);
    }
  }, [query]);

  const filterTrees = (term) => {
    if (!term.trim()) {
      setFilteredTrees(trees);
      return;
    }

    const filtered = trees.filter(tree =>
      tree.familyName.toLowerCase().includes(term.toLowerCase()) ||
      (tree.description && tree.description.toLowerCase().includes(term.toLowerCase())) ||
      (tree.tribe && tree.tribe.toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredTrees(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      filterTrees(searchTerm.trim());
    }
  };

  const handleTreeClick = (tree) => {
    navigate(`/public-tree/${tree.id}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <FlexContainer justify="center" align="center" padding="20px" style={{ height: '100vh' }}>
        <div style={{ width: 220, maxWidth: '60vw' }}>
          <LottieLoader name="generalDataLoader" aspectRatio={1} loop autoplay />
        </div>
        <div style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Loading public trees...
        </div>
      </FlexContainer>
    );
  }

  return (
    <FlexContainer direction="vertical" padding="20px" gap="20px">
      {/* Header */}
      <Row justifyContent="space-between" align="center">
        <Button variant="ghost" onClick={handleBackToHome}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Home
        </Button>
        <Text variant="heading1">Search Public Family Trees</Text>
        <div></div> {/* Spacer */}
      </Row>

      {/* Search Bar */}
      <Card padding="20px">
        <form onSubmit={handleSearch}>
          <Row gap="10px" align="center">
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by family name, description, or tribe..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-gray-light)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            <Button type="submit" variant="primary">
              <Search size={16} style={{ marginRight: '8px' }} />
              Search
            </Button>
          </Row>
        </form>
      </Card>

      {/* Results */}
      <Text variant="body1">
        {filteredTrees.length === 0 && searchTerm
          ? `No public trees found matching "${searchTerm}"`
          : `Found ${filteredTrees.length} public ${filteredTrees.length === 1 ? 'tree' : 'trees'}`
        }
      </Text>

      {filteredTrees.length === 0 && !loading ? (
        <Card padding="40px" textAlign="center">
          <Search size={48} color="var(--color-gray)" />
          <Text variant="heading3" margin="10px 0">No Trees Found</Text>
          <Text variant="body2" color="gray">
            Try adjusting your search terms or browse all public trees.
          </Text>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
          padding: '20px 0'
        }}>
          {filteredTrees.map((tree) => (
            <TreeCard
              key={tree.id}
              tree={tree}
              rootName="Public Tree"
              peopleCount={tree.peopleCount || 0}
              userRole="Viewer"
              onClick={() => handleTreeClick(tree)}
              isPublic={true}
            />
          ))}
        </div>
      )}
    </FlexContainer>
  );
};

export default SearchTreesPage;
