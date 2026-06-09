import React, { useState } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', input:'#1a1a2e', blue:'#3b82f6'
};

const CLIENT_ID = '8361153242610469';
const REDIRECT_URI = 'https://raioxseller-frontend.vercel.app/callback';
const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=questions`;

export default function Onboarding({ usuario, onMlAuth, onPular, mlAuthInicial }) {
  // Se voltou do OAuth com mlAuth já conectado, vai direto ao passo 3
  const [passo, setPasso] = useState(mlAuthInicial ? 3 : 1);
  const [code, setCode] = useState('');
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState('');
  const [mlAuthLocal, setMlAuthLocal] = useState(mlAuthInicial || null);

  const conectarML = async () => {
    if (!code.trim()) { setErro('Cole o código antes de continuar.'); return; }
    setConectando(true); setErro('');
    try {
      const r = await ml.connect(code.trim(), usuario.id);
      if (r.success) {
        setMlAuthLocal(r);
        onMlAuth(r);
        setPasso(3);
      } else {
        setErro('Código inválido ou expirado. Tente novamente.');
      }
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    setConectando(false);
  };

  const pularOnboarding = () => {
    localStorage.setItem('onboarding_done', '1');
    onPular();
  };

  const steps = [
    { num: 1, label: 'Boas-vindas' },
    { num: 2, label: 'Conectar ML' },
    { num: 3, label: 'Pronto!' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000090', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:480, overflow:'hidden' }}>

        {/* PROGRESS */}
        <div style={{ background:'#0f0f1a', padding:'16px 24px', display:'flex', alignItems:'center', gap:8 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700,
                  background: passo > s.num ? C.green : passo === s.num ? C.blue : C.border,
                  color: passo >= s.num ? '#fff' : C.muted
                }}>
                  {passo > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize:11, color: passo === s.num ? C.text : C.muted, fontWeight: passo === s.num ? 600 : 400 }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex:1, height:1, background: passo > s.num ? C.green : C.border }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ padding:'28px 28px 24px' }}>

          {/* PASSO 1 */}
          {passo === 1 && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>👋</div>
              <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Bem-vindo ao RaioxSeller, {usuario.nome?.split(' ')[0] || 'vendedor'}!</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:24 }}>
                Em menos de 2 minutos você vai descobrir quanto está perdendo por mês no Mercado Livre — e como recuperar.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                {[
                  ['⚡', 'Diagnóstico completo em 5 categorias'],
                  ['💰', 'Cálculo de receita perdida por mês'],
                  ['📋', 'Plano de ação priorizado por impacto'],
                ].map(([icon, texto]) => (
                  <div key={texto} style={{ display:'flex', alignItems:'center', gap:12, background:'#0f0f1a', borderRadius:10, padding:'11px 14px' }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ fontSize:13, color:C.text }}>{texto}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setPasso(2)} style={{ width:'100%', padding:'13px 0', background:C.green, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Começar →
              </button>
              <button onClick={pularOnboarding} style={{ width:'100%', padding:'10px 0', background:'transparent', color:C.muted, border:'none', fontSize:12, cursor:'pointer', marginTop:8 }}>
                Pular e ir direto para o dashboard
              </button>
            </>
          )}

          {/* PASSO 2 */}
          {passo === 2 && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>🔗</div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Conecte sua conta Mercado Livre</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:20 }}>
                Clique no botão abaixo para autorizar o acesso. O ML vai gerar um código — cole ele aqui.
              </div>

              <button onClick={() => {
                localStorage.setItem('onboarding_pending', '1');
                window.location.href = authUrl;
              }} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'#ffe600', color:'#333', padding:'12px 0', borderRadius:10,
                fontWeight:700, fontSize:13, border:'none', cursor:'pointer', width:'100%', marginBottom:16
              }}>
                <span style={{ fontSize:20 }}>🛒</span> Autorizar no Mercado Livre
              </button>

              <div style={{ fontSize:11, color:C.muted, textAlign:'center', marginBottom:12 }}>
                Após autorizar, copie o código que aparece e cole abaixo
              </div>

              <input
                value={code}
                onChange={e => { setCode(e.target.value); setErro(''); }}
                placeholder="Cole o código aqui (ex: TG-12345678-...)"
                style={{ width:'100%', padding:'11px 13px', borderRadius:8, border:`1px solid ${erro ? '#e52b2b' : C.border}`, background:C.input, color:C.text, fontSize:13, boxSizing:'border-box', marginBottom:8 }}
              />
              {erro && <div style={{ fontSize:12, color:'#f09575', marginBottom:8 }}>{erro}</div>}

              <button onClick={conectarML} disabled={conectando} style={{ width:'100%', padding:'13px 0', background: conectando ? C.border : C.green, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:10 }}>
                {conectando ? '⏳ Conectando...' : '✅ Conectar conta'}
              </button>
              <button onClick={() => setPasso(1)} style={{ width:'100%', padding:'9px 0', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, cursor:'pointer' }}>
                ← Voltar
              </button>
            </>
          )}

          {/* PASSO 3 */}
          {passo === 3 && (
            <>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
                <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Conta conectada!</div>
                {mlAuthLocal?.nickname && (
                  <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:10, padding:'10px 16px', display:'inline-block', fontSize:13, color:'#9FE1CB', marginBottom:16 }}>
                    ✅ {mlAuthLocal.nickname}
                  </div>
                )}
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:24 }}>
                  Tudo pronto! Agora clique em <strong style={{ color:C.text }}>"Gerar diagnóstico"</strong> na visão geral para ver sua análise completa.
                </div>
                <button onClick={pularOnboarding} style={{ width:'100%', padding:'13px 0', background:C.green, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  Ir para o dashboard →
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
