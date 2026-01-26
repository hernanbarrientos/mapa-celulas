import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

import MapaPublico from './pages/MapaPublico';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Lideres from './pages/Lideres'; // <--- IMPORTE A NOVA PÁGINA

const RotaProtegida = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapaPublico />} />
        <Route path="/login" element={<Login />} />
        
        {/* ROTA LIDERES - Se quiser proteger com senha tbm, envolva com <RotaProtegida> */}
        <Route path="/lideres" element={<Lideres />} />

        <Route 
          path="/admin" 
          element={
            <RotaProtegida>
              <AdminDashboard />
            </RotaProtegida>
          } 
        />
      </Routes>
    </Router>
  );
}