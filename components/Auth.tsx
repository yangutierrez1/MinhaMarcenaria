import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Leaf, Mail, Lock, Loader2, ArrowRight, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLoginDemo?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginDemo }) => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

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

        // Se o Supabase retornar uma sessão imediatamente, o e-mail não precisa de confirmação
        if (data.session) {
           // O App.tsx detectará a sessão automaticamente e mudará a tela
        } else if (data.user && !data.session) {
           // Usuário criado, mas precisa confirmar e-mail
           setMessage({ text: 'Cadastro realizado! Verifique seu e-mail para confirmar.', type: 'success' });
           setIsLogin(true); // Volta para tela de login
        }
      }
    } catch (error: any) {
      let errorMsg = error.message || 'Ocorreu um erro';
      
      // Tradução básica de erros comuns do Supabase
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

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/40 p-8 md:p-12 relative z-10 animate-fade-in">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#2D4739] rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3 hover:rotate-6 transition-transform duration-500">
            <Leaf size={40} className="text-[#FDFBE2]" />
          </div>
          <h1 className="text-3xl font-black text-[#2D4739] uppercase tracking-tighter">My Home</h1>
          <p className="text-xs font-black text-[#6B8E23] uppercase tracking-[0.4em] mt-2">Gestão de Marcenaria</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={20} />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-[#2D473911] rounded-2xl font-bold text-[#2D4739] placeholder:text-[#2D473933] outline-none focus:border-[#6B8E23] focus:bg-white transition-all"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D473944] group-focus-within:text-[#6B8E23] transition-colors" size={20} />
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-[#2D473911] rounded-2xl font-bold text-[#2D4739] placeholder:text-[#2D473933] outline-none focus:border-[#6B8E23] focus:bg-white transition-all"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-wide animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
              {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#2D4739] text-[#FDFBE2] rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#1A2E24] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar no Sistema' : 'Criar Conta Grátis'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
           {/* Botão de Demo */}
           {onLoginDemo && (
             <button
               type="button"
               onClick={onLoginDemo}
               className="w-full py-4 bg-[#6B8E23]/10 text-[#6B8E23] rounded-2xl font-black uppercase tracking-widest hover:bg-[#6B8E23]/20 transition-all flex items-center justify-center gap-2 border border-[#6B8E23]/20"
             >
               <Eye size={18} />
               Modo Demonstração
             </button>
           )}

          <button
            onClick={() => { setIsLogin(!isLogin); setMessage(null); setEmail(''); setPassword(''); }}
            className="text-xs font-black text-[#2D473966] uppercase tracking-widest hover:text-[#6B8E23] transition-colors mt-2"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;