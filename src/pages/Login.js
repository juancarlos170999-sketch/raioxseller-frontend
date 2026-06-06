import React, { useState } from 'react';
import { auth } from '../api';

const C = {
  bg: '#0a0a12', card: '#13131f', border: '#1e1e2e',
  text: '#e2e2f0', muted: '#6b6b8a', green: '#00a650',
  red: '#e52b2b', input: '#1a1a2e'
};

export default function Login({ onLogin }) {
  const [aba, setAba] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [plano, setPlano] = useState('starter');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !senha) { setErro('Preencha email e senha.'); return; }
    setLoading(true); setErro('');
    try {
      const r = aba === 'entrar'
        ? await auth.login(email, senha)
        : await auth.register(email, senha, nome, plano);
      if (r.success) {
        if (aba === 'entrar') onLogin(r.usuario);
        else { setErro(''); setAba('entrar'); alert('Conta criada! Faça login.'); }
      } else {
        setErro(r.detail || 'Erro ao processar.');
      }
    } catch { setErro('Erro de conexão.'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'36px 32px', width:400 }}>
        <div style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:4 }}>🔍 RaioxSeller</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>Diagnóstico de performance para sellers ML</div>

        <div style={{ display:'flex', gap:0, marginBottom:24, background:C.input, borderRadius:8, padding:4 }}>
          {['entrar','cadastrar'].map(a => (
            <button key={a} onClick={() => setAba(a)} style={{
              flex:1, padding:'8px 0', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600,
              background: aba===a ? C.green : 'transparent',
              color: aba===a ? '#fff' : C.muted
            }}>{a === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
          ))}
        </div>

        {aba === 'cadastrar' && (
          <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome"
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, marginBottom:10, boxSizing:'border-box' }} />
        )}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" type="email"
          style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, marginBottom:10, boxSizing:'border-box' }} />
        <input value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" type="password"
          style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, marginBottom:10, boxSizing:'border-box' }} />

        {aba === 'cadastrar' && (
          <select value={plano} onChange={e=>setPlano(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:13, marginBottom:10, boxSizing:'border-box' }}>
            <option value="starter">Starter — R$97/mês</option>
            <option value="pro">Pro — R$197/mês</option>
            <option value="agencia">Agência — R$397/mês</option>
          </select>
        )}

        {erro && <div style={{ color:C.red, fontSize:12, marginBottom:8 }}>{erro}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'12px 0', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', marginTop:4 }}>
          {loading ? 'Aguarde...' : aba === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
