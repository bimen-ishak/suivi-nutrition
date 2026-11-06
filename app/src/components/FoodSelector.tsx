import { useState, useMemo } from 'react';
import type { Food } from '../types';
import { FoodCard } from './FoodCard';
import { BarcodeScanner } from './BarcodeScanner';
import { QuickEntry, type QuickEntryData } from './QuickEntry';
import { GENERIC_FOODS, GENERIC_CATEGORIES, searchGenericFoods, type GenericFood } from '../data/genericFoods';
import './FoodSelector.css';

export type SelectorTab = 'frequent' | 'oneoff' | 'scan' | 'search';

interface FoodSelectorProps {
  foods: Food[];
  onSelectFood: (food: Food) => void;
  onCreateNew: () => void;
  onSelectGeneric: (generic: GenericFood) => void;
  onScanNotFound: (barcode: string) => void;
  onSaveOneOff: (data: QuickEntryData) => void;
  onClose: () => void;
}

export function FoodSelector({ foods, onSelectFood, onCreateNew, onSelectGeneric, onScanNotFound, onSaveOneOff, onClose }: FoodSelectorProps) {
  const [activeTab, setActiveTab] = useState<SelectorTab>('frequent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Filtrer les aliments fréquents (triés par fréquence)
  const frequentFoods = foods
    .filter(f => f.frequency > 0)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);

  // Résultats de recherche dans les aliments personnels
  const personalResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return foods.filter(food =>
      food.name.toLowerCase().includes(query) ||
      (food.brand?.toLowerCase().includes(query) ?? false)
    );
  }, [searchQuery, foods]);

  // Résultats de recherche dans la base générique
  const genericResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchGenericFoods(searchQuery);
  }, [searchQuery]);

  // Aliments génériques filtrés par catégorie (quand pas de recherche)
  const genericByCategory = useMemo(() => {
    if (searchQuery.trim()) return [];
    if (selectedCategory) {
      return GENERIC_FOODS.filter(f => f.category === selectedCategory);
    }
    return GENERIC_FOODS;
  }, [searchQuery, selectedCategory]);

  const hasResults = personalResults.length > 0 || genericResults.length > 0;

  // Si le scanner est actif, l'afficher à la place
  if (showScanner) {
    return (
      <BarcodeScanner
        onScanSuccess={(food) => {
          setShowScanner(false);
          onSelectFood(food);
        }}
        onScanNotFound={(barcode) => {
          setShowScanner(false);
          onScanNotFound(barcode);
        }}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div className="food-selector">
      <div className="selector-header">
        <h2>Ajouter un aliment</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="selector-tabs">
        <button
          className={`tab ${activeTab === 'frequent' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequent')}
        >
          ⭐ Fréquents
        </button>
        <button
          className={`tab ${activeTab === 'oneoff' ? 'active' : ''}`}
          onClick={() => setActiveTab('oneoff')}
        >
          ⚡ Ponctuel
        </button>
        <button
          className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          📱 Scanner
        </button>
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Rechercher
        </button>
      </div>

      <div className="selector-content">
        {/* Onglet Fréquents */}
        {activeTab === 'frequent' && (
          <div className="frequent-tab">
            <div className="tab-header">
              <h3>Aliments les plus utilisés</h3>
            </div>
            {frequentFoods.length === 0 ? (
              <div className="empty-state">
                <p>Aucun aliment utilisé pour le moment</p>
                <p className="hint">Utilise l'onglet Rechercher pour trouver un aliment dans la base générique</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                  🔍 Rechercher un aliment
                </button>
              </div>
            ) : (
              <div className="foods-list">
                {frequentFoods.map(food => (
                  <div key={food.id} onClick={() => onSelectFood(food)}>
                    <FoodCard food={food} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet Ponctuel */}
        {activeTab === 'oneoff' && <QuickEntry onSave={onSaveOneOff} />}

        {/* Onglet Scanner */}
        {activeTab === 'scan' && (
          <div className="scan-tab">
            <div className="tab-header">
              <h3>Scanner un code-barres</h3>
            </div>
            <div className="scan-cta">
              <div className="scan-icon">📱</div>
              <p>Scanne l'emballage d'un produit</p>
              <button className="btn btn-primary btn-lg" onClick={() => setShowScanner(true)}>
                🎥 Ouvrir la caméra
              </button>
              <p className="hint">Si l'aliment est déjà dans ta bibliothèque, il sera proposé directement</p>
            </div>
          </div>
        )}

        {/* Onglet Rechercher */}
        {activeTab === 'search' && (
          <div className="search-tab">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="🔍 Rechercher un aliment..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                }}
                autoFocus
              />
            </div>

            {searchQuery.trim() === '' ? (
              <>
                {/* Catégories de la base générique */}
                <div className="category-chips">
                  <button
                    className={`chip ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Tous ({GENERIC_FOODS.length})
                  </button>
                  {GENERIC_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Liste des aliments génériques */}
                <div className="generic-foods-list">
                  {genericByCategory.slice(0, 100).map((gf, idx) => (
                    <div
                      key={idx}
                      className="generic-food-item"
                      onClick={() => onSelectGeneric(gf)}
                    >
                      <div className="generic-food-info">
                        <span className="generic-name">{gf.name}</span>
                        <span className="generic-kcal">{gf.kcal} kcal/100g</span>
                      </div>
                      <span className="generic-add">+</span>
                    </div>
                  ))}
                </div>
              </>
            ) : !hasResults ? (
              <div className="empty-state">
                <p>Aucun résultat pour « {searchQuery} »</p>
                <button className="btn btn-primary" onClick={onCreateNew}>
                  Créer cet aliment
                </button>
              </div>
            ) : (
              <div className="search-results">
                {/* Mes aliments */}
                {personalResults.length > 0 && (
                  <>
                    <h4 className="results-section-title">📚 Mes aliments</h4>
                    <div className="foods-list">
                      {personalResults.map(food => (
                        <div key={food.id} onClick={() => onSelectFood(food)}>
                          <FoodCard food={food} compact />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Base générique */}
                {genericResults.length > 0 && (
                  <>
                    <h4 className="results-section-title">🌍 Base générique</h4>
                    <div className="generic-foods-list">
                      {genericResults.map((gf, idx) => (
                        <div
                          key={idx}
                          className="generic-food-item"
                          onClick={() => onSelectGeneric(gf)}
                        >
                          <div className="generic-food-info">
                            <span className="generic-name">{gf.name}</span>
                            <span className="generic-kcal">{gf.kcal} kcal/100g</span>
                          </div>
                          <span className="generic-add">+</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {personalResults.length === 0 && genericResults.length > 0 && (
                  <div className="create-hint">
                    <p>Pas dans ma bibliothèque ?</p>
                    <button className="btn btn-secondary" onClick={onCreateNew}>
                      + Créer « {searchQuery} » manuellement
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {activeTab !== 'oneoff' && (
        <div className="selector-footer">
          <button className="btn btn-secondary btn-block" onClick={onCreateNew}>
            + Créer un nouvel aliment
          </button>
        </div>
      )}
    </div>
  );
}
