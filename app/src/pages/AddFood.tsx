import { useState, useEffect } from 'react';
import type { Food, JournalEntry, CalculationType, MealType } from '../types';
import { ONE_OFF_FOOD_ID } from '../types';
import type { QuickEntryData } from '../components/QuickEntry';
import { getAllFoods, createFood, createJournalEntry, updateFood } from '../db';
import { FoodSelector } from '../components/FoodSelector';
import { FoodForm } from '../components/FoodForm';
import { QuantityEntry } from '../components/QuantityEntry';
import { convertPortionToGrams, calculateNutrition } from '../utils/calculations';
import type { GenericFood } from '../data/genericFoods';
import { showToast } from '../utils/toast';
import { pickMessage } from '../utils/messages';
import './AddFood.css';
import { t } from '../i18n';

interface AddFoodProps {
  onComplete?: () => void;
}

export function AddFood({ onComplete }: AddFoodProps) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState<string | undefined>();

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

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleSelectGeneric = async (generic: GenericFood) => {
    // Convertir l'aliment générique en Food et l'ajouter à la bibliothèque
    const now = new Date().toISOString();
    const newFood: Food = {
      id: crypto.randomUUID(),
      name: generic.name,
      kcal_per_100g: generic.kcal,
      protein: generic.protein,
      carbs: generic.carbs,
      fat: generic.fat,
      sugars: generic.sugars,
      fiber: generic.fiber,
      salt: generic.salt,
      sodium: generic.salt ? Math.round(generic.salt * 400) : undefined,
      source: 'estimation',
      portions: [],
      frequency: 1,
      lastUsed: now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    try {
      await createFood(newFood);
      await loadFoods();
      setSelectedFood(newFood);
      showToast(pickMessage('newFood'));
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'aliment générique:', error);
      alert(t('Erreur lors de l\'ajout de l\'aliment'));
    }
  };

  const handleCreateNew = () => {
    setPrefillBarcode(undefined);
    setShowCreateForm(true);
  };

  const handleScanNotFound = (barcode: string) => {
    // Code-barres inconnu → ouvrir le formulaire pré-rempli avec le code
    setPrefillBarcode(barcode);
    setShowCreateForm(true);
  };

  const handleSaveNewFood = async (foodData: Omit<Food, 'id' | 'frequency' | 'lastUsed' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newFood: Food = {
        ...foodData,
        id: crypto.randomUUID(),
        frequency: 0,
        lastUsed: '',
        createdAt: now,
        updatedAt: now
      };
      await createFood(newFood);
      await loadFoods();
      setShowCreateForm(false);

      // Sélectionner automatiquement l'aliment créé
      setSelectedFood(newFood);
      showToast(pickMessage('newFood'));
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert(t('Erreur lors de la création de l\'aliment'));
    }
  };

  const handleSaveQuantity = async (entryData: {
    quantity: number;
    unit: string;
    meal: MealType;
    calculation?: {
      type: CalculationType;
      values: number[];
      description: string;
    };
  }) => {
    if (!selectedFood) return;

    try {
      // Calculer les valeurs nutritionnelles
      let gramsForCalculation = entryData.quantity;

      // Si c'est une portion personnalisée, convertir en grammes
      if (entryData.unit !== 'g' && entryData.unit !== 'ml' && selectedFood.portions) {
        const grams = convertPortionToGrams(entryData.quantity, entryData.unit, selectedFood.portions);
        if (grams !== null) {
          gramsForCalculation = grams;
        }
      }

      const nutrition = calculateNutrition(selectedFood, gramsForCalculation);

      // Créer l'entrée dans le journal
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = now.toTimeString().slice(0, 5);
      const nowISO = now.toISOString();

      const journalEntry: JournalEntry = {
        id: crypto.randomUUID(),
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        foodSource: selectedFood.source,
        date: today,
        time,
        meal: entryData.meal,
        quantity: entryData.quantity,
        unit: entryData.unit,
        calculation: entryData.calculation,
        kcal: nutrition.kcal,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        sodium: nutrition.sodium,
        potassium: nutrition.potassium,
        createdAt: nowISO,
        updatedAt: nowISO
      };

      await createJournalEntry(journalEntry);

      // Mettre à jour la fréquence de l'aliment
      await updateFood(selectedFood.id, {
        frequency: selectedFood.frequency + 1,
        lastUsed: today,
        updatedAt: nowISO
      });

      showToast(pickMessage('entryAdded'));

      // Retour à Today
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(t('Erreur lors de l\'ajout au journal'));
    }
  };

  const handleSaveOneOff = async (data: QuickEntryData) => {
    try {
      const now = new Date();
      const nowISO = now.toISOString();
      const nutrition = calculateNutrition(data.values, data.quantity);

      await createJournalEntry({
        id: crypto.randomUUID(),
        foodId: ONE_OFF_FOOD_ID,
        foodName: data.name,
        foodSource: 'estimation',
        date: nowISO.split('T')[0],
        time: now.toTimeString().slice(0, 5),
        meal: data.meal,
        quantity: data.quantity,
        unit: data.unit,
        oneOff: data.values,
        kcal: nutrition.kcal,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        sodium: nutrition.sodium,
        potassium: nutrition.potassium,
        createdAt: nowISO,
        updatedAt: nowISO
      });

      showToast(pickMessage('oneOff'));
      onComplete?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajout ponctuel:', error);
      alert(t('Erreur lors de l\'ajout au journal'));
    }
  };

  if (showCreateForm) {
    return (
      <FoodForm
        onSave={handleSaveNewFood}
        onCancel={() => {
          setShowCreateForm(false);
          setPrefillBarcode(undefined);
        }}
        initialBarcode={prefillBarcode}
      />
    );
  }

  if (selectedFood) {
    return (
      <QuantityEntry
        food={selectedFood}
        onSave={handleSaveQuantity}
        onCancel={() => setSelectedFood(null)}
      />
    );
  }

  return (
    <div className="add-food-page">
      <FoodSelector
        foods={foods}
        onSelectFood={handleSelectFood}
        onCreateNew={handleCreateNew}
        onSelectGeneric={handleSelectGeneric}
        onScanNotFound={handleScanNotFound}
        onSaveOneOff={handleSaveOneOff}
        onClose={() => onComplete?.()}
      />
    </div>
  );
}