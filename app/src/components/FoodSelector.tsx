import { useState, useMemo } from 'react';
import type { Food } from '../types';
import { FoodCard } from './FoodCard';
import { BarcodeScanner } from './BarcodeScanner';
import { QuickEntry, type QuickEntryData } from './QuickEntry';
import { foodDisplayName, GENERIC_FOODS, GENERIC_CATEGORIES, searchGenericFoods, type GenericFood } from '../data/genericFoods';
import './FoodSelector.css';
import { t, unitLabel } from '../i18n';
import { ti, Icon } from './Icon';

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
    .sort((a, b) => b.frequency - a.frequency || (b.lastUsed ?? '').localeCompare(a.lastUsed ?? ''))
    .slice(0, 20);

  const frequentButton = (food: Food) => (
    <button key={food.id} type="button" className="frequent-food" onClick={() => onSelectFood(food)}>
      <span><strong>{foodDisplayName(food.name, food.source)}</strong>{food.brand && <small>{food.brand}</small>}</span>
      <span aria-hidden="true">+</span>
    </button>
  );

  // Résultats de recherche dans les aliments personnels
  const personalResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return foods.filter(food =>
      food.name.toLowerCase().includes(query) ||
      foodDisplayName(food.name, food.source).toLowerCase().includes(query) ||
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
        <h2>{t('Ajouter un aliment')}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="selector-tabs">
        <button
          className={`tab ${activeTab === 'frequent' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequent')}
        >
          {ti('⭐ Fréquents')}
        </button>
        <button
          className={`tab ${activeTab === 'oneoff' ? 'active' : ''}`}
          onClick={() => setActiveTab('oneoff')}
        >
          {ti('⚡ Ponctuel')}
        </button>
        <button
          className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          {ti('📱 Scanner')}
        </button>
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          {ti('🔍 Rechercher')}
        </button>
      </div>

      <div className="selector-content">
        {/* Onglet Fréquents */}
        {activeTab === 'frequent' && (
          <div className="frequent-tab">
            <div className="tab-header">
              <h3>{t('Aliments les plus utilisés')}</h3>
            </div>
            {frequentFoods.length === 0 ? (
              <div className="empty-state">
                <p>{t('Aucun aliment utilisé pour le moment')}</p>
                <p className="hint">{t('Utilise l\'onglet Rechercher pour trouver un aliment dans la base générique')}</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                  {ti('🔍 Rechercher un aliment')}
                </button>
              </div>
            ) : (
              <>
                <div className="frequent-foods">{frequentFoods.slice(0, 6).map(frequentButton)}</div>
                {frequentFoods.length > 6 && (
                  <details className="settings-group frequent-more">
                    <summary>{t('Plus d’aliments fréquents')}</summary>
                    <div className="settings-group-content frequent-foods">{frequentFoods.slice(6).map(frequentButton)}</div>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* Onglet Ponctuel */}
        {activeTab === 'oneoff' && <QuickEntry onSave={onSaveOneOff} />}

        {/* Onglet Scanner */}
        {activeTab === 'scan' && (
          <div className="scan-tab">
            <div className="tab-header">
              <h3>{t('Scanner un code-barres')}</h3>
            </div>
            <div className="scan-cta">
              <div className="scan-icon"><Icon name="scan" /></div>
              <p>{t('Scanne l\'emballage d\'un produit')}</p>
              <button className="btn btn-primary btn-lg" onClick={() => setShowScanner(true)}>
                {ti('🎥 Ouvrir la caméra')}
              </button>
              <p className="hint">{t('Si l\'aliment est déjà dans ta bibliothèque, il sera proposé directement')}</p>
            </div>
          </div>
        )}

        {/* Onglet Rechercher */}
        {activeTab === 'search' && (
          <div className="search-tab">
            <div className="search-input-container">
              <input
                type="text"
                placeholder={t('Rechercher un aliment...')}
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
                    {t('Tous ({n})', { n: GENERIC_FOODS.length })}
                  </button>
                  {GENERIC_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {t(cat)}
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
                        <span className="generic-name">{t(gf.name)}</span>
                        <span className="generic-kcal">{gf.kcal} {unitLabel('kcal')}/100{unitLabel('g')}</span>
                      </div>
                      <span className="generic-add">+</span>
                    </div>
                  ))}
                </div>
              </>
            ) : !hasResults ? (
              <div className="empty-state">
                <p>{t('Aucun résultat pour « {query} »', { query: searchQuery })}</p>
                <button className="btn btn-primary" onClick={onCreateNew}>
                  {t('Créer cet aliment')}
                </button>
              </div>
            ) : (
              <div className="search-results">
                {/* Mes aliments */}
                {personalResults.length > 0 && (
                  <>
                    <h4 className="results-section-title">{ti('📚 Mes aliments')}</h4>
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
                    <h4 className="results-section-title">{ti('🌍 Base générique')}</h4>
                    <div className="generic-foods-list">
                      {genericResults.map((gf, idx) => (
                        <div
                          key={idx}
                          className="generic-food-item"
                          onClick={() => onSelectGeneric(gf)}
                        >
                          <div className="generic-food-info">
                            <span className="generic-name">{t(gf.name)}</span>
                            <span className="generic-kcal">{gf.kcal} {unitLabel('kcal')}/100{unitLabel('g')}</span>
                          </div>
                          <span className="generic-add">+</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {personalResults.length === 0 && genericResults.length > 0 && (
                  <div className="create-hint">
                    <p>{t('Pas dans ma bibliothèque ?')}</p>
                    <button className="btn btn-secondary" onClick={onCreateNew}>
                      {t('+ Créer « {query} » manuellement', { query: searchQuery })}
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
            {t('+ Créer un nouvel aliment')}
          </button>
        </div>
      )}
    </div>
  );
}
