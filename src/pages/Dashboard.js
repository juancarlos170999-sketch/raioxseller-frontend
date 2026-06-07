import React, { useState, useEffect } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', sidebar:'#0f0f1a', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', yellow:'#f5a623',
  red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e'
};

const CLIENT_ID = '8361153242610469';
const REDIRECT_URI = 'https://httpbingo.org/get';

function corScore(s) { return s < 60 ? C.red : s < 80 ? C.yellow : C.green; }

function ScoreCard({ label, value }) {
  const c = corScore(value);
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:12, textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:800, color:c }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{label}</div>
    </div>
  );
}

function AlertCard({ alerta }) {
  const critico = alerta.tipo === 'CRITICO';
  const tc = critico ? C.red : C.yellow;
  const tb = critico ? '#2d1b1b' : '#2d2418';
  return (
    <div style={{ background:tb, border:`1px solid ${tc}30`, borderRadius:10, padding:16, marginBottom:10 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <span style={{ background:tc, color:'#fff', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>{critico ? 'Crítico' : 'Atenção'}</span>
        <span style={{ fontSize:11, color:C.muted }}>{alerta.categoria}</span>
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:6 }}>{alerta.mensagem}</div>
      <div style={{ fontSize:12, color:'#a0a0c0', marginBottom:4 }}>{alerta.acao}</div>
      <div style={{ fontSize:10, color:C.muted }}>🔖 {alerta.referencia}</div>
    </div>
  );
}

export default function Dashboard({ usuario, mlAuth, onMlAuth, onLogout }) {
  const [pagina, setPagina] = useState('visao');
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [conectando, setConectando] = useState(false);

  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  const planoLabel = { starter:'STARTER', pro:'PRO', agencia:'AGÊNCIA' };
  const planoCor = { starter:C.blue, pro:C.yellow, agencia:C.green };

  const conectarML = async () => {
    if (!code.trim()) return;
    setConectando(true);
    try {
      const r = await ml.connect(code.trim(), usuario.id);
      if (r.success) { onMlAuth(r); setCode(''); }
      else alert('Código inválido. Tente novamente.');
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
    { id:'visao', label:'Visão geral', icon:'◉' },
    { id:'analisar', label:'Analisar produto', icon:'⬡' },
    { id:'calculadora', label:'Calculadora', icon:'⊞' },
    { id:'plano', label:'Plano de ação', icon:'☑' },
  ];

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, fontFamily:'Inter, sans-serif', color:C.text }}>
      
      {/* SIDEBAR */}
      <div style={{ width:220, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 12px', borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
          <div style={{ fontSize:15, fontWeight:700 }}>🔍 RaioxSeller</div>
          <div style={{ fontSize:11, color:C.muted }}>Diagnóstico ML</div>
        </div>

        <div style={{ fontSize:10, color:'#444', letterSpacing:'0.08em', padding:'8px 16px 4px', textTransform:'uppercase' }}>Análise</div>
        {navItems.map(item => (
          <div key={item.id} onClick={() => setPagina(item.id)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'9px 16px', cursor:'pointer', fontSize:13,
            color: pagina===item.id ? C.green : C.muted,
            background: pagina===item.id ? '#0d2d1a' : 'transparent',
            borderLeft: `2px solid ${pagina===item.id ? C.green : 'transparent'}`
          }}>
            <span>{item.icon}</span>{item.label}
          </div>
        ))}

        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, marginTop:'auto' }}>
          {!mlAuth ? (
            <div>
              <a href={authUrl} target="_blank" rel="noreferrer" style={{
                display:'block', background:C.green, color:'#fff', textAlign:'center', padding:'8px 0',
                borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none', marginBottom:8
              }}>🔗 Autorizar ML</a>
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Cole o código TG-..."
                style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:11, boxSizing:'border-box', marginBottom:6 }} />
              <button onClick={conectarML} disabled={conectando} style={{
                width:'100%', padding:'7px 0', background:C.green, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'
              }}>{conectando ? 'Conectando...' : 'Conectar'}</button>
            </div>
          ) : (
            <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:8, padding:'8px 12px', fontSize:12, color:'#9FE1CB', marginBottom:8 }}>
              ✅ {mlAuth.nickname}
            </div>
          )}
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{usuario.nome || usuario.email}</div>
            <span style={{ background:planoCor[usuario.plano]||C.blue, color:'#fff', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>{planoLabel[usuario.plano]||'STARTER'}</span>
          </div>
          <button onClick={onLogout} style={{ marginTop:8, width:'100%', padding:'7px 0', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, cursor:'pointer' }}>Sair</button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex:1, overflow:'auto' }}>
        {pagina === 'visao' && <VisaoGeral diagnostico={diagnostico} loading={loading} onGerar={gerarDiagnostico} mlAuth={mlAuth} nivel_labels={nivel_labels} />}
        {pagina === 'analisar' && <AnalisarProduto mlAuth={mlAuth} usuario={usuario} />}
        {pagina === 'calculadora' && <Calculadora />}
        {pagina === 'plano' && <PlanoAcao diagnostico={diagnostico} />}
      </div>
    </div>
  );
}

