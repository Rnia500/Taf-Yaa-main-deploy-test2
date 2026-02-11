import React, { useEffect, useState, useCallback } from 'react';
import { SwitchCamera, X } from 'lucide-react';
import useToastStore from '../store/useToastStore';
import Card from '../layout/containers/Card';
import Button from './Button';

const CustomQrScanner = ({ onScanSuccess, onClose }) => {
  const [useFront, setUseFront] = useState(true);
  const [QrScanner, setQrScanner] = useState(null);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    import('@yudiel/react-qr-scanner/dist/index.esm.mjs')
      .then((mod) => setQrScanner(() => mod.Scanner))
      .catch((err) => console.error('Failed to load QR scanner', err));
  }, []);

  const handleDecode = useCallback(
    (result) => {
      if (!result?.[0]?.rawValue) return;
      const text = result[0].rawValue;
      const code = text.match(/code=([^&]+)/)?.[1];
      if (code) {
        addToast(`✅ Invite code detected: ${code}`, 'success');
        onScanSuccess(code);
      } else {
        addToast('❌ Invalid QR code format', 'error');
      }
    },
    [onScanSuccess, addToast]
  );

  if (!QrScanner) {
    return (
      <div className="flex justify-center items-center h-full text-gray-600 text-sm">
        Loading scanner...
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      <div className="absolute top-3 left-3">
        <button
          onClick={onClose}
          className="bg-white rounded-full p-2 shadow hover:bg-gray-100 transition"
        >
          
        </button>
      </div>

     
       <Card position='relative' maxWidth={320} padding='2.5rem' margin='0px' backgroundColor='var(--color-gray-light)'>

          <Card size={30} positionType='absolute' position='top-left' padding='0px' margin='0.5rem 0px 0px 0.5rem'  rounded backgroundColor='var(--color-danger)'>
              <X className="w-5 h-5 text-gray-800" />
          </Card>
          <QrScanner
            constraints={{
              facingMode: useFront ? 'user' : 'environment',
            }}
            onDecode={handleDecode}
            onError={(err) => addToast('Camera error: ' + err.message, 'error')}
            style={{ width: '100%', borderRadius: '50px' }}
          />

       </Card>
     

      <button
        onClick={() => setUseFront(!useFront)}
        className="absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition flex items-center justify-center"
        title="Switch camera"
      >
        <SwitchCamera  className="w-5 h-5 text-gray-800" />
      </button>

      <p className="absolute bottom-2 text-xs text-gray-500">
        Point the camera at the invite QR code
      </p>
    </div>
  );
};

export default CustomQrScanner;
