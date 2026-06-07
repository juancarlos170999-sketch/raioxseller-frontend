import React, { useState } from 'react';
import { ml, pagamento } from '../api';
import Planos from './Planos';
import Concorrentes from './Concorrentes';
import Promocoes from './Promocoes';

const C = {
  bg:'#0a0a12', sidebar:'#0f0f1a', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', yellow:'#f5a623',
  red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e', purple:'#7c3aed'
};

const CLIENT_ID = '8361153242610469';
const REDIRECT_URI = 'https://raioxseller-frontend.vercel.app/callback';

function corScore(s) { return s < 60 ? C.red : s < 80 ? C.yellow : C.green; }
function isPro(u) { return ['pro','agencia'].includes(u?.plano); }
function fmt(n) { return (n||0).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:0}); }

function ScoreCard({ label, value }) {
  const c = corScore(value);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:12, textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:800, color:c }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
    </div>
  );
}

function BloqueadoPro({ setPagina, recurso }) {
  return (
    <div style={{ padding:60, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Recurso exclusivo Pro</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>{recurso} está disponível no plano Pro e Agência.</div>
      <button onClick={() => setPagina('planos')} style={{ padding:'12px 28px', background:C.yellow, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
        ⬆ Fazer upgrade para Pro — R$197/mês
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

  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  const planoLabel = { starter:'STARTER', pro:'PRO', agencia:'AGÊNCIA', iniciante:'STARTER' };
  const planoCor = { starter:C.blue, pro:C.yellow, agencia:C.green, iniciante:C.blue };

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
      const r = await ml.diagnostico(mlAuth.ml_user_id, mlAuth.access_token, usuario.id, mlAuth.conta_ml_id || '');
      setDiagnostico(r);
    } catch { alert('Erro ao gerar diagnóstico.'); }
    setLoading(false);
  };

  const nivel_labels = { '5_green':'🟢 Verde', '4_light_green':'🟢 Verde claro', '3_yellow':'🟡 Amarelo', '2_orange':'🟠 Laranja', '1_red':'🔴 Vermelho' };

  const navItems = [
    { id:'visao', label:'Visão geral', icon:'◉', secao:'ANÁLISE' },
    { id:'analisar', label:'Analisar produto', icon:'⬡', pro:true },
    { id:'concorrentes', label:'Concorrentes', icon:'⊕', pro:true },
    { id:'promocoes', label:'Promoções', icon:'🏷', pro:true },
    { id:'calculadora', label:'Calculadora', icon:'⊞', secao:'FERRAMENTAS' },
    { id:'plano', label:'Plano de ação', icon:'☑' },
  ];

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, fontFamily:'Inter, sans-serif', color:C.text }}>
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
                {item.pro && !isPro(usuario) && <span style={{ fontSize:9, background:C.yellow, color:'#fff', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>PRO</span>}
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
          <button onClick={() => setPagina('planos')} style={{ width:'100%', padding:'7px 0', background:'transparent', color:C.yellow, border:`1px solid ${C.yellow}40`, borderRadius:6, fontSize:12, cursor:'pointer', marginBottom:6 }}>
            ⬆ Fazer upgrade
          </button>
          <button onClick={onLogout} style={{ width:'100%', padding:'7px 0', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, cursor:'pointer' }}>Sair</button>
        </div>
      </div>

      <div style={{ flex:1, overflow:'auto' }}>
        {pagina === 'visao' && <VisaoGeral diagnostico={diagnostico} loading={loading} onGerar={gerarDiagnostico} mlAuth={mlAuth} nivel_labels={nivel_labels} usuario={usuario} setPagina={setPagina} />}
        {pagina === 'analisar' && (isPro(usuario) ? <AnalisarProduto mlAuth={mlAuth} usuario={usuario} setPagina={setPagina} /> : <BloqueadoPro setPagina={setPagina} recurso="Análise de produto por MLB" />)}
        {pagina === 'concorrentes' && (isPro(usuario) ? <Concorrentes mlAuth={mlAuth} /> : <BloqueadoPro setPagina={setPagina} recurso="Análise de concorrentes" />)}
        {pagina === 'promocoes' && (isPro(usuario) ? <Promocoes mlAuth={mlAuth} /> : <BloqueadoPro setPagina={setPagina} recurso="Módulo de promoções" />)}
        {pagina === 'calculadora' && <Calculadora />}
        {pagina === 'plano' && <PlanoAcao diagnostico={diagnostico} setPagina={setPagina} />}
        {pagina === 'planos' && <Planos usuario={usuario} onVoltar={() => setPagina('visao')} onAtualizarUsuario={(u) => { localStorage.setItem('usuario', JSON.stringify(u)); window.location.reload(); }} />}
      </div>
    </div>
  );
}

function VisaoGeral({ diagnostico, loading, onGerar, mlAuth, nivel_labels, usuario, setPagina }) {
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
    oportunidades.push({ emoji:'⭐', texto:'Atendimento excelente — use isso como diferencial no título dos anúncios' });
  if (r?.nivel === '5_green' || r?.nivel === '4_light_green')
    oportunidades.push({ emoji:'🏆', texto:'Reputação verde — você aparece antes da concorrência. Maximize estoque agora.' });

  const medalhas = ['🥇','🥈','🥉','4️⃣','5️⃣'];

  return (
    <div style={{ padding:24, maxWidth:960, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700 }}>Visão geral</div>
          <div style={{ fontSize:12, color:C.muted }}>Diagnóstico completo da sua conta Mercado Livre</div>
        </div>
        <button onClick={onGerar} disabled={loading || !mlAuth} style={{ padding:'10px 22px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', opacity:!mlAuth?0.5:1 }}>
          {loading ? '⏳ Analisando...' : r ? '🔄 Atualizar diagnóstico' : '▶ Gerar diagnóstico'}
        </button>
      </div>

      {!r ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>
            {mlAuth ? 'Pronto para analisar sua conta' : 'Conecte sua conta Mercado Livre primeiro'}
          </div>
          <div style={{ fontSize:13, color:C.muted }}>
            {mlAuth ? 'Clique em "Gerar diagnóstico" e descubra quanto você pode estar perdendo por mês.' : 'Use o painel lateral para autorizar sua conta ML.'}
          </div>
        </div>
      ) : (
        <>
          {/* HERO: RECEITA PERDIDA */}
          {receita && receita.receita_perdida_estimada > 0 && (
            <div style={{ background:'linear-gradient(135deg, #2d1b1b 0%, #1a0f0f 100%)', border:`2px solid ${C.red}50`, borderRadius:16, padding:28, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                <div style={{ flex:1, minWidth:260 }}>
                  <div style={{ fontSize:11, color:'#f09575', letterSpacing:'0.08em', fontWeight:700, marginBottom:8 }}>💸 DIAGNÓSTICO DE RECEITA</div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:8 }}>
                    Você está perdendo{' '}
                    <span style={{ color:C.red }}>R$ {fmt(receita.receita_perdida_estimada)}/mês</span>
                  </div>
                  <div style={{ fontSize:13, color:'#f09575', marginBottom:16 }}>
                    Se corrigir os {alertasRanqueados.filter(a=>a.tipo==='CRITICO').length || alertasRanqueados.length} problema{alertasRanqueados.length!==1?'s':''} abaixo, sua conta pode recuperar até{' '}
                    <strong style={{ color:'#fff' }}>
                      {faturamentoAtual > 0 ? `${Math.round((receita.receita_perdida_estimada/faturamentoPotencial)*100)}%` : 'parte significativa'} do faturamento
                    </strong>.
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:8 }}>
                    {receita.perda_reputacao > 0 && (
                      <div style={{ background:'#3d1b1b', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:10, color:'#f09575', marginBottom:2 }}>Reputação</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.red }}>- R${fmt(receita.perda_reputacao)}</div>
                      </div>
                    )}
                    {receita.perda_operacao > 0 && (
                      <div style={{ background:'#3d1b1b', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:10, color:'#f09575', marginBottom:2 }}>Atrasos</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.red }}>- R${fmt(receita.perda_operacao)}</div>
                      </div>
                    )}
                    {receita.perda_estoque > 0 && (
                      <div style={{ background:'#3d1b1b', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:10, color:'#f09575', marginBottom:2 }}>Estoque</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.red }}>- R${fmt(receita.perda_estoque)}</div>
                      </div>
                    )}
                    {receita.perda_atendimento > 0 && (
                      <div style={{ background:'#3d1b1b', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontSize:10, color:'#f09575', marginBottom:2 }}>Atendimento</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.red }}>- R${fmt(receita.perda_atendimento)}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'center', background:'#3d1b1b', border:`2px solid ${C.red}`, borderRadius:14, padding:'20px 28px', minWidth:150 }}>
                  <div style={{ fontSize:11, color:'#f09575', marginBottom:6, fontWeight:600 }}>TOTAL/MÊS</div>
                  <div style={{ fontSize:38, fontWeight:900, color:C.red, lineHeight:1 }}>R${fmt(receita.receita_perdida_estimada)}</div>
                  <div style={{ fontSize:10, color:'#f09575', marginTop:6 }}>ticket médio R${receita.ticket_medio} · {receita.vendas_60d} vendas/60d</div>
                </div>
              </div>
            </div>
          )}

          {/* SCORE + POTENCIAL */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{r.seller} · {nivel_labels[r.nivel] || r.nivel}</div>
                  <div style={{ fontSize:16, fontWeight:700 }}>{r.seller}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{r.mercadolider}</div>
                </div>
                <div style={{ textAlign:'center', background:`${cor}15`, border:`2px solid ${cor}`, borderRadius:10, padding:'10px 18px' }}>
                  <div style={{ fontSize:38, fontWeight:900, color:cor, lineHeight:1 }}>{r.score_total}</div>
                  <div style={{ fontSize:10, color:cor, fontWeight:600, marginTop:2 }}>{r.status}</div>
                </div>
              </div>
              <div style={{ height:8, background:C.border, borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:`${potencial}%`, height:'100%', background:`linear-gradient(90deg, ${C.red}, ${C.yellow}, ${C.green})`, borderRadius:4 }} />
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Sua conta usa <strong style={{ color:cor }}>{potencial}% do potencial</strong> do Mercado Livre</div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:12, fontWeight:600 }}>📈 POTENCIAL DE FATURAMENTO</div>
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
                <div style={{ flex:1, background:C.input, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Faturamento atual</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.yellow }}>R${fmt(faturamentoAtual)}<span style={{ fontSize:11, color:C.muted }}>/mês</span></div>
                </div>
                <div style={{ fontSize:18, color:C.muted }}>→</div>
                <div style={{ flex:1, background:'#0d2d1a', borderRadius:8, padding:'12px 16px', textAlign:'center', border:`1px solid ${C.green}30` }}>
                  <div style={{ fontSize:10, color:C.green, marginBottom:4 }}>Potencial estimado</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.green }}>R${fmt(faturamentoPotencial)}<span style={{ fontSize:11, color:C.muted }}>/mês</span></div>
                </div>
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Estimativa com base nas métricas dos últimos 60 dias.</div>
            </div>
          </div>

          {/* SCORES 5 CATEGORIAS */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 }}>
            {[['Reputação','reputacao'],['Operação','operacao'],['Estoque','estoque'],['Atendimento','atendimento'],['Publicidade','publicidade']].map(([label,key]) => (
              <ScoreCard key={key} label={label} value={r.scores[key]} />
            ))}
          </div>

          {/* RANKING DE PRIORIDADES */}
          {alertasRanqueados.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>🏆 Ranking de prioridades</div>
                  <div style={{ fontSize:12, color:C.muted }}>Ordenado pelo maior impacto financeiro</div>
                </div>
                <button onClick={() => setPagina('plano')} style={{ padding:'6px 14px', background:'transparent', color:C.green, border:`1px solid ${C.green}40`, borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
                  Ver plano de 7 dias →
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {alertasRanqueados.map((a, i) => {
                  const critico = a.tipo === 'CRITICO';
                  const tc = critico ? C.red : C.yellow;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, background: critico ? '#2d1b1b' : '#2d2418', border:`1px solid ${tc}30`, borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ fontSize:22, width:32, textAlign:'center', flexShrink:0 }}>{medalhas[i] || '▪'}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                          <span style={{ background:tc, color:'#fff', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>{critico ? 'Crítico' : 'Atenção'}</span>
                          <span style={{ fontSize:11, color:C.muted }}>{a.categoria}</span>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{a.mensagem}</div>
                        <div style={{ fontSize:12, color:'#a0a0c0' }}>{a.acao}</div>
                      </div>
                      {a.impacto > 0 && (
                        <div style={{ textAlign:'center', background:`${C.green}15`, border:`1px solid ${C.green}30`, borderRadius:8, padding:'10px 16px', flexShrink:0, minWidth:110 }}>
                          <div style={{ fontSize:10, color:C.green, marginBottom:2, fontWeight:600 }}>RECUPERAR</div>
                          <div style={{ fontSize:16, fontWeight:800, color:C.green }}>+R${fmt(a.impacto)}</div>
                          <div style={{ fontSize:9, color:C.muted }}>por mês</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalRecuperavel > 0 && (
                <div style={{ marginTop:14, padding:'12px 16px', background:'#0d2d1a', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:12, color:'#9FE1CB' }}>💰 Potencial total ao corrigir todos os problemas</div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.green }}>+R${fmt(totalRecuperavel)}/mês</div>
                </div>
              )}
            </div>
          )}

          {/* GANHOS RÁPIDOS */}
          {ganhosRapidos.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.yellow}30`, borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>⚡ Ganhos rápidos</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>Ações simples que você pode fazer ainda hoje</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ganhosRapidos.map((a, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#2d2418', borderRadius:8, padding:'10px 14px', gap:12 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center', flex:1 }}>
                      <span style={{ fontSize:16 }}>⚡</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.mensagem}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{a.acao}</div>
                      </div>
                    </div>
                    {a.impacto > 0 && <div style={{ fontSize:13, fontWeight:700, color:C.yellow, flexShrink:0 }}>+R${fmt(a.impacto)}/mês</div>}
                  </div>
                ))}
              </div>
              {ganhosRapidos.reduce((s,a)=>s+a.impacto,0) > 0 && (
                <div style={{ marginTop:12, fontSize:13, color:C.yellow, fontWeight:700, textAlign:'right' }}>
                  Potencial total: +R${fmt(ganhosRapidos.reduce((s,a)=>s+a.impacto,0))}/mês
                </div>
              )}
            </div>
          )}

          {/* OPORTUNIDADES */}
          {oportunidades.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.blue}30`, borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>🚀 Oportunidades detectadas</div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>Ações de crescimento identificadas na sua conta</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {oportunidades.map((o, i) => (
                  <div key={i} style={{ background:'#0f1a2d', border:`1px solid ${C.blue}30`, borderRadius:8, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{o.emoji}</span>
                    <div style={{ fontSize:12, color:'#a0b8e0', lineHeight:1.5 }}>{o.texto}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA PLANO DE AÇÃO */}
          <div style={{ background:'linear-gradient(135deg, #0d2d1a, #0a1f12)', border:`1px solid ${C.green}40`, borderRadius:12, padding:20, display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>📋 Pronto para agir?</div>
              <div style={{ fontSize:12, color:'#9FE1CB' }}>Veja o plano de recuperação de 7 dias com as ações priorizadas por impacto.</div>
            </div>
            <button onClick={() => setPagina('plano')} style={{ padding:'10px 22px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
              Ver plano de 7 dias →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AnalisarProduto({ mlAuth, usuario, setPagina }) {
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

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Analisar produto</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Cole o MLB para diagnóstico completo</div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={mlb} onChange={e=>setMlb(e.target.value)} placeholder="Ex: MLB4341336433 ou 4341336433"
          style={{ flex:1, padding:'10px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13 }} />
        <button onClick={analisar} disabled={loading || !mlAuth} style={{ padding:'10px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          {loading ? 'Analisando...' : '🔍 Analisar'}
        </button>
      </div>

      {item && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4, fontFamily:'monospace' }}>{item.item_id}</div>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:10 }}>{item.titulo}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[`R$${item.preco}`, `Estoque: ${item.estoque}`, `Vendas: ${item.vendas}`, item.logistica||'Padrão'].map((t,i) => (
                    <span key={i} style={{ background:C.input, color:C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:'center', background:`${corScore(item.score_total)}15`, border:`2px solid ${corScore(item.score_total)}`, borderRadius:10, padding:'12px 20px' }}>
                <div style={{ fontSize:36, fontWeight:900, color:corScore(item.score_total) }}>{item.score_total}</div>
                <div style={{ fontSize:10, color:corScore(item.score_total) }}>/100</div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
            {[['fatores','📊 8 Fatores'],['ads','📢 Simulador Ads'],['preco','💰 Precificação']].map(([id,label]) => (
              <div key={id} onClick={()=>setAba(id)} style={{ padding:'8px 16px', fontSize:12, cursor:'pointer', borderBottom:`2px solid ${aba===id?C.green:'transparent'}`, color:aba===id?C.green:C.muted, marginBottom:-1 }}>{label}</div>
            ))}
          </div>

          {aba === 'fatores' && item.scores && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              {Object.entries(item.scores).map(([nome, score]) => (
                <div key={nome} style={{ display:'grid', gridTemplateColumns:'110px 1fr 36px', gap:12, alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, fontWeight:500, textTransform:'capitalize' }}>{nome}</div>
                  <div>
                    <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                      <div style={{ width:`${score}%`, height:'100%', background:corScore(score), borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{item.acoes?.[nome] || ''}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:corScore(score), textAlign:'right' }}>{score}</div>
                </div>
              ))}
            </div>
          )}
          {aba === 'ads' && <SimuladorAds item={item} />}
          {aba === 'preco' && <PrecificacaoProduto item={item} />}
        </>
      )}
    </div>
  );
}

function SimuladorAds({ item }) {
  const [margem, setMargem] = useState(20);
  const [estagio, setEstagio] = useState('crescimento');
  const [budget, setBudget] = useState(50);
  const roasMin = (100/margem).toFixed(1);
  const roasRec = estagio==='novo' ? Math.max(2, roasMin-2) : estagio==='crescimento' ? Number(roasMin)+2 : Number(roasMin)+4;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
      {!item.pode_anunciar && <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:12, color:'#f09575', fontSize:13, marginBottom:16 }}>⚠️ Não recomendado anunciar agora.</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Margem (%)</label><input type="number" value={margem} onChange={e=>setMargem(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} /></div>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Estágio</label><select value={estagio} onChange={e=>setEstagio(e.target.value)} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value="novo">Novo</option><option value="crescimento">Crescimento</option><option value="consolidado">Consolidado</option></select></div>
        <div><label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Budget/dia (R$)</label><input type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[['ROAS mínimo',`${roasMin}x`],['ROAS objetivo',`${roasRec}x`],['Invest. mensal',`R$${budget*30}`]].map(([l,v]) => (
          <div key={l} style={{ background:C.input, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:C.green }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, padding:12, background:'#0d2d1a', borderRadius:8, fontSize:12, color:'#9FE1CB' }}>📌 Desde outubro/2025 o ML usa ROAS como métrica principal. Aguarde 28 dias antes de ajustar lances.</div>
    </div>
  );
}

function PrecificacaoProduto({ item }) {
  const [cmv, setCmv] = useState(item.preco*0.6);
  const [tipo, setTipo] = useState(0.17);
  const [frete, setFrete] = useState(15);
  const [imposto, setImposto] = useState(0.10);
  const [margem, setMargem] = useState(20);
  const total = tipo + imposto + margem/100;
  const pi = total < 1 ? (cmv+frete)/(1-total) : 0;
  const lucro = pi - cmv - pi*tipo - frete - pi*imposto;
  const ma = item.preco > 0 ? (item.preco-cmv-item.preco*tipo-frete-item.preco*imposto)/item.preco*100 : 0;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
        {[['CMV',cmv,setCmv,'number'],['Tipo',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime',imposto,setImposto,'select-imp'],['Margem (%)',margem,setMargem,'number']].map(([l,v,s,t]) => (
          <div key={l} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
            {t==='number' && <input type="number" value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} />}
            {t==='select-tipo' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.12}>Clássico (12%)</option><option value={0.17}>Premium (17%)</option></select>}
            {t==='select-frete' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={15}>Padrão (~R$15)</option><option value={0}>Full (R$0)</option><option value={8}>Flex (~R$8)</option></select>}
            {t==='select-imp' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.06}>MEI (6%)</option><option value={0.10}>Simples (10%)</option><option value={0.15}>Lucro Presumido (15%)</option></select>}
          </div>
        ))}
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
        <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:8, padding:16, textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.green, marginBottom:4 }}>Preço ideal para {margem}% de margem</div>
          <div style={{ fontSize:34, fontWeight:900, color:C.green }}>R${pi.toFixed(2)}</div>
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

function Calculadora() {
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
  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Calculadora de precificação</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Calcule o preço ideal com todos os custos reais do ML 2026</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          {[['CMV',cmv,setCmv,'number'],['Tipo',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime',imposto,setImposto,'select-imp'],['Margem (%)',margem,setMargem,'number'],['Preço atual',precoAtual,setPrecoAtual,'number']].map(([l,v,s,t]) => (
            <div key={l} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
              {t==='number' && <input type="number" value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} />}
              {t==='select-tipo' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.12}>Clássico (11-14%)</option><option value={0.17}>Premium (16-19%)</option></select>}
              {t==='select-frete' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={15}>Padrão (~R$15)</option><option value={0}>Full (R$0)</option><option value={8}>Flex (~R$8)</option></select>}
              {t==='select-imp' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.06}>MEI (6%)</option><option value={0.10}>Simples (10%)</option><option value={0.15}>Lucro Presumido (15%)</option></select>}
            </div>
          ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:8, padding:16, textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:12, color:C.green, marginBottom:4 }}>Preço ideal para {margem}% de margem</div>
            <div style={{ fontSize:38, fontWeight:900, color:C.green }}>R${pi.toFixed(2)}</div>
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

function PlanoAcao({ diagnostico, setPagina }) {
  if (!diagnostico) return (
    <div style={{ padding:24, textAlign:'center', color:C.muted }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
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
    <div style={{ padding:24, maxWidth:760, margin:'0 auto' }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>📋 Plano de recuperação</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Baseado no diagnóstico de {diagnostico.gerado_em} · ordenado por impacto financeiro</div>

      {totalImpacto > 0 && (
        <div style={{ background:'linear-gradient(135deg, #0d2d1a, #0a1f12)', border:`1px solid ${C.green}40`, borderRadius:12, padding:20, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, color:'#9FE1CB', marginBottom:4 }}>Se executar este plano em 7 dias:</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.green }}>+R${fmt(totalImpacto)}/mês estimado de recuperação</div>
          </div>
          <div style={{ fontSize:40 }}>🎯</div>
        </div>
      )}

      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:19, top:0, bottom:0, width:2, background:C.border }} />
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {dias.map((d, i) => (
            <div key={i} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background: d.critico ? C.red : C.yellow, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, zIndex:1, border:`3px solid ${C.bg}` }}>
                {i+1}
              </div>
              <div style={{ flex:1, background:C.card, border:`1px solid ${d.critico ? C.red+'40' : C.yellow+'40'}`, borderRadius:10, padding:'14px 16px', marginTop:4 }}>
                <div style={{ fontSize:11, color: d.critico ? C.red : C.yellow, fontWeight:700, marginBottom:6 }}>{d.dia} · {d.critico ? '🔴 Crítico' : '🟡 Atenção'}</div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:6 }}>{d.alerta.mensagem}</div>
                <div style={{ fontSize:12, color:'#a0a0c0', marginBottom: d.alerta.impacto > 0 ? 10 : 0 }}>{d.alerta.acao}</div>
                {d.alerta.impacto > 0 && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${C.green}15`, border:`1px solid ${C.green}30`, borderRadius:6, padding:'4px 10px' }}>
                    <span style={{ fontSize:11, color:C.green, fontWeight:600 }}>Impacto estimado: +R${fmt(d.alerta.impacto)}/mês</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, zIndex:1, border:`3px solid ${C.bg}` }}>
              ✓
            </div>
            <div style={{ flex:1, background:'#0d2d1a', border:`1px solid ${C.green}40`, borderRadius:10, padding:'14px 16px', marginTop:4 }}>
              <div style={{ fontSize:11, color:C.green, fontWeight:700, marginBottom:6 }}>Dia 7 — Verificação</div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>Atualize o diagnóstico e confirme a recuperação</div>
              <div style={{ fontSize:12, color:'#9FE1CB' }}>Volte aqui e clique em "Atualizar diagnóstico" para ver o novo score e o impacto das correções.</div>
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
