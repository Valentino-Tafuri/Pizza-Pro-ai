
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AlertCircle } from 'lucide-react';
import Layout from './components/Layout';
import AuthView from './components/AuthView';
import DashboardView from './components/Views/DashboardView';
import MenuView from './components/Views/MenuView';
import LabView from './components/Views/LabView';
import EconomatoView from './components/Views/EconomatoView';
import SettingsOverlay from './components/SettingsOverlay';
import { syncData, saveData, deleteData } from './services/database';
import { ViewType, Ingredient, SubRecipe, MenuItem, Supplier, Employee, UserData } from './types';
import { INITIAL_USER } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbError, setDbError] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userData, setUserData] = useState<UserData>(INITIAL_USER);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync User Profile
        const userRef = doc(db, `users/${u.uid}`);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          await setDoc(userRef, INITIAL_USER);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setDbError(null);
    const handleError = (err: any) => {
      if (err.code === 'permission-denied') setDbError(err);
    };

    const unsubIng = syncData(user.uid, 'ingredients', setIngredients, handleError);
    const unsubSub = syncData(user.uid, 'subRecipes', setSubRecipes, handleError);
    const unsubMenu = syncData(user.uid, 'menu', setMenu, handleError);
    const unsubSup = syncData(user.uid, 'suppliers', setSuppliers, handleError);
    const unsubEmp = syncData(user.uid, 'employees', setEmployees, handleError);

    return () => {
      unsubIng(); unsubSub(); unsubMenu(); unsubSup(); unsubEmp();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthView />;

  const handleSignOut = () => signOut(auth);

  const handleUpdateUserData = async (newData: Partial<UserData>) => {
    const updated = { ...userData, ...newData };
    setUserData(updated);
    if (user) {
      await setDoc(doc(db, `users/${user.uid}`), updated);
    }
  };

  const handleSave = async (col: string, item: any): Promise<string | undefined> => {
    try {
      return await saveData(user.uid, col, item);
    } catch (err: any) {
      if (err.code === 'permission-denied') setDbError(err);
      return undefined;
    }
  };

  const handleDelete = async (col: string, id: string) => {
    try {
      await deleteData(user.uid, col, id);
    } catch (err: any) {
      if (err.code === 'permission-denied') setDbError(err);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView menu={menu} ingredients={ingredients} subRecipes={subRecipes} threshold={userData.foodCostThreshold} />;
      case 'menu':
        return <MenuView 
          menu={menu} 
          ingredients={ingredients} 
          subRecipes={subRecipes} 
          suppliers={suppliers}
          onAdd={(i) => handleSave('menu', i)} 
          onUpdate={(i) => handleSave('menu', i)} 
          onDelete={(id) => handleDelete('menu', id)}
          onAddIngredient={(i) => handleSave('ingredients', i)}
          onAddSupplier={(s) => handleSave('suppliers', s)}
        />;
      case 'lab':
        return <LabView 
          subRecipes={subRecipes} 
          ingredients={ingredients} 
          suppliers={suppliers}
          onAdd={(sub) => handleSave('subRecipes', sub)} 
          onUpdate={(sub) => handleSave('subRecipes', sub)} 
          onDelete={(id) => handleDelete('subRecipes', id)}
          onAddIngredient={(ing) => handleSave('ingredients', ing)}
        />;
      case 'economato':
        return <EconomatoView 
          ingredients={ingredients} 
          suppliers={suppliers} 
          onUpdate={(i) => handleSave('ingredients', i)} 
          onAdd={(i) => handleSave('ingredients', i)} 
          onDelete={(id) => handleDelete('ingredients', id)}
          onAddSupplier={(s) => handleSave('suppliers', s)}
        />;
      default:
        return <DashboardView menu={menu} ingredients={ingredients} subRecipes={subRecipes} threshold={userData.foodCostThreshold} />;
    }
  };

  return (
    <>
      <Layout activeView={activeView} setActiveView={setActiveView} title={activeView.toUpperCase()} onOpenSettings={() => setIsSettingsOpen(true)}>
        {dbError && (
          <div className="mx-4 mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600 font-bold text-xs">
            <AlertCircle size={20} />
            <span>Errore Database: Controlla le regole di sicurezza Firebase.</span>
          </div>
        )}
        {renderView()}
      </Layout>
      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userData={{...userData, email: user.email}} 
        suppliers={suppliers} 
        employees={employees}
        ingredients={ingredients}
        subRecipes={subRecipes}
        menu={menu}
        onAddSupplier={(s) => handleSave('suppliers', s)} 
        onAddEmployee={(e) => handleSave('employees', e)}
        onAddIngredient={(i) => handleSave('ingredients', i)}
        onAddSubRecipe={(sr) => handleSave('subRecipes', sr)}
        onAddMenuItem={(m) => handleSave('menu', m)}
        onUpdateUserData={handleUpdateUserData}
        onSignOut={handleSignOut} 
      />
    </>
  );
};

export default App;