function VisaoGeral({ diagnostico, loading, onGerar, mlAuth, nivel_labels }) {
  const r = diagnostico;
  const cor = !r ? C.muted : r.score_total >= 80 ? C.green : r.score_total >= 60 ? C.yellow : C.red;
  const criticos = r ? r.alertas.filter(a => a.tipo==='CRITICO') : [];
  const atencoes = r ? r.alertas.filter(a => a.tipo==='ATENCAO') : [];
  const badges = [];
  if (r?.nivel === '3_yellow') badges.push({ label:'Reputação Amarela', bg:'#2d2418', color:'#FAC775' });
  if (r?.metricas?.estoque?.sem_full > 0) badges.push({ label:'Sem Full', bg:'#2d1b1b', color:'#f09575' });

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700 }}>Visão geral</div>
          <div style={{ fontSize:12, color:C.muted }}>Diagnóstico completo da sua conta</div>
        </div>
        <button onClick={onGerar} disabled={loading || !mlAuth} style={{
          padding:'8px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', opacity: !mlAuth ? 0.5 : 1
        }}>{loading ? 'Analisando...' : r ? '🔄 Atualizar' : '▶ Gerar diagnóstico'}</button>
      </div>

      {!r ? (
        <div style={{ textAlign:'center', padding:60, color:C.muted, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:14 }}>{mlAuth ? 'Clique em "Gerar diagnóstico" para analisar sua conta' : 'Conecte sua conta ML na barra lateral primeiro'}</div>
        </div>
      ) : (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{r.seller} · Mercado Livre Brasil · {r.gerado_em}</div>
                <div style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{r.seller}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>{nivel_labels[r.nivel] || r.nivel} · {r.mercadolider}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {badges.map((b,i) => <span key={i} style={{ background:b.bg, color:b.color, padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600 }}>{b.label}</span>)}
                </div>
              </div>
              <div style={{ textAlign:'center', background:`${cor}15`, border:`2px solid ${cor}`, borderRadius:12, padding:'14px 22px', minWidth:90 }}>
                <div style={{ fontSize:44, fontWeight:900, color:cor, lineHeight:1 }}>{r.score_total}</div>
                <div style={{ fontSize:10, color:cor, fontWeight:600, marginTop:2 }}>{r.status}</div>
              </div>
            </div>
          </div>

          {criticos.length > 0 && (
            <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:10, padding:'14px 18px', marginBottom:16, fontSize:13, color:'#f09575' }}>
              ⚠️ Sua conta tem <strong>{criticos.length} problema{criticos.length>1?'s':''} crítico{criticos.length>1?'s':''}</strong> que estão reduzindo sua visibilidade e receita. <strong>Resolva hoje.</strong>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 }}>
            {[['Reputação','reputacao'],['Operação','operacao'],['Estoque','estoque'],['Atendimento','atendimento'],['Publicidade','publicidade']].map(([label,key]) => (
              <ScoreCard key={key} label={label} value={r.scores[key]} />
            ))}
          </div>

          <div style={{ fontSize:12, fontWeight:600, color:C.muted, letterSpacing:'0.06em', marginBottom:10 }}>PROBLEMAS ENCONTRADOS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[...criticos, ...atencoes].map((a,i) => <AlertCard key={i} alerta={a} />)}
          </div>
        </>
      )}
    </div>
  );
}

