
export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'unit' | 'pz';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  deliveryDays: string[];
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  monthlyHours: number;
  monthlySalary: number;
  contributionPercentage: number;
  department?: string;
  role?: string;
}

export interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  foodCostThreshold: number; // Soglia configurabile per le notifiche
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  pricePerUnit: number;
  category: string;
  supplierId?: string;
}

export interface ComponentUsage {
  id: string;
  type: 'ingredient' | 'subrecipe' | 'menuitem';
  quantity: number;
}

export interface SubRecipe {
  id: string;
  name: string;
  components: ComponentUsage[];
  yieldWeight: number;
  initialWeight: number;
  procedure?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  components: ComponentUsage[];
  sellingPrice: number;
  category: string;
}

export type ViewType = 'dashboard' | 'menu' | 'lab' | 'economato';
