import React, { useEffect, useState, useMemo } from 'react';
import Lottie from 'lottie-react';
import { getLottieData, preloadLottie } from '../assets/lotties/lottieMappings';

/**
 * LottieLoader
 * Props:
 * - name: key from lottieMappings (e.g. 'loginLoader' or 'treeDataLoader')
 * - loop: boolean
 * - autoplay: boolean
 * - style/className: passed to wrapper
 * - aspectRatio: optional width/height ratio e.g. 1.0 or 16/9 (keeps layout stable)
 */
const LottieLoader = ({ name, loop = true, autoplay = true, style = {}, className = '', aspectRatio = 1 }) => {
  const [animationData, setAnimationData] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    setAnimationData(null);
    setVisible(false);

    // start a preload (warm the cache) and then set data
    (async () => {
      try {
        // attempt to preload - if already cached this is cheap
        await preloadLottie(name);
        if (!mounted) return;
        const data = await getLottieData(name);
        if (!mounted) return;
        if (data) {
          setAnimationData(data);
          // small delay to allow CSS transition; remove if you want immediate show
          requestAnimationFrame(() => setVisible(true));
        }
      } catch (err) {
        if (mounted) console.error('Failed to load Lottie:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [name]);

  // memo wrapper styles to avoid rerenders of Lottie
  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    paddingTop: `${100 / aspectRatio}%`, // maintain aspect ratio box (height based on width)
    overflow: 'hidden',
    ...style,
  }), [style, aspectRatio]);

  const innerStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    transition: 'opacity 220ms ease',
    opacity: visible ? 1 : 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const placeholderStyle = {
    width: '40%',
    height: '40%',
    opacity: 0.08,
    background: 'linear-gradient(90deg,#ddd,#eee)',
    borderRadius: 8,
  };

  // show placeholder while loading to keep layout stable
  return (
    <div className={className} style={containerStyle}>
      {!animationData && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={placeholderStyle} aria-hidden="true" />
        </div>
      )}

      {animationData && (
        <div style={innerStyle}>
          <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
        </div>
      )}
    </div>
  );
};

export default LottieLoader;
