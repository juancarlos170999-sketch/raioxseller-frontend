import React, { useState, useEffect } from 'react';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e'
};
const API = 'https://dianostico-ml-production.up.railway.app';
const CURVA_COR = { A:'#00a650', B:'#f5a623', C:'#6b6b8a' };

function fmt(n) { return (n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtInt(n) { return (n||0).toLocaleString('pt-BR'); }

function Badge({ texto, cor }) {
  return <span style={{ background:cor+'22', color:cor, border:`1px solid ${cor}40`, borderRadius:5, padding:'2px 7px', fontSize:10, fontWeight:700 }}>{texto}</span>;
}

function DetalheModal({ produto, mlAuth, onFechar, isMobile }) {
  const [detalhe, setDetalhe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('geral');

  useEffect(() => {
    if (!produto) return;
    setLoading(true);
    fetch(`${API}/item/${produto.id}?token=${encodeURIComponent(mlAuth.access_token)}&user_id=${mlAuth.ml_user_id}`)
      .then(r => r.json())
      .then(d => { setDetalhe(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [produto]);

  const corScore = s => s < 60 ? C.red : s < 80 ? C.yellow : C.green;

  return (
    <div style={{ position:'fixed', inset:0, background:'#000000a0', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:'100%', maxWidth:640, maxHeight:'90vh', overflow:'auto' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{produto.titulo?.substring(0,60)}{produto.titulo?.length>60?'...':''}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{produto.id} · R${fmt(produto.preco)}</div>
          </div>
          <button onClick={onFechar} style={{ background:'transparent', border:'none', color:C.muted, fontSize:20, cursor:'pointer', padding:4 }}>✕</button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {/* Métricas do produto */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
            {[
              { label:'Curva ABC', valor: produto.curva, cor: CURVA_COR[produto.curva] },
              { label:'Receita 90d', valor: `R$${fmt(produto.receita_90d)}`, cor: C.green },
              { label:'Vendas 90d', valor: fmtInt(produto.vendas_90d), cor: C.text },
              { label:'FULL', valor: produto.em_full ? '✅ Ativo' : '✗ Inativo', cor: produto.em_full ? C.green : C.muted },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background:'#0f0f1a', borderRadius:8, padding:'10px 10px' }}>
                <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:cor }}>{valor}</div>
              </div>
            ))}
          </div>

          {/* Abas diagnóstico */}
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:14 }}>
            {[['geral','📊 Diagnóstico'],['ads','📢 Ads'],['preco','💰 Preço']].map(([id,label]) => (
              <div key={id} onClick={() => setAba(id)} style={{ padding:'8px 14px', fontSize:12, cursor:'pointer', borderBottom:`2px solid ${aba===id?C.green:'transparent'}`, color:aba===id?C.green:C.muted, marginBottom:-1 }}>{label}</div>
            ))}
          </div>

          {loading && <div style={{ textAlign:'center', padding:32, color:C.muted, fontSize:13 }}>⏳ Carregando diagnóstico...</div>}

          {!loading && detalhe && aba === 'geral' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ background:`${corScore(detalhe.score_total)}15`, border:`2px solid ${corScore(detalhe.score_total)}`, borderRadius:10, padding:'10px 16px', textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:28, fontWeight:900, color:corScore(detalhe.score_total) }}>{detalhe.score_total}</div>
                  <div style={{ fontSize:9, color:C.muted }}>/100</div>
                </div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>Score geral do produto. Fatores: visibilidade, preço, estoque, reputação, anúncio.</div>
              </div>
              {detalhe.scores && Object.entries(detalhe.scores).map(([nome, score]) => (
                <div key={nome} style={{ display:'grid', gridTemplateColumns:'100px 1fr 36px', gap:10, alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, fontWeight:500, textTransform:'capitalize', color:C.text }}>{nome}</div>
                  <div>
                    <div style={{ height:4, background:C.border, borderRadius:2, overflow:'hidden', marginBottom:2 }}>
                      <div style={{ width:`${score}%`, height:'100%', background:corScore(score), borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:10, color:C.muted }}>{detalhe.acoes?.[nome] || ''}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:corScore(score), textAlign:'right' }}>{score}</div>
                </div>
              ))}
            </div>
          )}

          {!loading && detalhe && aba === 'ads' && (
            <SimuladorAdsSimples item={detalhe} />
          )}

          {!loading && detalhe && aba === 'preco' && (
            <div style={{ background:'#0f0f1a', borderRadius:10, padding:14 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>💰 Análise de preço</div>
              {[
                ['Preço atual', `R$${fmt(detalhe.preco)}`],
                ['Preço mínimo sugerido', detalhe.preco_minimo ? `R$${fmt(detalhe.preco_minimo)}` : 'N/A'],
                ['Preço competitivo', detalhe.preco_competitivo ? `R$${fmt(detalhe.preco_competitivo)}` : 'N/A'],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
                  <span style={{ color:C.muted }}>{l}</span>
                  <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimuladorAdsSimples({ item }) {
  const [margem, setMargem] = useState(20);
  const roasMin = (100/margem).toFixed(1);
  const roasRec = (Number(roasMin)+2).toFixed(1);
  const inputS = { width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' };
  return (
    <div style={{ background:'#0f0f1a', borderRadius:10, padding:14 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>📢 Simulador de Ads</div>
      {!item?.pode_anunciar && <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:10, color:'#f09575', fontSize:12, marginBottom:12 }}>⚠️ Não recomendado anunciar agora.</div>}
      <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Sua margem (%)</label>
      <input type="number" value={margem} onChange={e=>setMargem(Number(e.target.value))} style={{ ...inputS, marginBottom:12 }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[['ROAS mínimo',`${roasMin}x`],['ROAS objetivo',`${roasRec}x`]].map(([l,v]) => (
          <div key={l} style={{ background:C.card, borderRadius:8, padding:10, textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:C.blue }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalisarProdutos({ mlAuth, usuario, isMobile }) {
  const [todos, setTodos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroCurva, setFiltroCurva] = useState('todos');
  const [filtroFull, setFiltroFull] = useState(false);
  const [filtroCampanha, setFiltroCampanha] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [temDadosCampanha, setTemDadosCampanha] = useState(false);
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    if (mlAuth?.access_token && mlAuth?.conta_ml_id) carregar();
  }, [mlAuth]);

  useEffect(() => {
    let lista = [...todos];
    if (filtroCurva !== 'todos') lista = lista.filter(p => p.curva === filtroCurva);
    if (filtroFull) lista = lista.filter(p => p.sem_full);
    if (filtroCampanha) lista = lista.filter(p => p.sem_campanha);
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter(p => p.titulo?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q));
    }
    setFiltrados(lista);
  }, [todos, busca, filtroCurva, filtroFull, filtroCampanha]);

  const carregar = async () => {
    setLoading(true); setErro('');
    try {
      const r = await fetch(`${API}/ml/curva-abc?conta_ml_id=${mlAuth.conta_ml_id}&token=${encodeURIComponent(mlAuth.access_token)}`);
      const data = await r.json();
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      const merged = [...(data.curva_a||[]), ...(data.curva_b||[]), ...(data.curva_c||[])];
      setTodos(merged);
      setFiltrados(merged);
      setResumo(data.resumo);
      setTemDadosCampanha(data.resumo?.tem_dados_campanha || false);
    } catch { setErro('Erro ao carregar produtos.'); }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ padding:48, textAlign:'center' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14, color:C.muted }}>Carregando seus produtos... pode levar alguns segundos.</div>
    </div>
  );

  if (erro) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <div style={{ fontSize:13, color:'#f09575', marginBottom:12 }}>{erro}</div>
      <button onClick={carregar} style={{ padding:'9px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Tentar novamente</button>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? 12 : 24, fontFamily:'Inter, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize: isMobile?17:21, fontWeight:800, color:C.text }}>📦 Analisar Produtos</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{fmtInt(todos.length)} produtos ativos · últimos 90 dias</div>
        </div>
        <button onClick={carregar} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, cursor:'pointer' }}>🔄 Atualizar</button>
      </div>

      {/* Cards resumo */}
      {resumo && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Receita Total 90d', valor:`R$${fmt(resumo.receita_total_90d)}`, cor:C.green },
            { label:'Curva A', valor:`${resumo.qtd_a} produtos`, cor:CURVA_COR.A },
            { label:'Sem FULL (Curva A)', valor:resumo.a_sem_full, cor:C.yellow },
            { label:'Sem Ads (Curva A)', valor: temDadosCampanha ? resumo.a_sem_campanha : 'N/D', cor:C.blue },
          ].map(({ label, valor, cor }) => (
            <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:18, fontWeight:800, color:cor }}>{valor}</div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de busca e filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome ou MLB..."
          style={{ flex:1, minWidth:200, padding:'9px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12 }}
        />
        <select value={filtroCurva} onChange={e => setFiltroCurva(e.target.value)} style={{ padding:'9px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, cursor:'pointer' }}>
          <option value="todos">Todas as curvas</option>
          <option value="A">Curva A</option>
          <option value="B">Curva B</option>
          <option value="C">Curva C</option>
        </select>
        <button onClick={() => setFiltroFull(f => !f)} style={{ padding:'9px 12px', borderRadius:8, border:`1px solid ${filtroFull ? C.yellow : C.border}`, background: filtroFull ? C.yellow+'22' : 'transparent', color: filtroFull ? C.yellow : C.muted, fontSize:11, cursor:'pointer', fontWeight:600 }}>
          ⚡ Sem FULL
        </button>
        {temDadosCampanha && (
          <button onClick={() => setFiltroCampanha(f => !f)} style={{ padding:'9px 12px', borderRadius:8, border:`1px solid ${filtroCampanha ? C.blue : C.border}`, background: filtroCampanha ? C.blue+'22' : 'transparent', color: filtroCampanha ? C.blue : C.muted, fontSize:11, cursor:'pointer', fontWeight:600 }}>
            📢 Sem Ads
          </button>
        )}
      </div>

      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{fmtInt(filtrados.length)} produtos encontrados — clique em um produto para ver o diagnóstico completo</div>

      {/* Tabela de produtos */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        {/* Header da tabela */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 60px 60px' : '1fr 80px 100px 90px 60px 60px', gap:0, background:'#0f0f1a', padding:'10px 14px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>PRODUTO</div>
          {!isMobile && <div style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:'center' }}>CURVA</div>}
          {!isMobile && <div style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:'right' }}>RECEITA 90D</div>}
          {!isMobile && <div style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:'right' }}>VENDAS</div>}
          <div style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:'center' }}>FULL</div>
          {temDadosCampanha && <div style={{ fontSize:10, color:C.muted, fontWeight:600, textAlign:'center' }}>ADS</div>}
        </div>

        {filtrados.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:C.muted, fontSize:13 }}>Nenhum produto encontrado com esses filtros.</div>
        ) : (
          filtrados.map((prod, i) => (
            <div
              key={prod.id}
              onClick={() => setProdutoSelecionado(prod)}
              style={{
                display:'grid', gridTemplateColumns: isMobile ? '1fr 60px 60px' : '1fr 80px 100px 90px 60px 60px',
                gap:0, padding:'10px 14px', borderBottom:`1px solid ${C.border}`,
                cursor:'pointer', transition:'background 0.1s',
                background: i%2===0 ? 'transparent' : '#ffffff04',
              }}
              onMouseEnter={e => e.currentTarget.style.background='#3b82f610'}
              onMouseLeave={e => e.currentTarget.style.background= i%2===0 ? 'transparent' : '#ffffff04'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
                {prod.thumbnail && <img src={prod.thumbnail} alt="" style={{ width:32, height:32, borderRadius:4, objectFit:'cover', flexShrink:0 }} />}
                <div style={{ overflow:'hidden' }}>
                  <div style={{ fontSize:12, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{prod.titulo}</div>
                  <div style={{ display:'flex', gap:6, marginTop:2, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, color:C.muted }}>{prod.id}</span>
                    <span style={{ fontSize:10, color:C.muted }}>R${fmt(prod.preco)}</span>
                    {isMobile && <Badge texto={`Curva ${prod.curva}`} cor={CURVA_COR[prod.curva]} />}
                    {isMobile && <span style={{ fontSize:10, color:C.green }}>R${fmt(prod.receita_90d)}</span>}
                    {prod.sem_full && <Badge texto="Sem FULL" cor={C.yellow} />}
                    {prod.sem_campanha && temDadosCampanha && <Badge texto="Sem Ads" cor={C.blue} />}
                  </div>
                </div>
              </div>
              {!isMobile && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Badge texto={`Curva ${prod.curva}`} cor={CURVA_COR[prod.curva]} />
                </div>
              )}
              {!isMobile && <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', fontSize:12, color:C.green, fontWeight:600 }}>R${fmt(prod.receita_90d)}</div>}
              {!isMobile && <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', fontSize:12, color:C.text }}>{fmtInt(prod.vendas_90d)}</div>}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{prod.em_full ? '✅' : <span style={{ color:'#333' }}>✗</span>}</div>
              {temDadosCampanha && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{prod.em_campanha ? '✅' : <span style={{ color:'#333' }}>✗</span>}</div>}
            </div>
          ))
        )}
      </div>

      {/* Modal de detalhe do produto */}
      {produtoSelecionado && (
        <DetalheModal
          produto={produtoSelecionado}
          mlAuth={mlAuth}
          onFechar={() => setProdutoSelecionado(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
