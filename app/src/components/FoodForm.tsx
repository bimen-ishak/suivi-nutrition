import { useState, useEffect } from 'react';
import type { Food, Portion } from '../types';
import { calculateSodiumFromSalt } from '../utils/calculations';
import { LabelScanButton } from './LabelScanButton';
import type { LabelResult } from '../utils/labelReader';
import { estimateMissingValues, needsEstimate } from '../utils/estimates';
import './FoodForm.css';
import { t, unitLabel } from '../i18n';
import { ti } from './Icon';

interface FoodFormProps {
  initialFood?: Food | null;
  initialBarcode?: string;
  onSave: (food: Omit<Food, 'id' | 'frequency' | 'lastUsed' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormState {
  name: string;
  brand: string;
  barcode: string;
  kcal_per_100g: string;
  protein: string;
  carbs: string;
  sugars: string;
  fat: string;
  fiber: string;
  salt: string;
  sodium: string;
  potassium: string;
  source: 'étiquette' | 'estimation';
  baseUnit: 'g' | 'ml';
}

export function FoodForm({ initialFood, initialBarcode, onSave, onCancel, isLoading = false }: FoodFormProps) {
  const isEditing = !!initialFood;

  const [form, setForm] = useState<FormState>({
    name: '',
    brand: '',
    barcode: initialBarcode || '',
    kcal_per_100g: '',
    protein: '',
    carbs: '',
    sugars: '',
    fat: '',
    fiber: '',
    salt: '',
    sodium: '',
    potassium: '',
    source: initialBarcode ? 'étiquette' : 'étiquette',
    baseUnit: 'g'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estimateNote, setEstimateNote] = useState<string | null>(null);
  const [showPortions, setShowPortions] = useState(false);
  const [newPortion, setNewPortion] = useState({ name: '', grams: '' });
  const [portions, setPortions] = useState<Portion[]>([]);

  // Initialiser le formulaire si on édite
  useEffect(() => {
    if (initialFood) {
      setForm({
        name: initialFood.name,
        brand: initialFood.brand || '',
        barcode: initialFood.barcode || '',
        kcal_per_100g: String(initialFood.kcal_per_100g),
        protein: String(initialFood.protein),
        carbs: String(initialFood.carbs),
        sugars: initialFood.sugars !== undefined ? String(initialFood.sugars) : '',
        fat: String(initialFood.fat),
        fiber: initialFood.fiber !== undefined ? String(initialFood.fiber) : '',
        salt: initialFood.salt !== undefined ? String(initialFood.salt) : '',
        sodium: initialFood.sodium !== undefined ? String(initialFood.sodium) : '',
        potassium: initialFood.potassium !== undefined ? String(initialFood.potassium) : '',
        source: initialFood.source,
        baseUnit: initialFood.baseUnit ?? 'g'
      });
      setPortions(initialFood.portions || []);
    }
  }, [initialFood]);

  // Calculer le sodium automatiquement quand le sel change
  const handleSaltChange = (value: string) => {
    setForm(prev => {
      const newForm = { ...prev, salt: value };
      if (value !== '' && !isNaN(Number(value))) {
        newForm.sodium = String(calculateSodiumFromSalt(Number(value)));
      }
      return newForm;
    });
  };

  // Remplit le formulaire avec ce que l'IA a lu, sans effacer ce qui n'a pas été lu
  const handleLabelRead = (result: LabelResult) => {
    const text = (value: number | undefined, previous: string) => (value !== undefined ? String(value) : previous);
    setForm(prev => ({
      ...prev,
      name: result.name ?? (prev.name || (result.estimated ? t('Repas (estimation IA)') : prev.name)),
      brand: result.brand ?? prev.brand,
      barcode: result.barcode ?? prev.barcode,
      baseUnit: result.unit,
      kcal_per_100g: text(result.kcal, prev.kcal_per_100g),
      protein: text(result.protein, prev.protein),
      carbs: text(result.carbs, prev.carbs),
      fat: text(result.fat, prev.fat),
      sugars: text(result.sugars, prev.sugars),
      fiber: text(result.fiber, prev.fiber),
      salt: text(result.salt, prev.salt),
      sodium:
        result.salt !== undefined
          ? String(calculateSodiumFromSalt(result.salt))
          : text(result.sodium, prev.sodium),
      potassium: text(result.potassium, prev.potassium),
      source: result.estimated ? 'estimation' : 'étiquette'
    }));
    setErrors({});
  };

  // Calories connues mais macros ou potassium absents : on propose des valeurs moyennes
  const kcalValue = Number(form.kcal_per_100g) || 0;
  const showEstimate = needsEstimate({
    kcal: kcalValue,
    protein: form.protein,
    carbs: form.carbs,
    fat: form.fat,
    potassium: form.potassium
  });

  const handleEstimate = () => {
    const estimate = estimateMissingValues(form.name, kcalValue);
    const macrosEmpty = [form.protein, form.carbs, form.fat].every(value => value.trim() === '');
    setEstimateNote(
      estimate.basis === 'generic'
        ? t('Basé sur « {name} » de la base générique.', { name: estimate.matchedName ?? '' })
        : t('Répartition moyenne des calories (15 % protéines, 50 % glucides, 35 % lipides).')
    );
    setForm(prev => ({
      ...prev,
      protein: macrosEmpty ? String(estimate.protein) : prev.protein,
      carbs: macrosEmpty ? String(estimate.carbs) : prev.carbs,
      fat: macrosEmpty ? String(estimate.fat) : prev.fat,
      potassium: prev.potassium.trim() === '' ? String(estimate.potassium) : prev.potassium,
      source: 'estimation'
    }));
    setErrors({});
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name?.trim()) newErrors.name = t('Le nom est obligatoire');
    if (form.kcal_per_100g === '' || isNaN(Number(form.kcal_per_100g)) || Number(form.kcal_per_100g) < 0)
      newErrors.kcal_per_100g = t('Calories obligatoires (nombre positif)');
    if (form.protein === '' || isNaN(Number(form.protein)) || Number(form.protein) < 0)
      newErrors.protein = t('Protéines obligatoires');
    if (form.carbs === '' || isNaN(Number(form.carbs)) || Number(form.carbs) < 0)
      newErrors.carbs = t('Glucides obligatoires');
    if (form.fat === '' || isNaN(Number(form.fat)) || Number(form.fat) < 0)
      newErrors.fat = t('Lipides obligatoires');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const foodData: Omit<Food, 'id' | 'frequency' | 'lastUsed' | 'createdAt' | 'updatedAt'> = {
      name: form.name!.trim(),
      brand: form.brand?.trim() || undefined,
      barcode: form.barcode?.trim() || undefined,
      kcal_per_100g: Number(form.kcal_per_100g),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      sugars: form.sugars !== '' && !isNaN(Number(form.sugars)) ? Number(form.sugars) : undefined,
      fat: Number(form.fat),
      fiber: form.fiber !== '' && !isNaN(Number(form.fiber)) ? Number(form.fiber) : undefined,
      salt: form.salt !== '' && !isNaN(Number(form.salt)) ? Number(form.salt) : undefined,
      sodium: form.sodium !== '' && !isNaN(Number(form.sodium)) ? Number(form.sodium) : undefined,
      potassium: form.potassium !== '' && !isNaN(Number(form.potassium)) ? Number(form.potassium) : undefined,
      source: form.source,
      baseUnit: form.baseUnit,
      portions
    };

    onSave(foodData);
  };

  const addPortion = () => {
    if (!newPortion.name.trim() || newPortion.grams === '' || isNaN(Number(newPortion.grams))) return;
    setPortions(prev => [...prev, { name: newPortion.name.trim(), grams: Number(newPortion.grams) }]);
    setNewPortion({ name: '', grams: '' });
  };

  const removePortion = (index: number) => {
    setPortions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="food-form-overlay">
      <div className="food-form-modal">
        <div className="food-form-header">
          <h2>{isEditing ? t("Modifier l'aliment") : t('Nouvel aliment')}</h2>
          <button className="close-btn" onClick={onCancel} aria-label={t('Fermer')}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="food-form">
          {!isEditing && <LabelScanButton onRead={handleLabelRead} />}

          <div className="form-section">
            <h3>{t('Informations de base')}</h3>

            <div className="form-row">
              <label htmlFor="name">{t('Nom *')}</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('Ex: Céréales Lidl chocolat noix cajou')}
                autoFocus
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <label htmlFor="brand">{t('Marque (optionnel)')}</label>
              <input
                id="brand"
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder={t('Ex: Lidl')}
              />
            </div>

            <div className="form-row">
              <label htmlFor="barcode">{t('Code-barres (optionnel)')}</label>
              <input
                id="barcode"
                type="text"
                value={form.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder={t('Ex: 1234567890123')}
                pattern="[0-9]*"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>{t('Valeurs nutritionnelles pour 100 {unit} *', { unit: unitLabel(form.baseUnit) })}</h3>

            <div className="base-unit-toggle" role="group" aria-label={t('Unité de référence')}>
              {(['g', 'ml'] as const).map(unit => (
                <button
                  key={unit}
                  type="button"
                  className={form.baseUnit === unit ? 'active' : ''}
                  aria-pressed={form.baseUnit === unit}
                  onClick={() => handleChange('baseUnit', unit)}
                >
                  {unit === 'g' ? t('Solide (100 g)') : t('Liquide (100 ml)')}
                </button>
              ))}
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="kcal">{t('Calories (kcal) *')}</label>
                <input
                  id="kcal"
                  type="number"
                  min="0"
                  step="1"
                  value={form.kcal_per_100g}
                  onChange={(e) => handleChange('kcal_per_100g', e.target.value)}
                />
                {errors.kcal_per_100g && <span className="error">{errors.kcal_per_100g}</span>}
              </div>

              <div className="form-row">
                <label htmlFor="protein">{t('Protéines (g) *')}</label>
                <input
                  id="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.protein}
                  onChange={(e) => handleChange('protein', e.target.value)}
                />
                {errors.protein && <span className="error">{errors.protein}</span>}
              </div>

              <div className="form-row">
                <label htmlFor="carbs">{t('Glucides (g) *')}</label>
                <input
                  id="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.carbs}
                  onChange={(e) => handleChange('carbs', e.target.value)}
                />
                {errors.carbs && <span className="error">{errors.carbs}</span>}
              </div>

              <div className="form-row">
                <label htmlFor="fat">{t('Lipides (g) *')}</label>
                <input
                  id="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.fat}
                  onChange={(e) => handleChange('fat', e.target.value)}
                />
                {errors.fat && <span className="error">{errors.fat}</span>}
              </div>
            </div>

            {showEstimate && (
              <div className="estimate-box">
                <p>
                  {t('Il manque des macros ou le potassium. Je peux proposer des valeurs moyennes, marquées « estimation ».')}
                </p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleEstimate}>
                  {ti('💡 Proposer des valeurs moyennes')}
                </button>
              </div>
            )}
            {estimateNote && !showEstimate && form.source === 'estimation' && (
              <p className="estimate-note">{ti('📊 Valeurs estimées.')} {estimateNote}</p>
            )}

            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="sugars">{t('Sucres (g) — optionnel')}</label>
                <input
                  id="sugars"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.sugars}
                  onChange={(e) => handleChange('sugars', e.target.value)}
                />
              </div>

              <div className="form-row">
                <label htmlFor="fiber">{t('Fibres (g) — optionnel')}</label>
                <input
                  id="fiber"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.fiber}
                  onChange={(e) => handleChange('fiber', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section salt-section">
              <h4>{t('Sel / Sodium')}</h4>
              <p className="hint">{t('Remplis l\'un des deux, l\'autre est calculé automatiquement (1g sel = 400mg sodium)')}</p>

              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="salt">{t('Sel (g)')}</label>
                  <input
                    id="salt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salt}
                    onChange={(e) => handleSaltChange(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="sodium">{t('Sodium (mg)')}</label>
                  <input
                    id="sodium"
                    type="number"
                    min="0"
                    step="1"
                    value={form.sodium}
                    onChange={(e) => handleChange('sodium', e.target.value)}
                    disabled={form.salt !== '' && !isNaN(Number(form.salt))}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="potassium">{t('Potassium (mg) — optionnel')}</label>
              <input
                id="potassium"
                type="number"
                min="0"
                step="1"
                value={form.potassium}
                onChange={(e) => handleChange('potassium', e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>{t('Source des valeurs *')}</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="source"
                  value="étiquette"
                  checked={form.source === 'étiquette'}
                  onChange={() => handleChange('source', 'étiquette')}
                />
                <span className="radio-custom">
                  <span className="radio-dot"></span>
                  {ti('🏷️ Étiquette (valeurs lues sur le paquet)')}
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="source"
                  value="estimation"
                  checked={form.source === 'estimation'}
                  onChange={() => handleChange('source', 'estimation')}
                />
                <span className="radio-custom">
                  <span className="radio-dot"></span>
                  {ti('📊 Estimation (base générique, restaurant, etc.)')}
                </span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>{t('Portions rapides (optionnel)')}</h3>
              <button
                type="button"
                className="btn-toggle"
                onClick={() => setShowPortions(!showPortions)}
              >
                {showPortions ? t('Masquer') : t('Ajouter des portions')}
              </button>
            </div>

            {showPortions && (
              <div className="portions-form">
                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="portionName">{t('Nom (ex: biscuit, bol, carré)')}</label>
                    <input
                      id="portionName"
                      type="text"
                      value={newPortion.name}
                      onChange={e => setNewPortion(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('Ex: biscuit')}
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor="portionGrams">{form.baseUnit === 'ml' ? t('Volume (ml)') : t('Poids (g)')}</label>
                    <input
                      id="portionGrams"
                      type="number"
                      min="1"
                      step="0.1"
                      value={newPortion.grams}
                      onChange={e => setNewPortion(prev => ({ ...prev, grams: e.target.value }))}
                      placeholder={t('Ex: 12.5')}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addPortion}
                  disabled={!newPortion.name.trim() || newPortion.grams === '' || isNaN(Number(newPortion.grams))}
                >
                  {t('+ Ajouter')}
                </button>

                {portions.length > 0 && (
                  <div className="portions-list">
                    {portions.map((portion, index) => (
                      <div key={index} className="portion-item">
                        <span><strong>{portion.name}</strong> = {portion.grams}{form.baseUnit}</span>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removePortion(index)}
                          aria-label={t('Supprimer {name}', { name: portion.name })}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
              {t('Annuler')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? t('Enregistrement...') : (isEditing ? t('Enregistrer') : t('Créer'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}