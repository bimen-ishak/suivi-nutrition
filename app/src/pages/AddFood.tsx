import { useState, useEffect } from 'react';
import type { Food, JournalEntry, CalculationType, MealType, MealTemplate } from '../types';
import { ONE_OFF_FOOD_ID } from '../types';
import type { QuickEntryData } from '../components/QuickEntry';
import { getAllFoods, createFood, createJournalEntry, updateFood } from '../db';
import { FoodSelector } from '../components/FoodSelector';
import { FoodForm } from '../components/FoodForm';
import { QuantityEntry } from '../components/QuantityEntry';
import { MealTemplateList } from '../components/MealTemplateList';
import { convertPortionToGrams, calculateNutrition } from '../utils/calculations';
import type { GenericFood } from '../data/genericFoods';
import './AddFood.css';

interface AddFoodProps {
  onComplete?: () => void;
}

export function AddFood({ onComplete }: AddFoodProps) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prefillBarcode, setPrefillBarcode] = useState<string | undefined>();
  const [showTemplates, setShowTemplates] = useState(false);

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
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'aliment générique:', error);
      alert('Erreur lors de l\'ajout de l\'aliment');
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
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l\'aliment');
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

      // Retour à Today
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de l\'ajout au journal');
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
        createdAt: nowISO,
        updatedAt: nowISO
      });

      onComplete?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajout ponctuel:', error);
      alert('Erreur lors de l\'ajout au journal');
    }
  };

  const handleSelectTemplate = async (template: MealTemplate, foodsMap: Map<string, Food>) => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = now.toTimeString().slice(0, 5);
      const nowISO = now.toISOString();

      // Ajouter tous les items du template au journal
      for (const item of template.items) {
        const food = foodsMap.get(item.foodId);
        if (!food) continue;

        // Calculer les valeurs nutritionnelles
        let gramsForCalculation = item.quantity;
        if (item.unit !== 'g' && item.unit !== 'ml' && food.portions) {
          const grams = convertPortionToGrams(item.quantity, item.unit, food.portions);
          if (grams !== null) {
            gramsForCalculation = grams;
          }
        }

        const nutrition = calculateNutrition(food, gramsForCalculation);

        const journalEntry: JournalEntry = {
          id: crypto.randomUUID(),
          foodId: food.id,
          foodName: food.name,
          foodSource: food.source,
          date: today,
          time,
          meal: template.meal,
          quantity: item.quantity,
          unit: item.unit,
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
        await updateFood(food.id, {
          frequency: food.frequency + 1,
          lastUsed: today,
          updatedAt: nowISO
        });
      }

      // Retour à Today
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du repas type:', error);
      alert('Erreur lors de l\'ajout du repas type');
    }
  };

  if (showTemplates) {
    return (
      <div className="add-food-page templates-view">
        <div className="page-header">
          <button className="back-btn" onClick={() => setShowTemplates(false)}>← Retour</button>
          <h2>Repas types</h2>
        </div>
        <MealTemplateList
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    );
  }

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
        onShowTemplates={() => setShowTemplates(true)}
        onSaveOneOff={handleSaveOneOff}
        onClose={() => onComplete?.()}
      />
    </div>
  );
}