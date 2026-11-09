import { useState, useEffect } from 'react';
import type { Food } from '../types';
import { getAllFoods, createFood, updateFood, deleteFood } from '../db';
import { FoodCard } from '../components/FoodCard';
import { FoodForm } from '../components/FoodForm';
import { showToast } from '../utils/toast';
import { pickMessage } from '../utils/messages';
import './Library.css';

export function Library() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'generic'>('mine');
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Food | null>(null);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    try {
      const allFoods = await getAllFoods();
      setFoods(allFoods);
    } catch (error) {
      console.error('Erreur lors du chargement des aliments:', error);
    }
  };

  const handleCreateFood = () => {
    setEditingFood(null);
    setShowForm(true);
  };

  const handleEditFood = (food: Food) => {
    setEditingFood(food);
    setShowForm(true);
  };

  const handleSaveFood = async (foodData: Omit<Food, 'id' | 'frequency' | 'lastUsed' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();

      if (editingFood) {
        // Mise à jour
        await updateFood(editingFood.id, {
          ...foodData,
          updatedAt: now
        });
      } else {
        // Création
        const newFood: Food = {
          ...foodData,
          id: crypto.randomUUID(),
          frequency: 0,
          lastUsed: '',
          createdAt: now,
          updatedAt: now
        };
        await createFood(newFood);
        showToast(pickMessage('newFood'));
      }

      await loadFoods();
      setShowForm(false);
      setEditingFood(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'aliment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = (food: Food) => {
    setShowDeleteConfirm(food);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteFood(showDeleteConfirm.id);
      await loadFoods();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'aliment');
    }
  };

  const filteredFoods = foods.filter(food => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = food.name.toLowerCase().includes(query) ||
                         (food.brand?.toLowerCase().includes(query) ?? false);

    if (activeTab === 'mine') {
      return matchesSearch && food.source === 'étiquette';
    } else {
      return matchesSearch && food.source === 'estimation';
    }
  });

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>📚 Bibliothèque</h1>
        <button className="btn btn-primary" onClick={handleCreateFood}>
          + Nouvel aliment
        </button>
      </div>

      <div className="library-tabs">
        <button
          className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          Mes aliments ({foods.filter(f => f.source === 'étiquette').length})
        </button>
        <button
          className={`tab ${activeTab === 'generic' ? 'active' : ''}`}
          onClick={() => setActiveTab('generic')}
        >
          Génériques ({foods.filter(f => f.source === 'estimation').length})
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher par nom ou marque..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="foods-list">
        {filteredFoods.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <p>Aucun aliment trouvé pour « {searchQuery} »</p>
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Effacer la recherche
                </button>
              </>
            ) : (
              <>
                <p>Aucun aliment dans cette catégorie</p>
                {activeTab === 'mine' && (
                  <button className="btn btn-primary" onClick={handleCreateFood}>
                    Créer mon premier aliment
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          filteredFoods.map(food => (
            <FoodCard
              key={food.id}
              food={food}
              onEdit={handleEditFood}
              onDelete={handleDeleteFood}
              showSource={false}
            />
          ))
        )}
      </div>

      {showForm && (
        <FoodForm
          initialFood={editingFood}
          onSave={handleSaveFood}
          onCancel={() => {
            setShowForm(false);
            setEditingFood(null);
          }}
          isLoading={isLoading}
        />
      )}

      {showDeleteConfirm && (
        <div className="food-form-overlay">
          <div className="confirm-modal">
            <h3>Supprimer cet aliment ?</h3>
            <p>
              <strong>{showDeleteConfirm.name}</strong>
              {showDeleteConfirm.brand && ` (${showDeleteConfirm.brand})`}
            </p>
            <p className="warning">
              ⚠️ Cette action est irréversible. L'historique qui utilise cet aliment ne sera pas supprimé.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}