function AnalisarProduto({ mlAuth, usuario }) {
  const [mlb, setMlb] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('fatores');

  const analisar = async () => {
    if (!mlb.trim() || !mlAuth) return;
    setLoading(true);
    try {
      const mlbFormatado = mlb.trim().toUpperCase().startsWith('MLB') ? mlb.trim().toUpperCase() : `MLB${mlb.trim()}`; const r = await ml.item(mlbFormatado, mlAuth.access_token, mlAuth.ml_user_id);
      setItem(r);
    } catch { alert('Erro ao analisar produto.'); }
    setLoading(false);
  };

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Analisar produto</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Cole o MLB para diagnóstico completo</div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input value={mlb} onChange={e=>setMlb(e.target.value.toUpperCase())} placeholder="Ex: MLB4341336433"
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

          {aba === 'fatores' && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              {item.scores && Object.entries(item.scores).map(([nome, score]) => (
                <div key={nome} style={{ display:'grid', gridTemplateColumns:'110px 1fr 36px', gap:12, alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, fontWeight:500, textTransform:'capitalize' }}>{nome}</div>
                  <div>
                    <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                      <div style={{ width:`${score}%`, height:'100%', background:corScore(score), borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{item.acoes[nome]}</div>
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
  const roasRec = estagio==='novo' ? Math.max(2,roasMin-2) : estagio==='crescimento' ? Number(roasMin)+2 : Number(roasMin)+4;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
      {!item.pode_anunciar && <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:12, color:'#f09575', fontSize:13, marginBottom:16 }}>⚠️ Não recomendado anunciar agora — resolva estoque e histórico primeiro.</div>}
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
        {[['CMV',cmv,setCmv,'number'],['Tipo',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime fiscal',imposto,setImposto,'select-imp'],['Margem (%)',margem,setMargem,'number']].map(([l,v,s,t]) => (
          <div key={l} style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
            {t === 'number' && <input type="number" value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} />}
            {t === 'select-tipo' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.12}>Clássico (12%)</option><option value={0.17}>Premium (17%)</option></select>}
            {t === 'select-frete' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={15}>Padrão (~R$15)</option><option value={0}>Full (R$0)</option><option value={8}>Flex (~R$8)</option></select>}
            {t === 'select-imp' && <select value={v} onChange={e=>s(Number(e.target.value))} style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}><option value={0.06}>MEI (6%)</option><option value={0.10}>Simples (10%)</option><option value={0.15}>Lucro Presumido (15%)</option></select>}
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
          {[['CMV (custo do produto)',cmv,setCmv,'number'],['Tipo de anúncio',tipo,setTipo,'select-tipo'],['Frete',frete,setFrete,'select-frete'],['Regime fiscal',imposto,setImposto,'select-imp'],['Margem desejada (%)',margem,setMargem,'number'],['Preço atual (opcional)',precoAtual,setPrecoAtual,'number']].map(([l,v,s,t]) => (
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
          <div style={{ fontSize:10, color:'#444', marginTop:10 }}>📌 Comissões 2026: Clássico 11-14%, Premium 16-19%.</div>
        </div>
      </div>
    </div>
  );
}

function PlanoAcao({ diagnostico }) {
  if (!diagnostico) return (
    <div style={{ padding:24, textAlign:'center', color:C.muted }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
      <div>Gere o diagnóstico primeiro na Visão Geral.</div>
    </div>
  );
  const criticos = diagnostico.alertas.filter(a=>a.tipo==='CRITICO');
  const atencoes = diagnostico.alertas.filter(a=>a.tipo==='ATENCAO');
  return (
    <div style={{ padding:24 }}>
      <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Plano de ação</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Baseado no diagnóstico de {diagnostico.gerado_em}</div>
      {criticos.length > 0 && <>
        <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:10 }}>🔴 Faça hoje</div>
        {criticos.map((a,i) => <AlertCard key={i} alerta={a} />)}
      </>}
      {atencoes.length > 0 && <>
        <div style={{ fontSize:13, fontWeight:700, color:C.yellow, margin:'20px 0 10px' }}>🟡 Esta semana</div>
        {atencoes.map((a,i) => <AlertCard key={i} alerta={a} />)}
      </>}
      {criticos.length===0 && atencoes.length===0 && <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:10, padding:20, textAlign:'center', color:'#9FE1CB' }}>🎉 Operação saudável! Continue monitorando.</div>}
    </div>
  );
}
