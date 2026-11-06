import type { Food } from '../types';
import './FoodCard.css';

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
          {food.barcode && <span className="food-barcode">📱 {food.barcode}</span>}
        </div>
        {showSource && (
          <span className={`food-source ${food.source}`}>
            {food.source === 'étiquette' ? '🏷️ Étiquette' : '📊 Estimation'}
          </span>
        )}
      </div>

      {!compact && (
        <div className="food-nutrition">
          <div className="nutrition-row">
            <span className="nutrition-label">Pour 100{food.baseUnit ?? 'g'} :</span>
            <span className="nutrition-value">
              <strong>{formatNumber(food.kcal_per_100g)} kcal</strong> ·
              P {formatNumber(food.protein)}g ·
              G {formatNumber(food.carbs)}g ·
              L {formatNumber(food.fat)}g
            </span>
          </div>
          {(food.sugars !== undefined || food.fiber !== undefined || food.sodium !== undefined || food.potassium !== undefined) && (
            <div className="nutrition-row detail">
              <span className="nutrition-label">Détails :</span>
              <span className="nutrition-value">
                {food.sugars !== undefined && `Sucres ${formatNumber(food.sugars)}g · `}
                {food.fiber !== undefined && `Fibres ${formatNumber(food.fiber)}g · `}
                {food.sodium !== undefined && `Na ${food.sodium}mg · `}
                {food.potassium !== undefined && `K ${food.potassium}mg`}
              </span>
            </div>
          )}
        </div>
      )}

      {!compact && food.portions.length > 0 && (
        <div className="food-portions">
          <span className="portions-label">Portions :</span>
          <div className="portions-list">
            {food.portions.map((portion, index) => (
              <span key={index} className="portion-badge">
                {portion.name} = {portion.grams}{food.baseUnit ?? 'g'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="food-meta">
        <span>Utilisé {food.frequency} fois</span>
        {food.lastUsed && <span>• Dernier : {new Date(food.lastUsed).toLocaleDateString('fr-FR')}</span>}
      </div>

      {(onEdit || onDelete) && (
        <div className="food-actions">
          {onEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(food)}>
              ✏️ Modifier
            </button>
          )}
          {onDelete && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(food)}>
              🗑️ Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}