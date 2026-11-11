import { useState } from 'react';
import { Icon } from '../components/Icon';
import { locale, t, unitLabel } from '../i18n';
import { bulkDb, validWeightKg } from './store';

export function BulkWeightEntry({ date, weightKg, onChange }: {
  date: string;
  weightKg?: number;
  onChange: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (kg?: number) => {
    setSaving(true);
    setError('');
    try {
      if (kg === undefined) await bulkDb.weights.delete(date);
      else await bulkDb.weights.put({ date, kg });
      await onChange();
      setEditing(false);
    } catch {
      setError(t('Impossible d’enregistrer le poids. Réessaie.'));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return <button type="button" className="bulk-weight-trigger" onClick={() => {
      setInput(weightKg?.toString() ?? '');
      setError('');
      setEditing(true);
    }}>
      <Icon name="scale" />
      {weightKg === undefined
        ? t('Ajouter mon poids (facultatif)')
        : t('Poids : {weight} {unit}', { weight: weightKg.toLocaleString(locale(), { maximumFractionDigits: 2 }), unit: unitLabel('kg') })}
    </button>;
  }

  return <form className="bulk-panel bulk-weight-form" onSubmit={event => {
    event.preventDefault();
    const text = input.trim()
      .replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16))
      .replace(/[,.٫،]/g, '.');
    const kg = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(text) ? Number(text) : NaN;
    if (!validWeightKg(kg)) {
      setError(t('Entre un poids valide en kg.'));
      return;
    }
    void save(kg);
  }}>
    <label>{t('Poids du matin')} ({unitLabel('kg')})
      <input value={input} inputMode="decimal" disabled={saving} onChange={event => setInput(event.target.value)} />
    </label>
    <div className="bulk-inline">
      <button className="btn btn-primary btn-sm" disabled={saving || !input.trim()}>{t('Enregistrer')}</button>
      <button className="back-btn" type="button" disabled={saving} onClick={() => setEditing(false)}>{t('Annuler')}</button>
      {weightKg !== undefined && <button className="back-btn" type="button" disabled={saving} onClick={() => void save()}>
        {t('Retirer le poids')}
      </button>}
    </div>
    {error && <p className="bulk-error" role="alert">{error}</p>}
  </form>;
}
