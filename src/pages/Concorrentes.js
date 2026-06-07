import React, { useState } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', input:'#1a1a2e'
};

export default function Concorrentes({ mlAuth }) {
  const [mlb, setMlb] = useState('');
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = async () => {
    if (!mlb.trim() || !mlAuth) return;
    setLoading(true); setErro(''); setDados(null);
    try {
      const mlbF = mlb.trim().toUpperCase().startsWith('MLB') ? mlb.trim().toUpperCase() : `MLB${mlb.trim()}`;
      const r = await ml.concorrentes(mlbF, mlAuth.access_token);
      if (r.detail) { setErro(r.detail); } else { setDados(r); }
    } catch { setErro('Erro ao buscar concorrentes.'); }
    setLoading(false);
  };

  return (
    <div style={{ padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>Análise de concorrentes</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Cole o MLB do seu produto para ver os top concorrentes na mesma categoria</div>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        <input value={mlb} onChange={e=>setMlb(e.target.value)} placeholder="Ex: MLB4341336433"
          style={{ flex:1, padding:'10px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13 }} />
        <button onClick={buscar} disabled={loading || !mlAuth} style={{ padding:'10px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
          {loading ? 'Buscando...' : '🔍 Analisar'}
        </button>
      </div>

      {erro && <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:14, color:'#f09575', fontSize:13, marginBottom:16 }}>{erro}</div>}

      {dados && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Seu produto</div>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>{dados.titulo}</div>
            <div style={{ display:'flex', gap:12 }}>
              <span style={{ fontSize:13, color:C.green, fontWeight:700 }}>R${dados.preco_ref}</span>
              <span style={{ fontSize:12, color:C.muted }}>Categoria: {dados.categoria_id}</span>
            </div>
          </div>

          <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:12 }}>Top {dados.concorrentes.length} concorrentes por vendas</div>

          {dados.concorrentes.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, color:C.muted, textAlign:'center', fontSize:13 }}>
              Nenhum concorrente encontrado nessa categoria.
            </div>
          ) : (
            <div style={{ display:'grid', gap:10 }}>
              {dados.concorrentes.map((c, i) => {
                const diffCor = c.diferenca_preco > 0 ? C.green : c.diferenca_preco < 0 ? C.red : C.muted;
                const diffLabel = c.diferenca_preco > 0 ? `+R$${c.diferenca_preco} mais caro` : c.diferenca_preco < 0 ? `R$${Math.abs(c.diferenca_preco)} mais barato` : 'Mesmo preço';
                return (
                  <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>#{i+1} · {c.seller_nome}</div>
                        <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:8 }}>{c.titulo}</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <span style={{ background:C.input, color:C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>📦 {c.vendas} vendas</span>
                          <span style={{ background: c.logistica==='Full' ? '#0d2d1a' : c.logistica==='Flex' ? '#2d2418' : '#1a1a2e', color: c.logistica==='Full' ? '#9FE1CB' : c.logistica==='Flex' ? '#FAC775' : C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>{c.logistica}</span>
                          {c.frete_gratis && <span style={{ background:'#0d2d1a', color:'#9FE1CB', padding:'3px 8px', borderRadius:4, fontSize:11 }}>Frete grátis</span>}
                          {c.seller_reputacao && <span style={{ background:'#1a1a2e', color:C.yellow, padding:'3px 8px', borderRadius:4, fontSize:11 }}>{c.seller_reputacao}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', marginLeft:16 }}>
                        <div style={{ fontSize:18, fontWeight:800, color:C.text }}>R${c.preco}</div>
                        <div style={{ fontSize:11, color:diffCor, marginTop:2 }}>{diffLabel}</div>
                      </div>
                    </div>

                    {c.diferenca_preco < 0 && (
                      <div style={{ background:'#2d1b1b', border:`1px solid ${C.red}30`, borderRadius:6, padding:'8px 12px', fontSize:12, color:'#f09575' }}>
                        ⚠️ Este concorrente está R${Math.abs(c.diferenca_preco)} mais barato. Avalie se precisa ajustar seu preço.
                      </div>
                    )}
                    {c.diferenca_preco > 0 && c.vendas > 10 && (
                      <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}30`, borderRadius:6, padding:'8px 12px', fontSize:12, color:'#9FE1CB' }}>
                        ✅ Seu preço é mais competitivo e ele ainda vende bem. Monitore para manter a vantagem.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop:20, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>📊 Resumo competitivo</div>
            {dados.concorrentes.length > 0 && (() => {
              const precos = dados.concorrentes.map(c => c.preco);
              const menorPreco = Math.min(...precos);
              const maiorPreco = Math.max(...precos);
              const mediaPreco = (precos.reduce((a,b)=>a+b,0)/precos.length).toFixed(2);
              const maisBaratoQueVoce = dados.concorrentes.filter(c => c.preco < dados.preco_ref).length;
              return (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                  {[
                    ['Menor preço', `R$${menorPreco}`, menorPreco < dados.preco_ref ? C.red : C.green],
                    ['Maior preço', `R$${maiorPreco}`, C.text],
                    ['Média da categoria', `R$${mediaPreco}`, C.text],
                    ['Mais baratos que você', `${maisBaratoQueVoce} de ${dados.concorrentes.length}`, maisBaratoQueVoce > 2 ? C.red : C.yellow],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ background:C.input, borderRadius:8, padding:12, textAlign:'center' }}>
                      <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{l}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
