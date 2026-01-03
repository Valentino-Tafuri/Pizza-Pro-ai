
import { Ingredient, SubRecipe, MenuItem, Supplier, Employee, UserData } from './types';

export const INITIAL_USER: UserData = {
  firstName: 'Mario',
  lastName: 'Rossi',
  phone: '+39 012 3456789',
  email: 'mario@pizzeria.it',
  foodCostThreshold: 30
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Global Food S.p.A.', phone: '02 1234567', email: 'ordini@globalfood.it', category: 'Generalista', deliveryDays: ['Lun', 'Gio'] },
  { id: 's2', name: 'Caseificio Bella Napoli', phone: '081 7654321', email: 'info@bellanapoli.it', category: 'Latticini', deliveryDays: ['Mar', 'Ven'] },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', firstName: 'Luca', lastName: 'Bianchi', phone: '333 4445556', email: 'luca@pizzeria.it', monthlyHours: 160, monthlySalary: 1800, contributionPercentage: 33 },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Farina Tipo 0', unit: 'kg', pricePerUnit: 1.20, category: 'Farine', supplierId: 's1' },
  { id: '2', name: 'Mozzarella di Bufala', unit: 'kg', pricePerUnit: 12.50, category: 'Latticini', supplierId: 's2' },
  { id: '3', name: 'Pomodoro San Marzano', unit: 'kg', pricePerUnit: 2.80, category: 'Conserve', supplierId: 's1' },
  { id: '4', name: 'Olio EVO', unit: 'l', pricePerUnit: 9.50, category: 'Oli', supplierId: 's1' },
  { id: '5', name: 'Lievito di Birra', unit: 'kg', pricePerUnit: 4.50, category: 'Lieviti', supplierId: 's1' },
  { id: '6', name: 'Sale Marino', unit: 'kg', pricePerUnit: 0.60, category: 'Spezie', supplierId: 's1' },
];

export const INITIAL_SUB_RECIPES: SubRecipe[] = [
  {
    id: 'sr1',
    name: 'Impasto Classico 24h',
    components: [
      { id: '1', type: 'ingredient', quantity: 1 },
      { id: '5', type: 'ingredient', quantity: 0.002 },
      { id: '6', type: 'ingredient', quantity: 0.03 },
    ],
    initialWeight: 1.632,
    yieldWeight: 1.600, 
  }
];

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Margherita DOP',
    sellingPrice: 9.50,
    category: 'Pizze Classiche',
    components: [
      { id: 'sr1', type: 'subrecipe', quantity: 0.250 },
      { id: '3', type: 'ingredient', quantity: 0.100 },
      { id: '2', type: 'ingredient', quantity: 0.120 },
      { id: '4', type: 'ingredient', quantity: 0.010 },
    ]
  }
];
