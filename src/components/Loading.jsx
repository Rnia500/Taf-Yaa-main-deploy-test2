import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Lottie from 'lottie-react';
import { getLottieData } from '../assets/lotties/lottieMappings.js';
import '../styles/Loading.css';

const Loading = ({
  variant = 'spinner', 
  size = 'md', 
  message = 'Loading...',
  fullScreen = false,
  portal = false,
  className = '',
  lottieName = null, 
  animationData = null, 
  scale = 1, // scale factor for lottie animations
}) => {
  const [lottieData, setLottieData] = useState(null);
  const [lottieError, setLottieError] = useState(false);

  useEffect(() => {
    if (variant === 'lottie' && lottieName && !animationData) {
      getLottieData(lottieName).then(data => {
        if (data) {
          setLottieData(data);
        } else {
          setLottieError(true);
        }
      }).catch(() => setLottieError(true));
    }
  }, [variant, lottieName, animationData]);
  const containerClasses = [
    'loading-container',
    fullScreen && 'loading-fullscreen',
    portal && 'loading-portal',
    className,
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`loading-spinner loading-spinner-${size}`}>
            <div className="loading-spinner-circle"></div>
            {message && <p className="loading-message">{message}</p>}
          </div>
        );
      case 'skeleton':
        return (
          <div className="loading-skeleton">
            <div className="loading-skeleton-line"></div>
            <div className="loading-skeleton-line loading-skeleton-line-short"></div>
            <div className="loading-skeleton-line loading-skeleton-line-medium"></div>
            {message && <p className="loading-message">{message}</p>}
          </div>
        );
      case 'overlay':
        return (
          <div className="loading-overlay">
            <div className={`loading-spinner loading-spinner-${size}`}>
              <div className="loading-spinner-circle"></div>
              {message && <p className="loading-message">{message}</p>}
            </div>
          </div>
        );
      case 'lottie': {
        if (lottieError) {
          // Fallback to spinner if Lottie fails
          return (
            <div className={`loading-spinner loading-spinner-${size}`}>
              <div className="loading-spinner-circle"></div>
              {message && <p className="loading-message">{message}</p>}
            </div>
          );
        }
        const data = animationData || lottieData;
        if (!data) {
          // Loading state for Lottie - don't show spinner, just wait for data
          return null;
        }
    return (
      <div className={`loading-lottie loading-lottie-${size}`}>
        <Lottie
          animationData={JSON.parse(JSON.stringify(data))}
          loop={true}
          style={{ transform: `scale(${scale})` }}
        />
        {message && <p className="loading-message">{message}</p>}
      </div>
    );
      }
      default:
        return <div>{message}</div>;
    }
  };

  const content = (
    <div className={containerClasses}>
      {renderContent()}
    </div>
  );

  // Use portal to render outside the component tree if portal prop is true
  if (portal) {
    return createPortal(content, document.body);
  }

  return content;
};

export default Loading;
