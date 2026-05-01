import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  const scannerRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      rememberLastUsedCamera: true 
    });

    const handleSuccess = (decodedText) => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
          console.log("Scanner cleared successfully.");
          onScanSuccess(decodedText);
        }).catch(err => {
          console.error("Failed to clear scanner:", err);
          onScanSuccess(decodedText);
        });
      }
    };

    scannerRef.current.render(handleSuccess, (error) => {
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Cleanup error:", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '10px' }}>
      <div id="reader" style={{ border: 'none' }}></div>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
        Align barcode within the box
      </p>
    </div>
  );
};

export default BarcodeScanner;