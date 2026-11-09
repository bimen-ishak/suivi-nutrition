import type { Food } from '../types';
import './FoodCard.css';
import { t, tn, unitLabel, macroLetter, locale } from '../i18n';
import { ti, Icon } from './Icon';

interface FoodCardProps {
  food: Food;
  onEdit?: (food: Food) => void;
  onDelete?: (food: Food) => void;
  showSource?: boolean;
  compact?: boolean;
}

export function FoodCard({ food, onEdit, onDelete, showSource = true, compact = false }: FoodCardProps) {
  const formatNumber = (num: number) => Math.round(num * 10) / 10;

  return (
    <div className={`food-card ${compact ? 'compact' : ''}`}>
      <div className="food-card-header">
        <div className="food-info">
          <h3 className="food-name">{food.name}</h3>
          {food.brand && <span className="food-brand">{food.brand}</span>}
          {food.barcode && <span className="food-barcode"><Icon name="scan" />{food.barcode}</span>}
        </div>
        {showSource && (
          <span className={`food-source ${food.source}`}>
            {food.source === 'étiquette' ? ti('🏷️ Étiquette') : ti('📊 Estimation')}
          </span>
        )}
      </div>

      {!compact && (
        <div className="food-nutrition">
          <div className="nutrition-row">
            <span className="nutrition-label">{t('Pour 100 {unit} :', { unit: unitLabel(food.baseUnit ?? 'g') })}</span>
            <span className="nutrition-value">
              <strong>{formatNumber(food.kcal_per_100g)} {unitLabel('kcal')}</strong> ·
              {macroLetter('P')} {formatNumber(food.protein)}{unitLabel('g')} ·
              {macroLetter('G')} {formatNumber(food.carbs)}{unitLabel('g')} ·
              {macroLetter('L')} {formatNumber(food.fat)}{unitLabel('g')}
            </span>
          </div>
          {(food.sugars !== undefined || food.fiber !== undefined || food.sodium !== undefined || food.potassium !== undefined) && (
            <div className="nutrition-row detail">
              <span className="nutrition-label">{t('Détails :')}</span>
              <span className="nutrition-value">
                {food.sugars !== undefined && `${t('Sucres')} ${formatNumber(food.sugars)}${unitLabel('g')} · `}
                {food.fiber !== undefined && `${t('Fibres')} ${formatNumber(food.fiber)}${unitLabel('g')} · `}
                {food.sodium !== undefined && `${t('Na')} ${food.sodium}${unitLabel('mg')} · `}
                {food.potassium !== undefined && `${t('K')} ${food.potassium}${unitLabel('mg')}`}
              </span>
            </div>
          )}
        </div>
      )}

      {!compact && food.portions.length > 0 && (
        <div className="food-portions">
          <span className="portions-label">{t('Portions :')}</span>
          <div className="portions-list">
            {food.portions.map((portion, index) => (
              <span key={index} className="portion-badge">
                {portion.name} = {portion.grams}{unitLabel(food.baseUnit ?? 'g')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="food-meta">
        <span>{tn('Utilisé {n} fois', 'Utilisé {n} fois', food.frequency, { n: food.frequency })}</span>
        {food.lastUsed && <span>• {t('Dernier :')} {new Date(food.lastUsed).toLocaleDateString(locale())}</span>}
      </div>

      {(onEdit || onDelete) && (
        <div className="food-actions">
          {onEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(food)}>
              {ti('✏️ Modifier')}
            </button>
          )}
          {onDelete && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(food)}>
              {ti('🗑️ Supprimer')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}