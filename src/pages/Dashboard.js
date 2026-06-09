import React, { useState, useEffect } from 'react';
import { ml, pagamento } from '../api';
import Planos from './Planos';
import Promocoes from './Promocoes';
import Onboarding from './Onboarding';
import Historico from './Historico';
import CurvaABC from './CurvaABC';
import AnalisarProdutos from './AnalisarProdutos';

const C = {
  bg:'#0a0a12', sidebar:'#0f0f1a', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', yellow:'#f5a623',
  red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e', purple:'#7c3aed'
};

const CLIENT_ID = '8361153242610469';
const REDIRECT_URI = 'https://raioxseller-frontend.vercel.app/callback';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

function corScore(s) { return s < 60 ? C.red : s < 80 ? C.yellow : C.green; }
function isPro(u) { return ['pro','agencia'].includes(u?.plano); }
function fmt(n) { return (n||0).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:0}); }

function ConectarMLModal({ usuario, authUrl, onMlAuth }) {
  const [code, setCode] = useState('');
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState('');

  const conectar = async () => {
    if (!code.trim()) { setErro('Cole o código antes de continuar.'); return; }
    setConectando(true); setErro('');
    try {
      const r = await ml.connect(code.trim(), usuario.id);
      if (r.success) { onMlAuth(r); }
      else { setErro('Código inválido ou expirado. Tente novamente.'); }
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    setConectando(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000095', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:440, padding:'32px 28px' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔗</div>
        <div style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:6 }}>Conecte sua conta Mercado Livre</div>
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, marginBottom:24 }}>
          Para começar, autorize o acesso à sua conta. Clique no botão abaixo e depois cole o código gerado.
        </div>
        <button onClick={() => { localStorage.setItem('onboarding_pending','1'); window.location.href = authUrl; }} style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%',
          background:'#ffe600', color:'#333', padding:'13px 0', borderRadius:10,
          fontWeight:700, fontSize:13, border:'none', cursor:'pointer', marginBottom:16
        }}>
          <span style={{ fontSize:20 }}>🛒</span> Autorizar no Mercado Livre
        </button>
        <div style={{ fontSize:11, color:C.muted, textAlign:'center', marginBottom:10 }}>
          Após autorizar, copie o código que aparece e cole abaixo
        </div>
        <input
          value={code} onChange={e => { setCode(e.target.value); setErro(''); }}
          placeholder="Cole o código aqui (ex: TG-12345678-...)"
          style={{ width:'100%', padding:'11px 13px', borderRadius:8, border:`1px solid ${erro ? C.red : C.border}`, background:C.input, color:C.text, fontSize:13, boxSizing:'border-box', marginBottom:8 }}
        />
        {erro && <div style={{ fontSize:12, color:'#f09575', marginBottom:8 }}>{erro}</div>}
        <button onClick={conectar} disabled={conectando} style={{
          width:'100%', padding:'13px 0', background: conectando ? C.border : C.green,
          color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer'
        }}>
          {conectando ? '⏳ Conectando...' : '✅ Conectar conta'}
        </button>
      </div>
    </div>
  );
}

