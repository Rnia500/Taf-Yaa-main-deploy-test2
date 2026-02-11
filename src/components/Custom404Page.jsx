import React from 'react';
import { useNavigate } from 'react-router-dom';

const Custom404Page = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      backgroundImage: 'url(/Images/Image404.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '40px',
        borderRadius: '8px',
        maxWidth: '600px',
      }}>
        <h1 style={{ fontSize: '6rem', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page not found</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          Let’s embody your beautiful ideas together, simplify the way you visualize your next big things.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            backgroundColor: '#1f2937',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Custom404Page;
