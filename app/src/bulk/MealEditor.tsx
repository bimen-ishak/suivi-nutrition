import { newId } from './id';
import { Icon } from '../components/Icon';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { t, unitLabel } from '../i18n';
import { getActiveKey, getProvider } from './ai';
import { understandMeal } from './understandMeal';
import { compressPhoto } from '../utils/photo';
import { portionValues, totalValues, validMeal, type BulkMeal } from './store';

interface Props { initial: BulkMeal; onSave: (meals: BulkMeal[]) => Promise<void>; onCancel: () => void; onSettings: () => void; children?: ReactNode }
export function MealEditor({ initial, onSave, onCancel, onSettings, children }: Props) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<BulkMeal[]>(initial.quantity > 0 ? [initial] : []);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [needsAnalysis, setNeedsAnalysis] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  const valid = items.length > 0 && items.every(validMeal) && !needsAnalysis;
  const total = items.length && items.every(validMeal) ? totalValues(items) : null;
  const patch = (index: number, changes: Partial<BulkMeal>) => setItems(current => current.map((item, i) => i === index ? { ...item, ...changes } : item));
  const analyze = async () => {
    setBusy(true); setError('');
    try {
      const images = await Promise.all(files.map(file => compressPhoto(file, 1600, .85)));
      const result = await understandMeal(text, images, question);
      if (result.question) { setQuestion(result.question); setNeedsAnalysis(true); return; }
      setItems(result.items.map((item, index) => ({ ...initial, ...item, id: index === 0 ? initial.id : newId(), notes: [text, ...result.assumptions].filter(Boolean).join('\n') })));
      setAssumptions(result.assumptions); setQuestion(''); setNeedsAnalysis(false); setManualOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : t('Impossible de lire ces photos. Réessaie.')); }
    finally { setBusy(false); }
  };
  return <section className="bulk-editor bulk-panel">
    <div className="bulk-section-head"><h2>{t('Qu’est-ce que tu as mangé ?')}</h2><button className="back-btn" onClick={onCancel} disabled={busy}>{t('Annuler')}</button></div>
    <fieldset disabled={busy} className="bulk-fields">
      <label className="bulk-compose-label">{t('Écris à ta façon')}<textarea rows={3} maxLength={4000} value={text} onChange={e => { setText(e.target.value); setNeedsAnalysis(true); }} placeholder={t('Ex. 100 lait, 2 œufs et une banane… même avec des fautes.')} /></label>
      <div className="bulk-compose-actions"><label className="bulk-attach"><Icon name="camera" />{t('+ Photo facultative')}<input type="file" accept="image/*" multiple onChange={e => { const picked = Array.from(e.target.files ?? []); if (picked.length > 3) { setError(t('Choisis au maximum trois photos.')); return; } setFiles(picked); setError(''); setNeedsAnalysis(true); }} /></label><button className="btn btn-primary" type="button" disabled={!getActiveKey() || (!text.trim() && !files.length)} onClick={analyze}>{busy ? t('Analyse en cours…') : t('Comprendre')}</button></div>
      {previews.length > 0 && <div className="bulk-previews">{previews.map((url, i) => <div key={url}><img src={url} alt={t('Photo du repas')} /><button type="button" aria-label={t('Retirer')} onClick={() => { setFiles(files.filter((_, index) => index !== i)); setNeedsAnalysis(true); }}>×</button></div>)}</div>}
      <p className="bulk-muted">{t('Texte seul, photo seule ou les deux. En appuyant sur Comprendre, tu les envoies au service choisi.')} {getProvider() === 'gemini' ? 'Google Gemini.' : 'OpenRouter.'}</p>
      {!getActiveKey() && <button className="back-btn" type="button" onClick={onSettings}>{t('Configurer Gemini ou OpenRouter')}</button>}
      {question && <div className="bulk-question" role="status"><strong>{question}</strong><p>{t('Complète ton texte au-dessus et appuie à nouveau sur Comprendre.')}</p></div>}
      {error && <p role="alert" className="bulk-error">{error}</p>}
      <button className="back-btn bulk-manual-link" type="button" onClick={() => { setManualOpen(true); setNeedsAnalysis(false); setQuestion(''); if (!items.length) setItems([{ ...initial, quantity: 100 }]); }}>{t('Ou saisir les valeurs moi-même')}</button>
      {!text && files.length === 0 && items.length === 0 && children}
      {assumptions.length > 0 && <div className="bulk-assumptions"><strong>{t('Ce que j’ai supposé')}</strong>{assumptions.map((item, i) => <p key={i}>{item}</p>)}</div>}
      {items.length > 0 && <div className="bulk-review-list"><h3>{t('Vérifie avant d’ajouter')}</h3><p className="bulk-muted">{needsAnalysis ? t('Ton message a changé. Relance Comprendre pour actualiser le résultat.') : t('Corrige la quantité ou les détails si besoin, puis confirme.')}</p>{items.map((item, index) => {
        const p = validMeal(item) ? portionValues(item) : null;
        return <article className="bulk-food-review" key={item.id} data-testid={`review-food-${index}`}>
          <div className="bulk-section-head"><input aria-label={t('Nom du repas')} value={item.name} placeholder={t('Nom du repas')} onChange={e => patch(index, { name: e.target.value })} /><span className="bulk-muted">{item.estimated ? t('Estimation') : t('Étiquette')}</span></div>
          <div className="bulk-inline"><label>{t('Quantité mangée')}<input type="number" min="0.1" step="any" value={item.quantity || ''} onChange={e => patch(index, { quantity: Number(e.target.value) })} /></label><label>{t('Unité')}<select value={item.unit} onChange={e => patch(index, { unit: e.target.value as 'g' | 'ml' })}><option value="g">{unitLabel('g')}</option><option value="ml">{unitLabel('ml')}</option></select></label><strong>{p ? `${p.kcal} ${unitLabel('kcal')}` : '—'}</strong></div>
          {p && <p className="bulk-muted">{p.protein} {unitLabel('g')} {t('Protéines')} · {p.carbs} {unitLabel('g')} {t('Glucides')} · {p.fat} {unitLabel('g')} {t('Lipides')}</p>}
          <details open={manualOpen || undefined}><summary>{t('Ajuster les valeurs nutritionnelles')}</summary><p className="bulk-muted">{t('Valeurs pour 100 g ou 100 ml — saisie manuelle ou résultat de l’IA.')}</p><div className="bulk-number-grid">{(['kcal', 'protein', 'carbs', 'fat', 'sugars'] as const).map(key => <label key={key}>{({ kcal: t('Calories'), protein: t('Protéines'), carbs: t('Glucides'), fat: t('Lipides'), sugars: t('Sucres (facultatif)') })[key]}<input type="number" min="0" step="any" value={Number.isFinite(item.values[key]) ? item.values[key] : ''} onChange={e => patch(index, { values: { ...item.values, [key]: e.target.value === '' && key === 'sugars' ? undefined : e.target.value === '' ? NaN : Number(e.target.value) } })} /></label>)}</div><label className="bulk-check"><input type="checkbox" checked={item.estimated} onChange={e => patch(index, { estimated: e.target.checked })} />{t('Valeurs estimées')}</label></details>
          {items.length > 1 && <button type="button" className="back-btn" onClick={() => setItems(items.filter((_, i) => i !== index))}>{t('Retirer cet aliment')}</button>}
        </article>;
      })}</div>}
      {total && <div className="bulk-review"><strong>{total.kcal} {unitLabel('kcal')}</strong><span>{total.protein} {unitLabel('g')} {t('Protéines')} · {total.carbs} {unitLabel('g')} {t('Glucides')} · {total.fat} {unitLabel('g')} {t('Lipides')}</span></div>}
      {items.length > 0 && <button className="btn btn-primary btn-block" disabled={!valid} onClick={async () => { setBusy(true); setError(''); try { await onSave(items); } catch { setError(t('Enregistrement impossible. Tes valeurs restent affichées, réessaie.')); } finally { setBusy(false); } }}>{t('Confirmer et enregistrer')}</button>}
    </fieldset>
  </section>;
}
