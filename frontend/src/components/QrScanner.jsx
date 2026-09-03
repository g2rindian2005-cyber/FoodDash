import { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';

/**
 * Opens the device camera and scans for a QR code using html5-qrcode.
 * Calls onScan(decodedText) once, then stops the camera automatically.
 *
 * NOTE: browsers only allow camera access (getUserMedia) on HTTPS or on
 * localhost. If this app is served over plain http:// on a public IP/domain,
 * the browser will block the camera — see the README's "HTTPS / camera
 * access" section for how to fix that with a free Let's Encrypt certificate.
 */
export default function QrScanner({ onScan, onClose }) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (window.isSecureContext === false) {
      setError('Camera access needs HTTPS. This page is loaded over plain HTTP, so the browser blocks the camera.');
      return;
    }

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId.current);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => { /* per-frame "no QR found" noise — ignore */ }
        )
        .catch((err) => {
          setError(err?.message || 'Could not access the camera. Check permissions and try again.');
        });
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold"><Camera className="h-5 w-5 text-brand" /> Scan QR to pay</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : (
          <div id={containerId.current} className="overflow-hidden rounded-xl" />
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          Point your camera at any QR code — for this demo, scanning any code confirms payment.
        </p>
      </div>
    </div>
  );
}
