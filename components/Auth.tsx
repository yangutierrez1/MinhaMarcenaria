import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Leaf, Mail, Lock, Loader2, ArrowRight, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

interface AuthProps {}

const Auth: React.FC<AuthProps> = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New field for registration
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!isLogin && password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // --- CADASTRO ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;

        if (data.session) {
           // Auto redirect by App.tsx
        } else if (data.user && !data.session) {
           setMessage({ text: 'Cadastro realizado! Verifique seu e-mail para confirmar.', type: 'success' });
           setIsLogin(true);
           setConfirmPassword('');
        }
      }
    } catch (error: any) {
      let errorMsg = error.message || 'Ocorreu um erro';
      
      if (errorMsg.includes('Invalid login credentials')) errorMsg = 'E-mail ou senha incorretos.';
      if (errorMsg.includes('User already registered')) errorMsg = 'Este e-mail já está cadastrado.';
      if (errorMsg.includes('Password should be at least')) errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
      if (errorMsg.includes('Supabase credentials missing')) errorMsg = 'Erro de configuração: Chaves do Supabase ausentes.';

      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 wood-texture relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#6B8E23] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#2D4739] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/50 p-2 relative z-10 animate-fade-in flex flex-col">
        
        {/* Header Visual */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-16 h-16 bg-[#2D4739] rounded-2xl flex items-center justify-center shadow-lg mb-4 rotate-3 hover:rotate-6 transition-transform duration-500">
            <Leaf size={32} className="text-[#FDFBE2]" />
          </div>
          <h1 className="text-2xl font-black text-[#2D4739] uppercase tracking-tighter">Minha Marcenaria</h1>
          <p className="text-[10px] font-black text-[#6B8E23] uppercase tracking-[0.3em] mt-1">Gestão de Marcenaria</p>
        </div>

        {/* Custom Tab Switcher */}
        <div className="mx-6 mb-6 p-1.5 bg-[#2D473908] rounded-2xl flex relative">
           <div 
             className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${isLogin ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`}
           />
           <button 
             type="button"
             onClick={() => { setIsLogin(true); setMessage(null); }}
             className={`flex-1 relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${isLogin ? 'text-[#2D4739]' : 'text-[#2D473966] hover:text-[#2D4739]'}`}
           >
             <LogIn size={14} /> Entrar
           </button>
           <button 
             type="button"
             onClick={() => { setIsLogin(false); setMessage(null); }}
             className={`flex-1 relative z-10 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${!isLogin ? 'text-[#2D4739]' : 'text-[#2D473966] hover:text-[#2D4739]'}`}
           >
             <UserPlus size={14} /> Cadastrar
           </button>
        </div>

        <div className="px-8 pb-10">
          <div className="text-center mb-6">
             <h2 className="text-xl font-black text-[#2D4739] tracking-tight">
               {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
             </h2>
             <p className="text-xs text-[#2D473966] font-bold mt-1">
               {isLogin ? 'Acesse seu painel de gestão.' : 'Comece a organizar sua marcenaria hoje.'}
             </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#FDFBE2]/50 border-2 border-[#2D473908] rounded-2xl font-bold text-[#2D4739] placeholder:text-[#2D473933] outline-none focus:border-[#6B8E23] focus:bg-white transition-all text-sm"
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-[#FDFBE2]/50 border-2 border-[#2D473908] rounded-2xl font-bold text-[#2D4739] placeholder:text-[#2D473933] outline-none focus:border-[#6B8E23] focus:bg-white transition-all text-sm"
                />
              </div>

              {!isLogin && (
                <div className="relative group animate-in slide-in-from-top-2 fade-in duration-300">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-4 bg-[#FDFBE2]/50 border-2 border-[#2D473908] rounded-2xl font-bold text-[#2D4739] placeholder:text-[#2D473933] outline-none focus:border-[#6B8E23] focus:bg-white transition-all text-sm"
                  />
                </div>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-wide animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#2D4739] text-[#FDFBE2] rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#1A2E24] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-xs"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Entrar no Sistema' : 'Criar Conta Grátis'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;