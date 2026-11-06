import { useState, useEffect } from 'react';
import type { MealTemplate } from '../types';
import { getAllMealTemplates, deleteMealTemplate, getFood } from '../db';
import './MealTemplateList.css';

interface MealTemplateListProps {
  onSelectTemplate: (template: MealTemplate, foods: Map<string, import('../types').Food>) => void;
  onCreateFromEntries?: () => void;
  canCreate?: boolean;
}

export function MealTemplateList({ onSelectTemplate, onCreateFromEntries, canCreate }: MealTemplateListProps) {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const all = await getAllMealTemplates();
      setTemplates(all);
    } catch (error) {
      console.error('Erreur chargement repas types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce repas type ?')) return;
    await deleteMealTemplate(id);
    await loadTemplates();
  };

  const handleSelect = async (template: MealTemplate) => {
    // Charger les aliments du template
    const foodsMap = new Map<string, import('../types').Food>();
    for (const item of template.items) {
      const food = await getFood(item.foodId);
      if (food) foodsMap.set(item.foodId, food);
    }
    onSelectTemplate(template, foodsMap);
  };

  if (loading) {
    return <div className="templates-loading">Chargement...</div>;
  }

  return (
    <div className="meal-template-list">
      <div className="tab-header">
        <h3>Repas types enregistrés</h3>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state">
          <p>🍽️ Aucun repas type enregistré</p>
          <p className="hint">
            Enregistre tes repas récurrents depuis l'écran Aujourd'hui
            (bouton 💾 sur un groupe de repas)
          </p>
          {canCreate && onCreateFromEntries && (
            <button className="btn btn-primary" onClick={onCreateFromEntries}>
              Créer un repas type
            </button>
          )}
        </div>
      ) : (
        <div className="templates-list">
          {templates.map(template => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => handleSelect(template)}
              >
                <div className="template-card-main">
                  <span className="template-name">{template.name}</span>
                  <span className="template-items-count">
                    {template.items.length} aliment{template.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="template-card-foods">
                  {template.items.slice(0, 3).map((item, i) => (
                    <span key={i} className="template-food-chip">
                      {item.quantity}{item.unit}
                    </span>
                  ))}
                  {template.items.length > 3 && (
                    <span className="template-food-chip">+{template.items.length - 3}</span>
                  )}
                </div>
                <button
                  className="template-delete"
                  onClick={(e) => handleDelete(template.id, e)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
