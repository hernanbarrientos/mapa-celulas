import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Removi o MapPin pois não vamos mais usar

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert('Erro ao fazer login: ' + error.message);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-700">
        <div>
          {/* AQUI ESTÁ A MUDANÇA: LOGO HUB.PNG */}
          <div className="flex justify-center mb-6">
            <img 
              src="/HUB.png" 
              alt="HUB Logo" 
              className="h-28 object-contain" // Ajuste a altura (h-20, h-24, h-28) conforme necessário
            />
          </div>
          
          <h2 className="text-center text-3xl font-extrabold text-white">
            Base de Célula
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Administração das Células.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-gray-700 border border-gray-600 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm transition-all"
                placeholder="celulas@renovochurch.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3.5 bg-gray-700 border border-gray-600 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm transition-all"
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all disabled:opacity-70 shadow-lg shadow-blue-900/50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar no Sistema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}