function BloqueadoPro({ setPagina, recurso }) {
  return (
    <div style={{ padding:60, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Recurso exclusivo Líder Gold</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{recurso} está disponível nos planos Líder Gold e Líder Platinum.</div>
      <button onClick={() => setPagina('planos')} style={{ padding:'12px 28px', background:'#d4a017', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
        ⬆ Fazer upgrade para Líder Gold — R$197/mês
      </button>
    </div>
  );
}

function calcImpactoAlerta(alerta, receita) {
  if (!receita) return 0;
  const cat = alerta.categoria?.toLowerCase() || '';
  const msg = alerta.mensagem?.toLowerCase() || '';
  if (cat.includes('reputação') || cat.includes('reputacao')) return receita.perda_reputacao || 0;
  if (cat.includes('operação') || cat.includes('operacao') || msg.includes('atraso')) return receita.perda_operacao || 0;
  if (cat.includes('estoque')) return receita.perda_estoque || 0;
  if (cat.includes('atendimento') || msg.includes('pergunta')) return receita.perda_atendimento || 0;
  if (cat.includes('publicidade') || cat.includes('ads')) return Math.round((receita.ticket_medio || 100) * 8);
  return Math.round((receita.ticket_medio || 100) * 3);
}

export default function Dashboard({ usuario, mlAuth, onMlAuth, onLogout }) {
  const [pagina, setPagina] = useState('visao');
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [conectando, setConectando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  // Conectar ML: aparece quando não tem conta conectada
  const [showConectarML, setShowConectarML] = useState(!mlAuth);
  // Onboarding de boas-vindas: aparece após conectar ML pela primeira vez
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Quando mlAuth conecta (após OAuth redirect), mostra onboarding se primeira vez
  useEffect(() => {
    if (mlAuth) {
      setShowConectarML(false);
      // Veio do OAuth redirect (onboarding_pending) → mostra onboarding
      if (localStorage.getItem('onboarding_pending') && !localStorage.getItem('onboarding_done')) {
        setShowOnboarding(true);
        localStorage.removeItem('onboarding_pending');
      }
    }
  }, [mlAuth]);
  const isMobile = useIsMobile();

  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=questions`;
  const planoLabel = { starter:'LÍDER', pro:'LÍDER GOLD', agencia:'LÍDER PLATINUM', iniciante:'LÍDER' };
  const planoCor = { starter:C.blue, pro:'#d4a017', agencia:'#a8b8c8', iniciante:C.blue };

  const conectarML = async () => {
    if (!code.trim()) return;
    setConectando(true);
    try {
      const r = await ml.connect(code.trim(), usuario.id);
      if (r.success) { onMlAuth(r); setCode(''); }
      else alert('Código inválido.');
    } catch { alert('Erro de conexão.'); }
    setConectando(false);
  };

  const gerarDiagnostico = async () => {
    if (!mlAuth) return;
    setLoading(true);
    try {
      let token = mlAuth.access_token;
      let r = await ml.diagnostico(mlAuth.ml_user_id, token, usuario.id, mlAuth.conta_ml_id || '');
      // Se retornar erro de autenticação, tenta renovar o token automaticamente
      if (r.detail && (r.detail.includes('401') || r.detail.includes('token') || r.detail.includes('expired'))) {
        const refreshed = await ml.refresh(mlAuth.conta_ml_id);
        if (refreshed.success) {
          token = refreshed.access_token;
          const mlAuthAtualizado = { ...mlAuth, access_token: token };
          localStorage.setItem('ml_auth', JSON.stringify(mlAuthAtualizado));
          onMlAuth(mlAuthAtualizado);
          r = await ml.diagnostico(mlAuth.ml_user_id, token, usuario.id, mlAuth.conta_ml_id || '');
        }
      }
      setDiagnostico(r);
    } catch { alert('Erro ao gerar diagnóstico.'); }
    setLoading(false);
  };

  const nivel_labels = { '5_green':'🟢 Verde', '4_light_green':'🟢 Verde claro', '3_yellow':'🟡 Amarelo', '2_orange':'🟠 Laranja', '1_red':'🔴 Vermelho' };

  const navItems = [
    { id:'visao', label:'Visão geral', icon:'◉', secao:'ANÁLISE' },
    { id:'historico', label:'Histórico', icon:'📈', pro:true },
    { id:'curva-abc', label:'Curva ABC', icon:'📊', pro:true },
    { id:'analisar', label:'Analisar produto', icon:'⬡', pro:true },
    { id:'promocoes', label:'Promoções', icon:'🏷', pro:true },
    { id:'calculadora', label:'Calculadora', icon:'⊞', secao:'FERRAMENTAS' },
    { id:'plano', label:'Plano de ação', icon:'☑' },
  ];

  // Bottom nav mobile: só 5 itens principais
  const mobileNavItems = [
    { id:'visao', label:'Início', icon:'◉' },
    { id:'historico', label:'Histórico', icon:'📈', pro:true },
    { id:'calculadora', label:'Calc', icon:'⊞' },
    { id:'plano', label:'Plano', icon:'☑' },
    { id:'_menu', label:'Mais', icon:'☰' },
  ];

  const navegar = (id) => {
    if (id === '_menu') { setMenuAberto(true); return; }
    setPagina(id);
    setMenuAberto(false);
  };

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, fontFamily:'Inter, sans-serif', color:C.text, flexDirection: isMobile ? 'column' : 'row' }}>

      {/* ── SIDEBAR DESKTOP ── */}
      {!isMobile && (
        <div style={{ width:220, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'20px 16px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>🔍 RaioxSeller</div>
            <div style={{ fontSize:11, color:C.muted }}>Diagnóstico ML</div>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {navItems.map((item, idx) => (
              <div key={item.id}>
                {item.secao && (
                  <div style={{ fontSize:10, color:'#444', letterSpacing:'0.08em', padding:`${idx===0?'8px':'16px'} 16px 4px`, textTransform:'uppercase' }}>{item.secao}</div>
                )}
                <div onClick={() => setPagina(item.id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', cursor:'pointer', fontSize:13,
                  color: pagina===item.id ? C.green : C.muted,
                  background: pagina===item.id ? '#0d2d1a' : 'transparent',
                  borderLeft: `2px solid ${pagina===item.id ? C.green : 'transparent'}`
                }}>
                  <span style={{ display:'flex', alignItems:'center', gap:8 }}><span>{item.icon}</span>{item.label}</span>
                  {item.pro && !isPro(usuario) && <span style={{ fontSize:9, background:'#d4a017', color:'#fff', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>GOLD</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}` }}>
            {!mlAuth ? (
              <div>
                <a href={authUrl} target="_blank" rel="noreferrer" style={{ display:'block', background:C.green, color:'#fff', textAlign:'center', padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none', marginBottom:8 }}>🔗 Autorizar ML</a>
                <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Cole o código TG-..."
                  style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:11, boxSizing:'border-box', marginBottom:6 }} />
                <button onClick={conectarML} disabled={conectando} style={{ width:'100%', padding:'7px 0', background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {conectando ? 'Conectando...' : 'Conectar'}
                </button>
              </div>
            ) : (
              <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:8, padding:'8px 12px', fontSize:12, color:'#9FE1CB', marginBottom:8 }}>
                ✅ {mlAuth.nickname}
              </div>
            )}
            <div style={{ marginTop:8, marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{usuario.nome || usuario.email}</div>
              <span style={{ background:planoCor[usuario.plano]||C.blue, color:'#fff', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{planoLabel[usuario.plano]||'STARTER'}</span>
            </div>
            <button onClick={() => setPagina('planos')} style={{ width:'100%', padding:'7px 0', background:'transparent', color:'#d4a017', border:`1px solid #d4a01740`, borderRadius:6, fontSize:12, cursor:'pointer', marginBottom:6 }}>
              ⬆ Fazer upgrade
            </button>
            <button onClick={onLogout} style={{ width:'100%', padding:'7px 0', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, cursor:'pointer' }}>Sair</button>
          </div>
        </div>
      )}

      {/* ── TOPBAR MOBILE ── */}
      {isMobile && (
        <div style={{ background:C.sidebar, borderBottom:`1px solid ${C.border}`, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>🔍 RaioxSeller</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {mlAuth ? (
              <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:6, padding:'4px 10px', fontSize:11, color:'#9FE1CB' }}>
                ✅ {mlAuth.nickname}
              </div>
            ) : (
              <a href={authUrl} target="_blank" rel="noreferrer" style={{ background:C.green, color:'#fff', padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, textDecoration:'none' }}>🔗 Conectar ML</a>
            )}
            <span style={{ background:planoCor[usuario.plano]||C.blue, color:'#fff', padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{planoLabel[usuario.plano]||'STARTER'}</span>
          </div>
        </div>
      )}

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <div style={{ flex:1, overflow:'auto', paddingBottom: isMobile ? 70 : 0 }}>
        {pagina === 'visao' && <VisaoGeral diagnostico={diagnostico} loading={loading} onGerar={gerarDiagnostico} mlAuth={mlAuth} nivel_labels={nivel_labels} usuario={usuario} setPagina={setPagina} isMobile={isMobile} />}
        {pagina === 'historico' && (isPro(usuario) ? <Historico mlAuth={mlAuth} usuario={usuario} isMobile={isMobile} /> : <BloqueadoPro setPagina={setPagina} recurso="Histórico de evolução do score" />)}
        {pagina === 'curva-abc' && (isPro(usuario) ? <CurvaABC mlAuth={mlAuth} usuario={usuario} isMobile={isMobile} /> : <BloqueadoPro setPagina={setPagina} recurso="Análise de Curva ABC" />)}
        {pagina === 'analisar' && (isPro(usuario) ? <AnalisarProdutos mlAuth={mlAuth} usuario={usuario} isMobile={isMobile} /> : <BloqueadoPro setPagina={setPagina} recurso="Análise de produto por MLB" />)}
        {pagina === 'promocoes' && (isPro(usuario) ? <Promocoes mlAuth={mlAuth} /> : <BloqueadoPro setPagina={setPagina} recurso="Módulo de promoções" />)}
        {pagina === 'calculadora' && <Calculadora isMobile={isMobile} />}
        {pagina === 'plano' && <PlanoAcao diagnostico={diagnostico} setPagina={setPagina} isMobile={isMobile} />}
        {pagina === 'planos' && <Planos usuario={usuario} onVoltar={() => setPagina('visao')} onAtualizarUsuario={(u) => { localStorage.setItem('usuario', JSON.stringify(u)); window.location.reload(); }} />}
      </div>

      {/* ── CONECTAR ML (bloqueante, aparece antes do onboarding) ── */}
      {showConectarML && (
        <ConectarMLModal
          usuario={usuario}
          authUrl={authUrl}
          onMlAuth={(r) => {
            onMlAuth(r);
            setShowConectarML(false);
            if (!localStorage.getItem('onboarding_done')) setShowOnboarding(true);
          }}
        />
      )}

      {/* ── ONBOARDING (boas-vindas, após conectar ML) ── */}
      {showOnboarding && !showConectarML && (
        <Onboarding
          usuario={usuario}
          mlAuth={mlAuth}
          onPular={() => {
            localStorage.setItem('onboarding_done', '1');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* ── BOTTOM NAV MOBILE ── */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.sidebar, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:100 }}>
          {mobileNavItems.map(item => (
            <button key={item.id} onClick={() => navegar(item.id)} style={{
              flex:1, padding:'10px 0', background:'transparent', border:'none', cursor:'pointer',
              color: pagina===item.id ? C.green : C.muted,
              display:'flex', flexDirection:'column', alignItems:'center', gap:3
            }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:600 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── MENU MOBILE (drawer) ── */}
      {isMobile && menuAberto && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div onClick={() => setMenuAberto(false)} style={{ position:'absolute', inset:0, background:'#00000080' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:C.sidebar, borderTop:`1px solid ${C.border}`, borderRadius:'16px 16px 0 0', padding:'20px 0 32px' }}>
            <div style={{ textAlign:'center', fontSize:12, color:C.muted, marginBottom:16 }}>Menu</div>
            {[
              { id:'promocoes', label:'Promoções', icon:'🏷', pro:true },
              { id:'planos', label:'Upgrade de plano', icon:'⬆' },
            ].map(item => (
              <div key={item.id} onClick={() => { setPagina(item.id); setMenuAberto(false); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', fontSize:14, color:C.text, cursor:'pointer', borderBottom:`1px solid ${C.border}` }}>
                <span style={{ display:'flex', alignItems:'center', gap:12 }}><span>{item.icon}</span>{item.label}</span>
                {item.pro && !isPro(usuario) && <span style={{ fontSize:9, background:C.yellow, color:'#fff', padding:'2px 6px', borderRadius:3, fontWeight:700 }}>PRO</span>}
              </div>
            ))}
            <div onClick={onLogout} style={{ display:'flex', alignItems:'center', padding:'14px 24px', fontSize:14, color:C.muted, cursor:'pointer', gap:12 }}>
              <span>🚪</span> Sair
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VisaoGeral({ diagnostico, loading, onGerar, mlAuth, nivel_labels, usuario, setPagina, isMobile }) {
  const r = diagnostico;
  const receita = r?.metricas?.receita;
  const cor = !r ? C.muted : r.score_total >= 80 ? C.green : r.score_total >= 60 ? C.yellow : C.red;

  const alertasRanqueados = r ? [...r.alertas]
    .map(a => ({ ...a, impacto: calcImpactoAlerta(a, receita) }))
    .sort((a, b) => b.impacto - a.impacto) : [];

  const totalRecuperavel = alertasRanqueados.reduce((s, a) => s + a.impacto, 0);
  const potencial = r ? Math.round(r.score_total) : 0;
  const faturamentoAtual = receita ? Math.round((receita.ticket_medio || 0) * (receita.vendas_60d || 0) / 2) : 0;
  const faturamentoPotencial = receita ? Math.round(faturamentoAtual + (receita.receita_perdida_estimada || 0)) : 0;
  const ganhosRapidos = alertasRanqueados.filter(a => a.tipo === 'ATENCAO' && a.impacto > 0).slice(0, 3);

  const oportunidades = [];
  if (r?.metricas?.estoque?.sem_full > 0)
    oportunidades.push({ emoji:'📦', texto:`${r.metricas.estoque.sem_full} produto(s) sem Full — ative para aumentar conversão e Buy Box` });
  if (r?.metricas?.publicidade?.sem_ads)
    oportunidades.push({ emoji:'📢', texto:'Nenhum produto com Product Ads ativo — ROAS médio do setor é 4x' });
  if (r?.scores?.atendimento >= 80)
    oportunidades.push({ emoji:'⭐', texto:'Atendimento excelente — use como diferencial no título dos anúncios' });
  if (r?.nivel === '5_green' || r?.nivel === '4_light_green')
    oportunidades.push({ emoji:'🏆', texto:'Reputação verde — você aparece antes da concorrência. Maximize estoque agora.' });

  const scores5 = [
    { label:'Reputação', key:'reputacao', icon:'⭐' },
    { label:'Operação', key:'operacao', icon:'🚚' },
    { label:'Estoque', key:'estoque', icon:'📦' },
    { label:'Atendimento', key:'atendimento', icon:'💬' },
    { label:'Publicidade', key:'publicidade', icon:'📢' },
  ];

  const pad = isMobile ? '16px' : '28px 32px';

  return (
    <div style={{ padding:pad, maxWidth:980, margin:'0 auto' }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isMobile ? 16 : 28 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:700 }}>Visão geral</div>
          {!isMobile && <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>Diagnóstico completo da sua conta Mercado Livre</div>}
        </div>
        <button onClick={onGerar} disabled={loading || !mlAuth}
          style={{ padding: isMobile ? '8px 14px' : '10px 24px', background: loading ? C.border : C.green, color:'#fff', border:'none', borderRadius:8, fontSize: isMobile ? 12 : 13, fontWeight:600, cursor:!mlAuth?'not-allowed':'pointer', opacity:!mlAuth?0.4:1 }}>
          {loading ? '⏳ Analisando...' : r ? '↻ Atualizar' : '▶ Gerar diagnóstico'}
        </button>
      </div>

      {/* ESTADO VAZIO */}
      {!r ? (
        <div style={{ textAlign:'center', padding: isMobile ? '40px 20px' : '72px 40px', background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:600, color:C.text, marginBottom:8 }}>
            {mlAuth ? 'Pronto para analisar sua conta' : 'Conecte sua conta Mercado Livre'}
          </div>
          <div style={{ fontSize:13, color:C.muted, maxWidth:320, margin:'0 auto' }}>
            {mlAuth ? 'Toque em "Gerar diagnóstico" e veja quanto você está perdendo por mês.' : 'Use o botão "Conectar ML" no topo para começar.'}
          </div>
          {mlAuth && (
            <button onClick={onGerar} style={{ marginTop:20, padding:'11px 28px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
              ▶ Gerar diagnóstico agora
            </button>
          )}
        </div>
      ) : (
        <>
          {/* HERO RECEITA */}
          {receita && receita.receita_perdida_estimada > 0 && (
            <div style={{ borderRadius:14, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom:14, background:'#141420', border:`1px solid #2a2a3e` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap:16, flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:C.muted, letterSpacing:'0.12em', fontWeight:600, marginBottom:8, textTransform:'uppercase' }}>Diagnóstico de receita</div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:C.text, lineHeight:1.3, marginBottom:6 }}>
                    Você está perdendo{' '}
                    <span style={{ color:'#ff4d4d' }}>R$ {fmt(receita.receita_perdida_estimada)}/mês</span>
                  </div>
                  <div style={{ fontSize:13, color:'#a0a0b8', marginBottom:14 }}>
                    Corrija os problemas e recupere até{' '}
                    <strong style={{ color:C.text }}>
                      {faturamentoAtual > 0 ? `${Math.round((receita.receita_perdida_estimada/faturamentoPotencial)*100)}%` : 'parte significativa'} do faturamento
                    </strong>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[
                      receita.perda_reputacao > 0 && { label:'Reputação', val: receita.perda_reputacao },
                      receita.perda_operacao > 0 && { label:'Atrasos', val: receita.perda_operacao },
                      receita.perda_estoque > 0 && { label:'Estoque', val: receita.perda_estoque },
                      receita.perda_atendimento > 0 && { label:'Atendimento', val: receita.perda_atendimento },
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px' }}>
                        <div style={{ fontSize:10, color:'#8888a8', marginBottom:2 }}>{item.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#ff5555' }}>− R${fmt(item.val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ textAlign:'center', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 28px', minWidth:150 }}>
                    <div style={{ fontSize:10, color:'#8888a8', marginBottom:8, letterSpacing:'0.08em', fontWeight:600 }}>TOTAL / MÊS</div>
                    <div style={{ fontSize:34, fontWeight:900, color:'#ff4d4d', lineHeight:1 }}>R${fmt(receita.receita_perdida_estimada)}</div>
                    <div style={{ fontSize:10, color:'#8888a8', marginTop:8 }}>ticket R${receita.ticket_medio} · {receita.vendas_60d} vendas/60d</div>
                  </div>
                )}
                {isMobile && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', background:C.card, borderRadius:10, padding:'12px 16px' }}>
                    <div style={{ fontSize:12, color:'#8888a8' }}>Total / mês</div>
                    <div style={{ fontSize:24, fontWeight:900, color:'#ff4d4d' }}>R${fmt(receita.receita_perdida_estimada)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCORE + POTENCIAL */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:12 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{r.seller}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{nivel_labels[r.nivel] || r.nivel} · {r.mercadolider}</div>
                </div>
                <div style={{ textAlign:'center', minWidth:60 }}>
                  <div style={{ fontSize:36, fontWeight:900, color:cor, lineHeight:1 }}>{r.score_total}</div>
                  <div style={{ fontSize:10, color:cor, fontWeight:600, marginTop:2 }}>{r.status}</div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginBottom:5 }}>
                <span>Potencial usado</span><span style={{ color:cor, fontWeight:600 }}>{potencial}%</span>
              </div>
              <div style={{ height:6, background:'#1e1e2e', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${potencial}%`, height:'100%', background:`linear-gradient(90deg, ${C.red} 0%, ${C.yellow} 55%, ${C.green} 100%)`, borderRadius:3 }} />
              </div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:14 }}>POTENCIAL DE FATURAMENTO</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ flex:1, background:C.input, borderRadius:8, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Atual</div>
                  <div style={{ fontSize: isMobile ? 16 : 18, fontWeight:800, color:C.yellow }}>R${fmt(faturamentoAtual)}</div>
                  <div style={{ fontSize:9, color:C.muted }}>/ mês</div>
                </div>
                <div style={{ color:C.muted, fontSize:14 }}>→</div>
                <div style={{ flex:1, background:'#0a1f12', border:`1px solid ${C.green}25`, borderRadius:8, padding:'10px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:C.green, marginBottom:3 }}>Potencial</div>
                  <div style={{ fontSize: isMobile ? 16 : 18, fontWeight:800, color:C.green }}>R${fmt(faturamentoPotencial)}</div>
                  <div style={{ fontSize:9, color:C.muted }}>/ mês</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Estimativa baseada nos últimos 60 dias.</div>
            </div>
          </div>

          {/* SCORES 5 CATEGORIAS */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:14, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(5,1fr)' }}>
              {scores5.map(({ label, key, icon }, idx) => {
                const val = r.scores[key] || 0;
                const c = corScore(val);
                const isLast = isMobile ? idx === 4 : idx === 4;
                const showBorder = isMobile ? (idx !== 2 && idx !== 4) : idx < 4;
                return (
                  <div key={key} style={{ padding:'12px 14px', borderRight: showBorder ? `1px solid ${C.border}` : 'none', borderBottom: isMobile && idx < 3 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>{icon} {label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:c, marginBottom:5 }}>{val}</div>
                    <div style={{ height:3, background:'#1e1e2e', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ width:`${val}%`, height:'100%', background:c, borderRadius:2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RANKING */}
          {alertasRanqueados.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:12, overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>Prioridades de ação</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Maior impacto financeiro primeiro</div>
                </div>
                {!isMobile && (
                  <button onClick={() => setPagina('plano')} style={{ padding:'7px 14px', background:'transparent', color:C.green, border:`1px solid ${C.green}35`, borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                    Plano de 7 dias →
                  </button>
                )}
              </div>
              <div>
                {alertasRanqueados.map((a, i) => {
                  const critico = a.tipo === 'CRITICO';
                  const tc = critico ? '#ff6b6b' : C.yellow;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom: i < alertasRanqueados.length-1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ width:26, height:26, borderRadius:7, background: critico ? '#3d1515' : '#2d2010', border:`1px solid ${tc}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:tc, flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:2, flexWrap:'wrap' }}>
                          <span style={{ fontSize:9, fontWeight:700, color:tc, background:`${tc}15`, border:`1px solid ${tc}25`, padding:'1px 6px', borderRadius:3 }}>
                            {critico ? 'CRÍTICO' : 'ATENÇÃO'}
                          </span>
                          <span style={{ fontSize:10, color:C.muted }}>{a.categoria}</span>
                        </div>
                        <div style={{ fontSize: isMobile ? 12 : 13, fontWeight:600, color:C.text, marginBottom:1 }}>{a.mensagem}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{a.acao}</div>
                      </div>
                      {a.impacto > 0 && (
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight:700, color:C.green }}>+R${fmt(a.impacto)}</div>
                          <div style={{ fontSize:9, color:C.muted }}>/mês</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalRecuperavel > 0 && (
                <div style={{ padding:'10px 18px', background:'#0a1f12', borderTop:`1px solid ${C.green}20`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:'#6fcfa0' }}>Potencial total</div>
                  <div style={{ fontSize:15, fontWeight:800, color:C.green }}>+R${fmt(totalRecuperavel)}/mês</div>
                </div>
              )}
            </div>
          )}

          {/* GANHOS RÁPIDOS + OPORTUNIDADES */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile || oportunidades.length === 0 ? '1fr' : '1fr 1fr', gap:12, marginBottom:14 }}>
            {ganhosRapidos.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>⚡ Ganhos rápidos</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Ações que você pode tomar hoje</div>
                </div>
                {ganhosRapidos.map((a, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', borderBottom: i < ganhosRapidos.length-1 ? `1px solid ${C.border}` : 'none', gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:C.text, marginBottom:1 }}>{a.mensagem}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{a.acao}</div>
                    </div>
                    {a.impacto > 0 && <div style={{ fontSize:12, fontWeight:700, color:C.yellow, flexShrink:0 }}>+R${fmt(a.impacto)}/mês</div>}
                  </div>
                ))}
              </div>
            )}

            {oportunidades.length > 0 && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>🚀 Oportunidades</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Ações de crescimento identificadas</div>
                </div>
                {oportunidades.map((o, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 16px', borderBottom: i < oportunidades.length-1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize:15, flexShrink:0, marginTop:1 }}>{o.emoji}</span>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{o.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA PLANO */}
          <div style={{ background:'#0a1f12', border:`1px solid ${C.green}25`, borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexDirection: isMobile ? 'column' : 'row' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>Pronto para agir?</div>
              <div style={{ fontSize:12, color:'#6fcfa0' }}>Veja o plano de recuperação de 7 dias com ações priorizadas por impacto.</div>
            </div>
            <button onClick={() => setPagina('plano')} style={{ padding:'10px 22px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', width: isMobile ? '100%' : 'auto' }}>
              Ver plano de 7 dias →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AnalisarProduto({ mlAuth, usuario, setPagina, isMobile }) {
  const [mlb, setMlb] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('fatores');

  const analisar = async () => {
    if (!mlb.trim() || !mlAuth) return;
    setLoading(true);
    try {
      const mlbF = mlb.trim().toUpperCase().startsWith('MLB') ? mlb.trim().toUpperCase() : `MLB${mlb.trim()}`;
      const r = await ml.item(mlbF, mlAuth.access_token, mlAuth.ml_user_id);
      setItem(r);
    } catch { alert('Erro ao analisar produto.'); }
    setLoading(false);
  };

  const corScore = (s) => s < 60 ? C.red : s < 80 ? C.yellow : C.green;

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Analisar produto</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Cole o MLB para diagnóstico completo</div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={mlb} onChange={e=>setMlb(e.target.value)} placeholder="Ex: MLB4341336433"
          style={{ flex:1, padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13 }} />
        <button onClick={analisar} disabled={loading || !mlAuth} style={{ padding:'10px 16px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          {loading ? '...' : '🔍'}
        </button>
      </div>

      {item && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, marginRight:12 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4, fontFamily:'monospace' }}>{item.item_id}</div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>{item.titulo}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[`R$${item.preco}`, `Estoque: ${item.estoque}`, `Vendas: ${item.vendas}`].map((t,i) => (
                    <span key={i} style={{ background:C.input, color:C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'center', background:`${corScore(item.score_total)}15`, border:`2px solid ${corScore(item.score_total)}`, borderRadius:10, padding:'10px 16px', flexShrink:0 }}>
                <div style={{ fontSize:30, fontWeight:900, color:corScore(item.score_total) }}>{item.score_total}</div>
                <div style={{ fontSize:10, color:corScore(item.score_total) }}>/100</div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:14 }}>
            {[['fatores','📊 Fatores'],['ads','📢 Ads'],['preco','💰 Preço']].map(([id,label]) => (
              <div key={id} onClick={()=>setAba(id)} style={{ padding:'8px 14px', fontSize:12, cursor:'pointer', borderBottom:`2px solid ${aba===id?C.green:'transparent'}`, color:aba===id?C.green:C.muted, marginBottom:-1 }}>{label}</div>
            ))}
          </div>

          {aba === 'fatores' && item.scores && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
              {Object.entries(item.scores).map(([nome, score]) => (
                <div key={nome} style={{ display:'grid', gridTemplateColumns:'100px 1fr 32px', gap:10, alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, fontWeight:500, textTransform:'capitalize' }}>{nome}</div>
                  <div>
                    <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                      <div style={{ width:`${score}%`, height:'100%', background:corScore(score), borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:10, color:C.muted }}>{item.acoes?.[nome] || ''}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:corScore(score), textAlign:'right' }}>{score}</div>
                </div>
              ))}
            </div>
          )}
          {aba === 'ads' && <SimuladorAds item={item} isMobile={isMobile} />}
          {aba === 'preco' && <PrecificacaoProduto item={item} isMobile={isMobile} />}
        </>
      )}
    </div>
  );
}

function SimuladorAds({ item, isMobile }) {
  const [margem, setMargem] = useState(20);
  const [estagio, setEstagio] = useState('crescimento');
  const [budget, setBudget] = useState(50);
  const roasMin = (100/margem).toFixed(1);
  const roasRec = estagio==='novo' ? Math.max(2, roasMin-2) : estagio==='crescimento' ? Number(roasMin)+2 : Number(roasMin)+4;
  const inputStyle = { width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' };
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
      {!item.pode_anunciar && <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:12, color:'#f09575', fontSize:13, marginBottom:14 }}>⚠️ Não recomendado anunciar agora.</div>}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap:10, marginBottom:14 }}>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Margem (%)</label><input type="number" value={margem} onChange={e=>setMargem(Number(e.target.value))} style={inputStyle} /></div>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Estágio</label><select value={estagio} onChange={e=>setEstagio(e.target.value)} style={inputStyle}><option value="novo">Novo</option><option value="crescimento">Crescimento</option><option value="consolidado">Consolidado</option></select></div>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Budget/dia (R$)</label><input type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))} style={inputStyle} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[['ROAS mínimo',`${roasMin}x`],['ROAS objetivo',`${roasRec}x`],['Invest. mensal',`R$${budget*30}`]].map(([l,v]) => (
          <div key={l} style={{ background:C.input, borderRadius:8, padding:12, textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:700, color:C.green }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, padding:10, background:'#0d2d1a', borderRadius:8, fontSize:12, color:'#9FE1CB' }}>📌 Desde out/2025 o ML usa ROAS como métrica principal.</div>
    </div>
  );
}

function PrecificacaoProduto({ item, isMobile }) {
  const [cmv, setCmv] = useState(item.preco*0.6);
  const [tipo, setTipo] = useState(0.17);
  const [frete, setFrete] = useState(15);
  const [imposto, setImposto] = useState(0.10);
  const [margem, setMargem] = useState(20);
  const total = tipo + imposto + margem/100;
  const pi = total < 1 ? (cmv+frete)/(1-total) : 0;
  const lucro = pi - cmv - pi*tipo - frete - pi*imposto;
  const ma = item.preco > 0 ? (item.preco-cmv-item.preco*tipo-frete-item.preco*imposto)/item.preco*100 : 0;
  const corScore = (s) => s < 60 ? C.red : s < 80 ? C.yellow : C.green;
  const inputStyle = { width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' };
  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
        {[['CMV',cmv,setCmv,'number'],['Tipo',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime',imposto,setImposto,'select-imp'],['Margem (%)',margem,setMargem,'number']].map(([l,v,s,t]) => (
          <div key={l} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
            {t==='number' && <input type="number" value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle} />}
            {t==='select-tipo' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={0.12}>Clássico (12%)</option><option value={0.17}>Premium (17%)</option></select>}
            {t==='select-frete' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={15}>Padrão (~R$15)</option><option value={0}>Full (R$0)</option><option value={8}>Flex (~R$8)</option></select>}
            {t==='select-imp' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={0.06}>MEI (6%)</option><option value={0.10}>Simples (10%)</option><option value={0.15}>Lucro Presumido (15%)</option></select>}
          </div>
        ))}
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
        <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:8, padding:16, textAlign:'center', marginBottom:14 }}>
          <div style={{ fontSize:11, color:C.green, marginBottom:4 }}>Preço ideal para {margem}% de margem</div>
          <div style={{ fontSize:32, fontWeight:900, color:C.green }}>R${pi.toFixed(2)}</div>
        </div>
        {[['Preço atual',`R$${item.preco}`,C.text],['Lucro líquido',`R$${lucro.toFixed(2)}`,lucro>0?C.green:C.red],['Margem atual',`${ma.toFixed(1)}%`,ma>10?C.green:ma>0?C.yellow:C.red]].map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
            <span style={{ color:C.muted }}>{l}</span><span style={{ fontWeight:600, color:c }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Calculadora({ isMobile }) {
  const [cmv, setCmv] = useState(150);
  const [tipo, setTipo] = useState(0.17);
  const [frete, setFrete] = useState(15);
  const [imposto, setImposto] = useState(0.10);
  const [margem, setMargem] = useState(20);
  const [precoAtual, setPrecoAtual] = useState(0);
  const total = tipo + imposto + margem/100;
  const pi = total < 1 ? (cmv+frete)/(1-total) : 0;
  const com = pi*tipo; const imp = pi*imposto;
  const lucro = pi - cmv - com - frete - imp;
  const ma = precoAtual > 0 ? (precoAtual-cmv-precoAtual*tipo-frete-precoAtual*imposto)/precoAtual*100 : null;
  const inputStyle = { width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' };
  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Calculadora de precificação</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Calcule o preço ideal com todos os custos reais do ML 2026</div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:18 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
          {[['CMV',cmv,setCmv,'number'],['Tipo',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime',imposto,setImposto,'select-imp'],['Margem (%)',margem,setMargem,'number'],['Preço atual',precoAtual,setPrecoAtual,'number']].map(([l,v,s,t]) => (
            <div key={l} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
              {t==='number' && <input type="number" value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle} />}
              {t==='select-tipo' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={0.12}>Clássico (11-14%)</option><option value={0.17}>Premium (16-19%)</option></select>}
              {t==='select-frete' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={15}>Padrão (~R$15)</option><option value={0}>Full (R$0)</option><option value={8}>Flex (~R$8)</option></select>}
              {t==='select-imp' && <select value={v} onChange={e=>s(Number(e.target.value))} style={inputStyle}><option value={0.06}>MEI (6%)</option><option value={0.10}>Simples (10%)</option><option value={0.15}>Lucro Presumido (15%)</option></select>}
            </div>
          ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
          <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:8, padding:16, textAlign:'center', marginBottom:14 }}>
            <div style={{ fontSize:12, color:C.green, marginBottom:4 }}>Preço ideal para {margem}% de margem</div>
            <div style={{ fontSize:36, fontWeight:900, color:C.green }}>R${pi.toFixed(2)}</div>
          </div>
          {[['Comissão ML',`- R$${com.toFixed(2)}`,C.red],['Frete',`- R$${frete.toFixed(2)}`,C.red],['Impostos',`- R$${imp.toFixed(2)}`,C.red],['Lucro líquido',`R$${lucro.toFixed(2)}`,lucro>0?C.green:C.red]].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
              <span style={{ color:C.muted }}>{l}</span><span style={{ fontWeight:600, color:c }}>{v}</span>
            </div>
          ))}
          {ma !== null && <div style={{ marginTop:12, padding:10, background:`${ma>10?C.green:ma>0?C.yellow:C.red}15`, borderRadius:6, fontSize:12, color:ma>10?C.green:ma>0?C.yellow:C.red }}>{ma>10?`✅ Margem atual: ${ma.toFixed(1)}%`:ma>0?`🟡 Margem apertada: ${ma.toFixed(1)}%`:`⚠️ Vendendo no prejuízo: ${ma.toFixed(1)}%`}</div>}
        </div>
      </div>
    </div>
  );
}

function PlanoAcao({ diagnostico, setPagina, isMobile }) {
  if (!diagnostico) return (
    <div style={{ padding: isMobile ? 20 : 24, textAlign:'center', color:C.muted }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
      <div style={{ fontSize:14, marginBottom:16 }}>Gere o diagnóstico primeiro na Visão Geral.</div>
      <button onClick={() => setPagina('visao')} style={{ padding:'10px 22px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
        Ir para Visão Geral →
      </button>
    </div>
  );

  const receita = diagnostico?.metricas?.receita;
  const alertasRanqueados = [...diagnostico.alertas]
    .map(a => ({ ...a, impacto: calcImpactoAlerta(a, receita) }))
    .sort((a, b) => b.impacto - a.impacto);

  const totalImpacto = alertasRanqueados.reduce((s, a) => s + a.impacto, 0);
  const criticos = alertasRanqueados.filter(a => a.tipo === 'CRITICO');
  const atencoes = alertasRanqueados.filter(a => a.tipo === 'ATENCAO');

  const dias = [];
  let diaAtual = 1;
  [...criticos, ...atencoes].forEach((a, i) => {
    if (diaAtual > 7) return;
    const diaLabel = diaAtual === 1 ? 'Dia 1 — Hoje' : diaAtual === 2 ? 'Dia 2 — Amanhã' : `Dia ${diaAtual}`;
    dias.push({ dia: diaLabel, alerta: a, critico: a.tipo === 'CRITICO' });
    diaAtual += i < criticos.length ? 1 : 2;
  });

  return (
    <div style={{ padding: isMobile ? 16 : 24, maxWidth:760, margin:'0 auto' }}>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📋 Plano de recuperação</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Baseado no diagnóstico de {diagnostico.gerado_em} · ordenado por impacto financeiro</div>

      {totalImpacto > 0 && (
        <div style={{ background:'#0a1f12', border:`1px solid ${C.green}40`, borderRadius:12, padding:18, marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, color:'#9FE1CB', marginBottom:3 }}>Se executar este plano em 7 dias:</div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight:900, color:C.green }}>+R${fmt(totalImpacto)}/mês estimado</div>
          </div>
          <div style={{ fontSize:36 }}>🎯</div>
        </div>
      )}

      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:19, top:0, bottom:0, width:2, background:C.border }} />
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {dias.map((d, i) => (
            <div key={i} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background: d.critico ? C.red : C.yellow, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, zIndex:1, border:`3px solid ${C.bg}` }}>
                {i+1}
              </div>
              <div style={{ flex:1, background:C.card, border:`1px solid ${d.critico ? C.red+'40' : C.yellow+'40'}`, borderRadius:10, padding:'12px 14px', marginTop:4 }}>
                <div style={{ fontSize:10, color: d.critico ? C.red : C.yellow, fontWeight:700, marginBottom:5 }}>{d.dia} · {d.critico ? '🔴 Crítico' : '🟡 Atenção'}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{d.alerta.mensagem}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom: d.alerta.impacto > 0 ? 8 : 0 }}>{d.alerta.acao}</div>
                {d.alerta.impacto > 0 && (
                  <div style={{ display:'inline-flex', alignItems:'center', background:`${C.green}15`, border:`1px solid ${C.green}30`, borderRadius:5, padding:'3px 10px' }}>
                    <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>+R${fmt(d.alerta.impacto)}/mês</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, zIndex:1, border:`3px solid ${C.bg}` }}>✓</div>
            <div style={{ flex:1, background:'#0d2d1a', border:`1px solid ${C.green}40`, borderRadius:10, padding:'12px 14px', marginTop:4 }}>
              <div style={{ fontSize:10, color:C.green, fontWeight:700, marginBottom:5 }}>Dia 7 — Verificação</div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>Atualize o diagnóstico e confirme a recuperação</div>
              <div style={{ fontSize:12, color:'#9FE1CB' }}>Clique em "Atualizar diagnóstico" para ver o novo score.</div>
            </div>
          </div>
        </div>
      </div>

      {criticos.length === 0 && atencoes.length === 0 && (
        <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:10, padding:20, textAlign:'center', color:'#9FE1CB' }}>
          🎉 Operação saudável! Continue monitorando.
        </div>
      )}
    </div>
  );
}
