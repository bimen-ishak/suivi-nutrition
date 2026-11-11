// Base de données générique d'aliments courants (hors ligne)
// Valeurs pour 100g - Source: tables Ciqual / OpenFoodFacts (moyennes)

import { t } from '../i18n';
import type { Food } from '../types';

export interface GenericFood {
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugars?: number;
  salt?: number;
}

export const GENERIC_FOODS: GenericFood[] = [
  // ===== FRUITS =====
  { name: 'Pomme', category: 'Fruits', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugars: 10 },
  { name: 'Banane', category: 'Fruits', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugars: 12 },
  { name: 'Orange', category: 'Fruits', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugars: 9 },
  { name: 'Fraises', category: 'Fruits', kcal: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugars: 4.9 },
  { name: 'Raisin', category: 'Fruits', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugars: 15 },
  { name: 'Pêche', category: 'Fruits', kcal: 39, protein: 0.9, carbs: 10, fat: 0.3, fiber: 1.5, sugars: 8 },
  { name: 'Poire', category: 'Fruits', kcal: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, sugars: 10 },
  { name: 'Abricot', category: 'Fruits', kcal: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2.4, sugars: 9 },
  { name: 'Cerise', category: 'Fruits', kcal: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6, sugars: 8 },
  { name: 'Kiwi', category: 'Fruits', kcal: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, sugars: 9 },
  { name: 'Ananas', category: 'Fruits', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugars: 10 },
  { name: 'Mangue', category: 'Fruits', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugars: 14 },
  { name: 'Melon', category: 'Fruits', kcal: 34, protein: 0.8, carbs: 8, fat: 0.2, fiber: 0.9, sugars: 8 },
  { name: 'Pastèque', category: 'Fruits', kcal: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, sugars: 6 },
  { name: 'Pamplemousse', category: 'Fruits', kcal: 42, protein: 0.8, carbs: 11, fat: 0.1, fiber: 1.6, sugars: 7 },
  { name: 'Citron', category: 'Fruits', kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, fiber: 2.8, sugars: 2.5 },
  { name: 'Avocat', category: 'Fruits', kcal: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugars: 0.7 },
  { name: 'Figue fraîche', category: 'Fruits', kcal: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 3, sugars: 16 },
  { name: 'Datte', category: 'Fruits', kcal: 282, protein: 2.5, carbs: 75, fat: 0.4, fiber: 8, sugars: 63 },
  { name: 'Prune', category: 'Fruits', kcal: 46, protein: 0.7, carbs: 12, fat: 0.4, fiber: 1.6, sugars: 7 },
  { name: 'Nectarine', category: 'Fruits', kcal: 44, protein: 1.1, carbs: 11, fat: 0.3, fiber: 1.7, sugars: 8 },

  // ===== LÉGUMES =====
  { name: 'Tomate', category: 'Légumes', kcal: 18, protein: 0.9, carbs: 4, fat: 0.2, fiber: 1.2, sugars: 2.6 },
  { name: 'Carotte', category: 'Légumes', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugars: 4.7 },
  { name: 'Concombre', category: 'Légumes', kcal: 15, protein: 0.7, carbs: 4, fat: 0.1, fiber: 0.5, sugars: 1.7 },
  { name: 'Salade verte', category: 'Légumes', kcal: 15, protein: 1.2, carbs: 3, fat: 0.2, fiber: 1.8, sugars: 0.8 },
  { name: 'Épinards', category: 'Légumes', kcal: 23, protein: 2.9, carbs: 4, fat: 0.4, fiber: 2.2, sugars: 0.4 },
  { name: 'Brocoli', category: 'Légumes', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugars: 1.5 },
  { name: 'Chou-fleur', category: 'Légumes', kcal: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, sugars: 1.9 },
  { name: 'Haricots verts', category: 'Légumes', kcal: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 3.4, sugars: 3 },
  { name: 'Poivron', category: 'Légumes', kcal: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugars: 4.2 },
  { name: 'Courgette', category: 'Légumes', kcal: 17, protein: 1.2, carbs: 3, fat: 0.3, fiber: 1, sugars: 2.5 },
  { name: 'Aubergine', category: 'Légumes', kcal: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, sugars: 2.7 },
  { name: 'Oignon', category: 'Légumes', kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sugars: 4.2 },
  { name: 'Ail', category: 'Légumes', kcal: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugars: 1 },
  { name: 'Champignon', category: 'Légumes', kcal: 22, protein: 3.1, carbs: 3, fat: 0.3, fiber: 1, sugars: 2 },
  { name: 'Asperge', category: 'Légumes', kcal: 20, protein: 2.2, carbs: 4, fat: 0.1, fiber: 2.1, sugars: 1.9 },
  { name: 'Maïs', category: 'Légumes', kcal: 86, protein: 3.2, carbs: 19, fat: 1.2, fiber: 2.7, sugars: 3.2 },
  { name: 'Petits pois', category: 'Légumes', kcal: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.5, sugars: 6 },
  { name: 'Pommes de terre', category: 'Légumes', kcal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugars: 0.8 },
  { name: 'Patate douce', category: 'Légumes', kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugars: 4.2 },
  { name: 'Betterave', category: 'Légumes', kcal: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8, sugars: 7 },
  { name: 'Céleri', category: 'Légumes', kcal: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6, sugars: 1.3 },
  { name: 'Radis', category: 'Légumes', kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6, sugars: 1.9 },

  // ===== VIANDES =====
  { name: 'Poulet (blanc)', category: 'Viandes', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Poulet (cuisse)', category: 'Viandes', kcal: 185, protein: 26, carbs: 0, fat: 9 },
  { name: 'Dinde', category: 'Viandes', kcal: 135, protein: 30, carbs: 0, fat: 1.5 },
  { name: 'Bœuf haché 5%', category: 'Viandes', kcal: 137, protein: 21, carbs: 0, fat: 5 },
  { name: 'Bœuf haché 15%', category: 'Viandes', kcal: 254, protein: 17, carbs: 0, fat: 20 },
  { name: 'Steak de bœuf', category: 'Viandes', kcal: 271, protein: 26, carbs: 0, fat: 19 },
  { name: 'Jambon blanc', category: 'Viandes', kcal: 107, protein: 20, carbs: 1, fat: 2.5, salt: 2.4 },
  { name: 'Jambon cru', category: 'Viandes', kcal: 250, protein: 30, carbs: 0, fat: 12, salt: 5 },
  { name: 'Saucisse', category: 'Viandes', kcal: 301, protein: 13, carbs: 1, fat: 27, salt: 2 },
  { name: 'Saucisson', category: 'Viandes', kcal: 446, protein: 24, carbs: 2, fat: 38, salt: 4.5 },
  { name: 'Lardons', category: 'Viandes', kcal: 540, protein: 17, carbs: 0, fat: 55, salt: 3.5 },
  { name: 'Veau', category: 'Viandes', kcal: 172, protein: 24, carbs: 0, fat: 8 },
  { name: 'Agneau', category: 'Viandes', kcal: 294, protein: 25, carbs: 0, fat: 21 },
  { name: 'Côte de porc', category: 'Viandes', kcal: 220, protein: 27, carbs: 0, fat: 12 },

  // ===== POISSONS & FRUITS DE MER =====
  { name: 'Saumon', category: 'Poissons', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Thon frais', category: 'Poissons', kcal: 144, protein: 30, carbs: 0, fat: 1 },
  { name: 'Thon en boîte', category: 'Poissons', kcal: 116, protein: 26, carbs: 0, fat: 1, salt: 1 },
  { name: 'Cabillaud', category: 'Poissons', kcal: 82, protein: 18, carbs: 0, fat: 0.7 },
  { name: 'Maquereau', category: 'Poissons', kcal: 305, protein: 19, carbs: 0, fat: 26 },
  { name: 'Sardine', category: 'Poissons', kcal: 208, protein: 25, carbs: 0, fat: 11 },
  { name: 'Crevettes', category: 'Poissons', kcal: 85, protein: 20, carbs: 0, fat: 0.5, salt: 1.5 },
  { name: 'Moules', category: 'Poissons', kcal: 86, protein: 12, carbs: 3, fat: 2, salt: 0.7 },
  { name: 'Saumon fumé', category: 'Poissons', kcal: 117, protein: 18, carbs: 0, fat: 4, salt: 3 },

  // ===== ŒUFS & PRODUITS LAITIERS =====
  { name: 'Œuf', category: 'Produits laitiers', kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: 'Blanc d\'œuf', category: 'Produits laitiers', kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Lait entier', category: 'Produits laitiers', kcal: 64, protein: 3.2, carbs: 4.8, fat: 3.5, sugars: 4.8 },
  { name: 'Lait demi-écrémé', category: 'Produits laitiers', kcal: 46, protein: 3.4, carbs: 4.9, fat: 1.5, sugars: 4.9 },
  { name: 'Lait écrémé', category: 'Produits laitiers', kcal: 34, protein: 3.4, carbs: 5, fat: 0.1, sugars: 5 },
  { name: 'Yaourt nature', category: 'Produits laitiers', kcal: 59, protein: 3.5, carbs: 4.7, fat: 3.3, sugars: 4.7 },
  { name: 'Fromage blanc 0%', category: 'Produits laitiers', kcal: 45, protein: 8, carbs: 4, fat: 0.2 },
  { name: 'Fromage blanc 20%', category: 'Produits laitiers', kcal: 108, protein: 8, carbs: 4, fat: 7 },
  { name: 'Emmental', category: 'Produits laitiers', kcal: 380, protein: 27, carbs: 0.3, fat: 29, salt: 0.7 },
  { name: 'Camembert', category: 'Produits laitiers', kcal: 300, protein: 20, carbs: 0.5, fat: 24, salt: 2 },
  { name: 'Chèvre frais', category: 'Produits laitiers', kcal: 174, protein: 11, carbs: 2.5, fat: 14, salt: 1.2 },
  { name: 'Mozzarella', category: 'Produits laitiers', kcal: 280, protein: 18, carbs: 3, fat: 22, salt: 1.5 },
  { name: 'Beurre', category: 'Produits laitiers', kcal: 748, protein: 0.9, carbs: 0.8, fat: 83, salt: 0.8 },
  { name: 'Crème fraîche 30%', category: 'Produits laitiers', kcal: 300, protein: 2.1, carbs: 3.5, fat: 32 },
  { name: 'Crème liquide 15%', category: 'Produits laitiers', kcal: 150, protein: 2.5, carbs: 3.6, fat: 15 },

  // ===== CÉRÉALES & FÉCULENTS =====
  { name: 'Riz blanc cuit', category: 'Féculents', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: 'Riz complet cuit', category: 'Féculents', kcal: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8 },
  { name: 'Pâtes cuites', category: 'Féculents', kcal: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  { name: 'Pâtes complètes cuites', category: 'Féculents', kcal: 124, protein: 5, carbs: 23, fat: 1, fiber: 3.5 },
  { name: 'Pain blanc', category: 'Féculents', kcal: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, salt: 1.3 },
  { name: 'Pain complet', category: 'Féculents', kcal: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, salt: 1.2 },
  { name: 'Baguette', category: 'Féculents', kcal: 278, protein: 9, carbs: 56, fat: 1.4, fiber: 3, salt: 1.5 },
  { name: 'Pain de mie', category: 'Féculents', kcal: 264, protein: 8, carbs: 49, fat: 3, fiber: 3, salt: 1.1 },
  { name: 'Flocons d\'avoine', category: 'Féculents', kcal: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  { name: 'Muesli', category: 'Féculents', kcal: 380, protein: 10, carbs: 65, fat: 8, fiber: 6, sugars: 25 },
  { name: 'Céréales chocolatées', category: 'Féculents', kcal: 380, protein: 7, carbs: 80, fat: 3, fiber: 4, sugars: 35, salt: 0.5 },
  { name: 'Corn flakes', category: 'Féculents', kcal: 357, protein: 7, carbs: 84, fat: 0.4, fiber: 3, sugars: 8, salt: 1 },
  { name: 'Quinoa cuit', category: 'Féculents', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { name: 'Boulgour cuit', category: 'Féculents', kcal: 83, protein: 3, carbs: 18, fat: 0.2, fiber: 4 },
  { name: 'Semoule cuite', category: 'Féculents', kcal: 119, protein: 4, carbs: 24, fat: 0.2, fiber: 1.5 },
  { name: 'Lentilles cuites', category: 'Féculents', kcal: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { name: 'Haricots rouges cuits', category: 'Féculents', kcal: 127, protein: 9, carbs: 23, fat: 0.5, fiber: 6.4 },
  { name: 'Pois chiches cuits', category: 'Féculents', kcal: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { name: 'Pain à hamburger', category: 'Féculents', kcal: 275, protein: 9, carbs: 51, fat: 4.5, fiber: 3, salt: 1.1 },
  { name: 'Tortilla blé', category: 'Féculents', kcal: 312, protein: 8, carbs: 52, fat: 8, fiber: 3.5, salt: 1.2 },
  { name: 'Purée de pommes de terre', category: 'Féculents', kcal: 88, protein: 2, carbs: 16, fat: 2.5, fiber: 1.5 },
  { name: 'Frites', category: 'Féculents', kcal: 312, protein: 3.4, carbs: 41, fat: 15, salt: 1.5 },

  // ===== LÉGUMINEUSES =====
  { name: 'Lentilles sèches', category: 'Légumineuses', kcal: 353, protein: 25, carbs: 63, fat: 1.1, fiber: 11 },
  { name: 'Pois chiches secs', category: 'Légumineuses', kcal: 364, protein: 19, carbs: 61, fat: 6, fiber: 17 },
  { name: 'Haricots blancs secs', category: 'Légumineuses', kcal: 333, protein: 22, carbs: 60, fat: 1.5, fiber: 15 },

  // ===== PAINS SPÉCIAUX & VIENNOISERIES =====
  { name: 'Croissant', category: 'Viennoiseries', kcal: 406, protein: 8, carbs: 46, fat: 21, salt: 1 },
  { name: 'Pain au chocolat', category: 'Viennoiseries', kcal: 407, protein: 8, carbs: 47, fat: 21, salt: 1 },
  { name: 'Brioche', category: 'Viennoiseries', kcal: 375, protein: 8, carbs: 50, fat: 16, sugars: 12, salt: 0.8 },
  { name: 'Gaufre', category: 'Viennoiseries', kcal: 291, protein: 6, carbs: 46, fat: 9, sugars: 5, salt: 0.5 },
  { name: 'Crêpe nature', category: 'Viennoiseries', kcal: 215, protein: 6, carbs: 33, fat: 6, sugars: 3, salt: 0.6 },

  // ===== PRODUITS SUCRÉS =====
  { name: 'Sucre blanc', category: 'Sucré', kcal: 387, protein: 0, carbs: 100, fat: 0, sugars: 100 },
  { name: 'Miel', category: 'Sucré', kcal: 304, protein: 0.3, carbs: 82, fat: 0, sugars: 82 },
  { name: 'Confiture', category: 'Sucré', kcal: 250, protein: 0.5, carbs: 65, fat: 0.1, sugars: 60 },
  { name: 'Nutella', category: 'Sucré', kcal: 539, protein: 6, carbs: 58, fat: 31, sugars: 56, salt: 0.1 },
  { name: 'Chocolat au lait', category: 'Sucré', kcal: 535, protein: 7, carbs: 59, fat: 29, sugars: 52, salt: 0.3 },
  { name: 'Chocolat noir 70%', category: 'Sucré', kcal: 598, protein: 8, carbs: 43, fat: 43, sugars: 24, salt: 0.1 },
  { name: 'Bonbon', category: 'Sucré', kcal: 380, protein: 0, carbs: 95, fat: 0.5, sugars: 70 },
  { name: 'Gâteau au chocolat', category: 'Sucré', kcal: 370, protein: 5, carbs: 50, fat: 17, sugars: 35, salt: 0.4 },
  { name: 'Tarte aux pommes', category: 'Sucré', kcal: 265, protein: 3, carbs: 38, fat: 12, sugars: 25, salt: 0.3 },
  { name: 'Cookie', category: 'Sucré', kcal: 488, protein: 6, carbs: 65, fat: 22, sugars: 35, salt: 0.5 },
  { name: 'Madeleine', category: 'Sucré', kcal: 433, protein: 7, carbs: 56, fat: 19, sugars: 30, salt: 0.5 },
  { name: 'Glace vanille', category: 'Sucré', kcal: 207, protein: 3.5, carbs: 24, fat: 11, sugars: 21, salt: 0.1 },
  { name: 'Sorbet citron', category: 'Sucré', kcal: 130, protein: 0.5, carbs: 33, fat: 0, sugars: 28 },

  // ===== SNACKS SALÉS =====
  { name: 'Chips nature', category: 'Snacks', kcal: 536, protein: 7, carbs: 53, fat: 34, salt: 1.5 },
  { name: 'Chips barbecue', category: 'Snacks', kcal: 520, protein: 7, carbs: 55, fat: 30, salt: 2 },
  { name: 'Cacahuètes', category: 'Snacks', kcal: 567, protein: 26, carbs: 16, fat: 49, fiber: 8, salt: 0.5 },
  { name: 'Amandes', category: 'Snacks', kcal: 579, protein: 21, carbs: 22, fat: 50, fiber: 12 },
  { name: 'Noix', category: 'Snacks', kcal: 654, protein: 15, carbs: 14, fat: 65, fiber: 7 },
  { name: 'Noisettes', category: 'Snacks', kcal: 628, protein: 15, carbs: 17, fat: 61, fiber: 10 },
  { name: 'Pistaches', category: 'Snacks', kcal: 562, protein: 20, carbs: 28, fat: 46, fiber: 10, salt: 0.5 },
  { name: 'Popcorn', category: 'Snacks', kcal: 387, protein: 13, carbs: 78, fat: 4, fiber: 14, salt: 0.8 },
  { name: 'Barre de céréales', category: 'Snacks', kcal: 450, protein: 8, carbs: 65, fat: 14, sugars: 25, salt: 0.3 },
  { name: 'Biscuit apéritif', category: 'Snacks', kcal: 500, protein: 8, carbs: 60, fat: 25, salt: 2.5 },
  { name: 'Olives vertes', category: 'Snacks', kcal: 145, protein: 1.1, carbs: 4, fat: 15, salt: 3 },
  { name: 'Cornichon', category: 'Snacks', kcal: 20, protein: 0.9, carbs: 4, fat: 0.1, salt: 4 },

  // ===== BOISSONS =====
  { name: 'Café noir', category: 'Boissons', kcal: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Café au lait', category: 'Boissons', kcal: 42, protein: 2.5, carbs: 3.5, fat: 2.5, sugars: 3 },
  { name: 'Thé nature', category: 'Boissons', kcal: 1, protein: 0, carbs: 0.3, fat: 0 },
  { name: 'Jus d\'orange', category: 'Boissons', kcal: 45, protein: 0.7, carbs: 11, fat: 0.2, sugars: 8 },
  { name: 'Jus de pomme', category: 'Boissons', kcal: 46, protein: 0.1, carbs: 11, fat: 0.1, sugars: 10 },
  { name: 'Jus d\'ananas', category: 'Boissons', kcal: 53, protein: 0.5, carbs: 13, fat: 0.1, sugars: 10 },
  { name: 'Soda cola', category: 'Boissons', kcal: 42, protein: 0, carbs: 11, fat: 0, sugars: 11 },
  { name: 'Soda light', category: 'Boissons', kcal: 1, protein: 0, carbs: 0.1, fat: 0, sugars: 0 },
  { name: 'Eau gazeuse', category: 'Boissons', kcal: 0, protein: 0, carbs: 0, fat: 0 },
  { name: 'Bière', category: 'Boissons', kcal: 43, protein: 0.5, carbs: 3.6, fat: 0 },
  { name: 'Vin rouge', category: 'Boissons', kcal: 85, protein: 0.1, carbs: 2.6, fat: 0 },
  { name: 'Limonade', category: 'Boissons', kcal: 40, protein: 0, carbs: 10, fat: 0, sugars: 10 },
  { name: 'Jus de tomate', category: 'Boissons', kcal: 17, protein: 0.8, carbs: 4, fat: 0.1, salt: 0.5 },
  { name: 'Smoothie fruits', category: 'Boissons', kcal: 60, protein: 1, carbs: 14, fat: 0.5, sugars: 11 },

  // ===== PLATS PRÉPARÉS COURANTS =====
  { name: 'Pizza 4 fromages', category: 'Plats préparés', kcal: 280, protein: 12, carbs: 30, fat: 12, salt: 1.8 },
  { name: 'Pizza jambon-fromage', category: 'Plats préparés', kcal: 265, protein: 12, carbs: 28, fat: 11, salt: 1.7 },
  { name: 'Hamburger', category: 'Plats préparés', kcal: 250, protein: 13, carbs: 30, fat: 9, salt: 1.2 },
  { name: 'Cheeseburger', category: 'Plats préparés', kcal: 300, protein: 15, carbs: 30, fat: 14, salt: 1.5 },
  { name: 'Frites fast-food', category: 'Plats préparés', kcal: 330, protein: 4, carbs: 43, fat: 16, salt: 1.8 },
  { name: 'Hot-dog', category: 'Plats préparés', kcal: 290, protein: 10, carbs: 28, fat: 15, salt: 2 },
  { name: 'Sandwich jambon-beurre', category: 'Plats préparés', kcal: 350, protein: 14, carbs: 40, fat: 14, salt: 2 },
  { name: 'Croque-monsieur', category: 'Plats préparés', kcal: 420, protein: 20, carbs: 35, fat: 22, salt: 2 },
  { name: 'Quiche lorraine', category: 'Plats préparés', kcal: 340, protein: 12, carbs: 20, fat: 25, salt: 1.5 },
  { name: 'Lasagnes', category: 'Plats préparés', kcal: 135, protein: 6, carbs: 15, fat: 5, salt: 0.8 },
  { name: 'Raviolis', category: 'Plats préparés', kcal: 130, protein: 5, carbs: 18, fat: 4, salt: 1 },
  { name: 'Gratin dauphinois', category: 'Plats préparés', kcal: 140, protein: 3, carbs: 12, fat: 9, salt: 0.8 },
  { name: 'Couscous', category: 'Plats préparés', kcal: 120, protein: 5, carbs: 18, fat: 3, salt: 0.8 },
  { name: 'Paella', category: 'Plats préparés', kcal: 160, protein: 8, carbs: 22, fat: 5, salt: 1 },
  { name: 'Soupe de légumes', category: 'Plats préparés', kcal: 35, protein: 1.5, carbs: 6, fat: 0.8, salt: 1 },
  { name: 'Soupe minestrone', category: 'Plats préparés', kcal: 45, protein: 2, carbs: 8, fat: 1, salt: 1.2 },
  { name: 'Croissant jambon-fromage', category: 'Plats préparés', kcal: 380, protein: 12, carbs: 40, fat: 20, salt: 1.5 },

  // ===== PETIT-DÉJEUNER =====
  { name: 'Pain + beurre + confiture', category: 'Petit-déjeuner', kcal: 350, protein: 8, carbs: 55, fat: 12, sugars: 25, salt: 1.2 },
  { name: 'Tartine avocat', category: 'Petit-déjeuner', kcal: 280, protein: 8, carbs: 35, fat: 12, salt: 1 },
  { name: 'Œuf brouillé', category: 'Petit-déjeuner', kcal: 180, protein: 12, carbs: 2, fat: 13, salt: 0.5 },
  { name: 'Omelette nature', category: 'Petit-déjeuner', kcal: 250, protein: 14, carbs: 3, fat: 19, salt: 0.5 },
  { name: 'Pancakes', category: 'Petit-déjeuner', kcal: 227, protein: 6, carbs: 28, fat: 10, sugars: 5, salt: 0.7 },

  // ===== PRODUITS DIVERS =====
  { name: 'Huile d\'olive', category: 'Divers', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Huile de tournesol', category: 'Divers', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { name: 'Vinaigre', category: 'Divers', kcal: 18, protein: 0, carbs: 0.9, fat: 0 },
  { name: 'Mayonnaise', category: 'Divers', kcal: 680, protein: 1, carbs: 1, fat: 75, salt: 1.2 },
  { name: 'Ketchup', category: 'Divers', kcal: 112, protein: 1.3, carbs: 26, fat: 0.2, sugars: 22, salt: 2.5 },
  { name: 'Moutarde', category: 'Divers', kcal: 66, protein: 4, carbs: 5, fat: 3, salt: 4 },
  { name: 'Sauce soja', category: 'Divers', kcal: 53, protein: 8, carbs: 5, fat: 0, salt: 14 },
  { name: 'Tofu', category: 'Divers', kcal: 76, protein: 8, carbs: 2, fat: 5, salt: 0.01 },
  { name: 'Tempeh', category: 'Divers', kcal: 193, protein: 19, carbs: 9, fat: 11 },
  { name: 'Seitan', category: 'Divers', kcal: 370, protein: 75, carbs: 4, fat: 2, salt: 1.5 },
];

export const GENERIC_CATEGORIES = [...new Set(GENERIC_FOODS.map(f => f.category))];

const genericNames = new Set(GENERIC_FOODS.map(food => food.name));

export function foodDisplayName(name: string, source: Food['source']): string {
  return source === 'estimation' && genericNames.has(name) ? t(name) : name;
}

export function searchGenericFoods(query: string): GenericFood[] {
  const q = query.toLowerCase().trim();
  if (!q) return GENERIC_FOODS;
  return GENERIC_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q) ||
    t(f.name).toLowerCase().includes(q) ||
    t(f.category).toLowerCase().includes(q)
  );
}
