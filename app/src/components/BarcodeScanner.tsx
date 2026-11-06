import { useEffect, useRef, useState, useCallback } from 'react';
import type { BrowserMultiFormatReader as ZXingReader } from '@zxing/library';
import { getFoodByBarcode } from '../db';
import type { Food } from '../types';
import './BarcodeScanner.css';

interface BarcodeScannerProps {
  onScanSuccess: (food: Food) => void;
  onScanNotFound: (barcode: string) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScanSuccess, onScanNotFound, onCancel }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<ZXingReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(true);

  const handleBarcode = useCallback(async (barcode: string) => {
    setScanning(false);
    try {
      const food = await getFoodByBarcode(barcode);
      if (food) {
        onScanSuccess(food);
      } else {
        onScanNotFound(barcode);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche du code-barres:', err);
      onScanNotFound(barcode);
    }
  }, [onScanSuccess, onScanNotFound]);

  useEffect(() => {
    let cancelled = false;

    const startScanning = async () => {
      try {
        // Import dynamique de ZXing (gros bundle, chargé à la demande)
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library');
        if (cancelled) return;

        const reader: ZXingReader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // facingMode laisse le système choisir la caméra arrière principale.
        // Choisir par libellé échoue sur un iPhone en français et peut
        // sélectionner le téléobjectif, qui zoome et ne fait pas le point de près.
        await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet]
            }
          },
          videoRef.current!,
          (result, err) => {
            if (result) {
              handleBarcode(result.getText());
            } else if (err && !(err instanceof NotFoundException)) {
              // Erreurs autres que "pas de code trouvé" (normales en continu)
            }
          }
        );
        setLoading(false);
      } catch (err) {
        console.error('Erreur caméra:', err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Accès à la caméra refusé. Autorise la caméra dans les réglages Safari.');
        } else if (err instanceof Error && err.name === 'NotFoundError') {
          setError('Aucune caméra détectée');
        } else {
          setError('Impossible d\'accéder à la caméra');
        }
        setLoading(false);
      }
    };

    startScanning();

    return () => {
      cancelled = true;
      readerRef.current?.reset();
    };
  }, [handleBarcode]);

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    setScanning(false);
    await handleBarcode(manualCode.trim());
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <button className="back-btn" onClick={onCancel}>← Retour</button>
        <h2>Scanner un code-barres</h2>
        <div style={{ width: 60 }}></div>
      </div>

      {error ? (
        <div className="scanner-error">
          <p>⚠️ {error}</p>
          <p className="hint">Tu peux saisir le code manuellement ci-dessous</p>
        </div>
      ) : (
        <div className="video-container">
          <video ref={videoRef} className="scanner-video" playsInline muted />
          <div className="scan-overlay">
            <div className="scan-frame"></div>
          </div>
          {loading && <p className="scan-hint">Chargement de la caméra...</p>}
          {scanning && !loading && <p className="scan-hint">Centre le code-barres, à 15-20 cm du téléphone</p>}
        </div>
      )}

      <div className="manual-entry">
        <p>Ou saisis le code manuellement :</p>
        <div className="manual-input-group">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Code-barres (13 chiffres)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <button className="btn btn-primary" onClick={handleManualSubmit} disabled={!manualCode.trim()}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
