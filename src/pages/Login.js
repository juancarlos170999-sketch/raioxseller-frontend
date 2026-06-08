import React, { useState } from 'react';
import { auth } from '../api';
import TermosPrivacidade from './TermosPrivacidade';

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
  const [whatsapp, setWhatsapp] = useState('');
  const [plano, setPlano] = useState('starter');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalTermos, setModalTermos] = useState(null); // 'termos' | 'privacidade' | null
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !senha) { setErro('Preencha email e senha.'); return; }
    if (aba === 'cadastrar') {
      if (!nome) { setErro('Preencha seu nome.'); return; }
      if (!aceitouTermos) { setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.'); return; }
    }
    setLoading(true); setErro('');
    try {
      const r = aba === 'entrar'
        ? await auth.login(email, senha)
        : await auth.register(email, senha, nome, plano, whatsapp);
      if (r.success) {
        if (aba === 'entrar') onLogin(r.usuario);
        else { setErro(''); setAba('entrar'); alert('Conta criada! Faça login.'); }
      } else {
        setErro(r.detail || 'Erro ao processar.');
      }
    } catch { setErro('Erro de conexão.'); }
    setLoading(false);
  };

  const inputStyle = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    border:`1px solid ${C.border}`, background:C.input,
    color:C.text, fontSize:13, marginBottom:10, boxSizing:'border-box'
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'36px 32px', width:'100%', maxWidth:400 }}>
        <div style={{ fontSize:26, fontWeight:800, color:C.text, marginBottom:4 }}>🔍 RaioxSeller</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:28 }}>Diagnóstico de performance para sellers ML</div>

        <div style={{ display:'flex', gap:0, marginBottom:24, background:C.input, borderRadius:8, padding:4 }}>
          {['entrar','cadastrar'].map(a => (
            <button key={a} onClick={() => { setAba(a); setErro(''); }} style={{
              flex:1, padding:'8px 0', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600,
              background: aba===a ? C.green : 'transparent',
              color: aba===a ? '#fff' : C.muted
            }}>{a === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
          ))}
        </div>

        {aba === 'cadastrar' && (
          <>
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome *" style={inputStyle} />
            <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp (opcional — ex: 11999999999)" style={inputStyle} />
          </>
        )}

        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={inputStyle} />
        <input value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" type="password" style={inputStyle} />

        {aba === 'cadastrar' && (
          <>
            <select value={plano} onChange={e=>setPlano(e.target.value)} style={inputStyle}>
              <option value="starter">Líder — R$97/mês</option>
              <option value="pro">Líder Gold — R$197/mês</option>
              <option value="agencia">Líder Platinum — R$397/mês</option>
            </select>

            {/* LGPD CHECKBOX */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14, padding:'12px 14px', background:'#0f0f1a', borderRadius:8, border:`1px solid ${aceitouTermos ? C.green+'40' : C.border}` }}>
              <div
                onClick={() => setAceitouTermos(!aceitouTermos)}
                style={{
                  width:18, height:18, borderRadius:4, border:`2px solid ${aceitouTermos ? C.green : C.muted}`,
                  background: aceitouTermos ? C.green : 'transparent', cursor:'pointer', flexShrink:0, marginTop:1,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700
                }}
              >
                {aceitouTermos ? '✓' : ''}
              </div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
                Li e aceito os{' '}
                <span onClick={() => setModalTermos('termos')} style={{ color:C.green, cursor:'pointer', textDecoration:'underline' }}>Termos de Uso</span>
                {' '}e a{' '}
                <span onClick={() => setModalTermos('privacidade')} style={{ color:C.green, cursor:'pointer', textDecoration:'underline' }}>Política de Privacidade</span>
                {' '}(LGPD). Entendo que o RaioxSeller acessa apenas métricas da minha conta ML e não coleta dados bancários ou senhas.
              </div>
            </div>
          </>
        )}

        {erro && <div style={{ color:C.red, fontSize:12, marginBottom:8 }}>{erro}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', padding:'12px 0', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', marginTop:4 }}>
          {loading ? 'Aguarde...' : aba === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>

        {aba === 'entrar' && (
          <div style={{ marginTop:14, textAlign:'center', fontSize:11, color:'#333' }}>
            <span onClick={() => setModalTermos('privacidade')} style={{ color:C.muted, cursor:'pointer', textDecoration:'underline' }}>Política de Privacidade</span>
            {' · '}
            <span onClick={() => setModalTermos('termos')} style={{ color:C.muted, cursor:'pointer', textDecoration:'underline' }}>Termos de Uso</span>
          </div>
        )}
      </div>

      {modalTermos && (
        <TermosPrivacidade aba={modalTermos} onFechar={() => setModalTermos(null)} />
      )}
    </div>
  );
}
