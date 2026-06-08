import React, { useState } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e'
};

function fmt(n) { return (n||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function fmtInt(n) { return (n||0).toLocaleString('pt-BR'); }

function useIsMobile() {
  const [v, setV] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setV(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return v;
}

export default function Concorrentes({ mlAuth }) {
  const [mlb, setMlb] = useState('');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const isMobile = useIsMobile();

  const analisar = async () => {
    if (!mlb.trim() || !mlAuth) return;
    setLoading(true); setErro(''); setDados(null);
    try {
      const mlbF = mlb.trim().toUpperCase().startsWith('MLB') ? mlb.trim().toUpperCase() : `MLB${mlb.trim()}`;
      const r = await ml.concorrentes(mlbF, mlAuth.access_token);
      if (r.concorrentes) setDados(r);
      else setErro(r.detail || 'Erro ao buscar concorrentes.');
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    setLoading(false);
  };

  const ref = dados;
  const concorrentes = dados?.concorrentes || [];
  const maisBaratos = concorrentes.filter(c => c.diferenca_preco < 0);
  const maisCaro = concorrentes.filter(c => c.diferenca_preco > 0);
  const menorPreco = concorrentes.length ? Math.min(...concorrentes.map(c => c.preco)) : null;
  const maiorVendas = concorrentes.length ? Math.max(...concorrentes.map(c => c.vendas)) : 0;
  const mediaPreco = concorrentes.length ? concorrentes.reduce((s, c) => s + c.preco, 0) / concorrentes.length : 0;

  const logisticaCor = { Full: C.green, Flex: C.blue, Padrão: C.muted };
  const logisticaBg = { Full: '#0d2d1a', Flex: '#0d1f35', Padrão: '#1a1a2e' };

  return (
    <div style={{ padding: isMobile ? 16 : 28, maxWidth:980, margin:'0 auto' }}>
      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, marginBottom:4 }}>Análise de concorrentes</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Compare seu produto com os top sellers da mesma categoria</div>

      {/* BUSCA */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        <input
          value={mlb}
          onChange={e => { setMlb(e.target.value); setErro(''); }}
          onKeyDown={e => e.key === 'Enter' && analisar()}
          placeholder="Cole o MLB do seu produto (ex: MLB4341336433)"
          style={{ flex:1, padding:'11px 13px', borderRadius:8, border:`1px solid ${erro ? C.red : C.border}`, background:C.card, color:C.text, fontSize:13 }}
        />
        <button onClick={analisar} disabled={loading || !mlAuth}
          style={{ padding:'11px 20px', background: loading ? C.border : C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', opacity:!mlAuth?0.4:1 }}>
          {loading ? '⏳ Buscando...' : '🔍 Analisar'}
        </button>
      </div>

      {!mlAuth && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:32, textAlign:'center', color:C.muted, fontSize:13 }}>
          Conecte sua conta ML para usar a análise de concorrentes.
        </div>
      )}

      {erro && (
        <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:10, padding:16, color:'#f09575', fontSize:13 }}>{erro}</div>
      )}

      {dados && (
        <>
          {/* SEU PRODUTO */}
          <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}40`, borderRadius:12, padding:'14px 18px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:C.green, fontWeight:700, letterSpacing:'0.1em', marginBottom:4 }}>SEU PRODUTO (REFERÊNCIA)</div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{ref.titulo}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{ref.item_id} · Categoria {ref.categoria_id}</div>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={{ fontSize:24, fontWeight:900, color:C.green }}>R${fmt(ref.preco_ref)}</div>
              <div style={{ fontSize:10, color:C.muted }}>preço atual</div>
            </div>
          </div>

          {/* RESUMO */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              {
                label: 'Concorrentes mais baratos',
                val: maisBaratos.length,
                sub: maisBaratos.length > 0 ? `menor: R$${fmt(menorPreco)}` : 'você tem o menor preço',
                cor: maisBaratos.length > 0 ? C.red : C.green,
                icon: maisBaratos.length > 0 ? '⚠️' : '✅'
              },
              {
                label: 'Preço médio da concorrência',
                val: `R$${fmt(mediaPreco)}`,
                sub: mediaPreco > ref.preco_ref ? `R$${fmt(mediaPreco - ref.preco_ref)} acima de você` : `R$${fmt(ref.preco_ref - mediaPreco)} abaixo de você`,
                cor: mediaPreco > ref.preco_ref ? C.green : C.yellow,
                icon: '📊'
              },
              {
                label: 'Maior vendedor',
                val: `${fmtInt(maiorVendas)} vendas`,
                sub: 'volume total do top 1',
                cor: C.blue,
                icon: '🏆'
              },
              {
                label: 'Usam Full (Fulfillment)',
                val: `${concorrentes.filter(c => c.logistica === 'Full').length}/${concorrentes.length}`,
                sub: concorrentes.some(c => c.logistica === 'Full') ? 'concorrentes têm Full' : 'nenhum usa Full',
                cor: C.yellow,
                icon: '📦'
              },
            ].map(({ label, val, sub, cor, icon }) => (
              <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{icon} {label}</div>
                <div style={{ fontSize: isMobile ? 14 : 18, fontWeight:800, color:cor }}>{val}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* INSIGHTS */}
          {(() => {
            const insights = [];
            if (maisBaratos.length === 0)
              insights.push({ tipo:'positivo', msg:'Você tem o menor preço entre os top sellers — vantagem competitiva forte.' });
            else if (maisBaratos.length >= 3)
              insights.push({ tipo:'negativo', msg:`${maisBaratos.length} concorrentes estão mais baratos. Considere revisar seu preço ou agregar valor (frete grátis, Full).` });
            else
              insights.push({ tipo:'neutro', msg:`${maisBaratos.length} concorrente(s) com preço menor. Monitore para não perder Buy Box.` });

            const temFull = concorrentes.some(c => c.logistica === 'Full');
            if (temFull)
              insights.push({ tipo:'neutro', msg:'Concorrentes com Full têm prioridade no algoritmo do ML. Avalie ativar Full nos seus anúncios.' });

            const maiorVendedor = concorrentes.reduce((a, b) => b.vendas > a.vendas ? b : a, concorrentes[0]);
            if (maiorVendedor && maiorVendedor.preco < ref.preco_ref)
              insights.push({ tipo:'negativo', msg:`O mais vendido (${fmtInt(maiorVendedor.vendas)} vendas) custa R$${fmt(maiorVendedor.preco)} — R$${fmt(ref.preco_ref - maiorVendedor.preco)} mais barato que você.` });

            return insights.length > 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>💡 Insights automáticos</div>
                {insights.map((ins, i) => {
                  const cor = ins.tipo === 'positivo' ? C.green : ins.tipo === 'negativo' ? C.red : C.yellow;
                  return (
                    <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom: i < insights.length-1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ color:cor, fontSize:14, flexShrink:0 }}>{ins.tipo === 'positivo' ? '✅' : ins.tipo === 'negativo' ? '⚠️' : '💬'}</span>
                      <span style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{ins.msg}</span>
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}

          {/* TABELA CONCORRENTES */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Top {concorrentes.length} concorrentes da categoria</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Ordenados por volume de vendas</div>
            </div>

            {isMobile ? (
              /* MOBILE: cards */
              concorrentes.sort((a,b) => b.vendas - a.vendas).map((c, i) => {
                const maisBarato = c.diferenca_preco < 0;
                const maisCaro = c.diferenca_preco > 0;
                return (
                  <div key={i} style={{ padding:'14px 16px', borderBottom: i < concorrentes.length-1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ flex:1, marginRight:10 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:4, lineHeight:1.4 }}>{c.titulo}</div>
                        <div style={{ fontSize:10, color:C.muted, fontFamily:'monospace' }}>{c.item_id}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:C.text }}>R${fmt(c.preco)}</div>
                        {c.diferenca_preco !== 0 && (
                          <div style={{ fontSize:10, fontWeight:600, color: maisBarato ? C.red : C.green }}>
                            {maisBarato ? `−R$${fmt(Math.abs(c.diferenca_preco))}` : `+R$${fmt(c.diferenca_preco)}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ background:logisticaBg[c.logistica]||C.input, color:logisticaCor[c.logistica]||C.muted, border:`1px solid ${logisticaCor[c.logistica]||C.border}30`, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>
                        {c.logistica}
                      </span>
                      {c.frete_gratis && <span style={{ background:'#0d2d1a', color:C.green, border:`1px solid ${C.green}30`, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600 }}>Frete grátis</span>}
                      <span style={{ background:C.input, color:C.muted, padding:'2px 8px', borderRadius:4, fontSize:10 }}>
                        {fmtInt(c.vendas)} vendas
                      </span>
                      {c.vendas === maiorVendas && c.vendas > 0 && (
                        <span style={{ background:'#2d2010', color:C.yellow, border:`1px solid ${C.yellow}30`, padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>🏆 Top vendedor</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* DESKTOP: tabela */
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'8px 18px', background:'#0f0f1a', borderBottom:`1px solid ${C.border}` }}>
                  {['Produto', 'Preço', 'vs. Você', 'Logística', 'Vendas'].map(h => (
                    <div key={h} style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'0.06em' }}>{h}</div>
                  ))}
                </div>
                {concorrentes.sort((a,b) => b.vendas - a.vendas).map((c, i) => {
                  const maisBarato = c.diferenca_preco < 0;
                  const isTop = c.vendas === maiorVendas && c.vendas > 0;
                  return (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'13px 18px', borderBottom: i < concorrentes.length-1 ? `1px solid ${C.border}` : 'none', alignItems:'center' }}>
                      <div>
                        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                          {isTop && <span style={{ fontSize:9, background:'#2d2010', color:C.yellow, border:`1px solid ${C.yellow}30`, padding:'1px 5px', borderRadius:3, fontWeight:700 }}>🏆 TOP</span>}
                          {c.frete_gratis && <span style={{ fontSize:9, background:'#0d2d1a', color:C.green, border:`1px solid ${C.green}30`, padding:'1px 5px', borderRadius:3, fontWeight:700 }}>FRETE GRÁTIS</span>}
                        </div>
                        <div style={{ fontSize:12, fontWeight:500, color:C.text, lineHeight:1.4 }}>{c.titulo}</div>
                        <div style={{ fontSize:10, color:'#444', marginTop:2, fontFamily:'monospace' }}>{c.item_id}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text }}>R${fmt(c.preco)}</div>
                      <div style={{ fontSize:12, fontWeight:700, color: maisBarato ? C.red : c.diferenca_preco > 0 ? C.green : C.muted }}>
                        {c.diferenca_preco === 0 ? '— igual' : maisBarato ? `−R$${fmt(Math.abs(c.diferenca_preco))}` : `+R$${fmt(c.diferenca_preco)}`}
                      </div>
                      <div>
                        <span style={{ background:logisticaBg[c.logistica]||C.input, color:logisticaCor[c.logistica]||C.muted, border:`1px solid ${logisticaCor[c.logistica]||C.border}30`, padding:'3px 8px', borderRadius:5, fontSize:11, fontWeight:600 }}>
                          {c.logistica}
                        </span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color: isTop ? C.yellow : C.muted }}>
                        {fmtInt(c.vendas)}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
