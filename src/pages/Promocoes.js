import React, { useState, useEffect } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', input:'#1a1a2e'
};

function CalculadoraPromocao() {
  const [preco, setPreco] = useState(100);
  const [desconto, setDesconto] = useState(20);
  const [cmv, setCmv] = useState(50);
  const [comissao, setComissao] = useState(0.17);
  const [frete, setFrete] = useState(15);
  const [imposto, setImposto] = useState(0.10);

  const precoPromo = preco * (1 - desconto/100);
  const margemNormal = ((preco - cmv - preco*comissao - frete - preco*imposto) / preco * 100);
  const margemPromo = ((precoPromo - cmv - precoPromo*comissao - frete - precoPromo*imposto) / precoPromo * 100);
  const lucroPorVenda = precoPromo - cmv - precoPromo*comissao - frete - precoPromo*imposto;
  const viavel = lucroPorVenda > 0;

  const vendasParaCompensarDesconto = lucroPorVenda > 0
    ? Math.ceil((preco * desconto/100) / lucroPorVenda)
    : null;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginTop:20 }}>
      <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:16 }}>🧮 Calculadora de promoção</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div>
          {[
            ['Preço normal (R$)', preco, setPreco],
            ['Desconto (%)', desconto, setDesconto],
            ['CMV — custo do produto (R$)', cmv, setCmv],
            ['Frete (R$)', frete, setFrete],
          ].map(([l,v,s]) => (
            <div key={l} style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
              <input type="number" value={v} onChange={e=>s(Number(e.target.value))}
                style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Tipo de anúncio</label>
            <select value={comissao} onChange={e=>setComissao(Number(e.target.value))}
              style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}>
              <option value={0.12}>Clássico (12%)</option>
              <option value={0.17}>Premium (17%)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:4 }}>Regime fiscal</label>
            <select value={imposto} onChange={e=>setImposto(Number(e.target.value))}
              style={{ width:'100%', padding:'8px', borderRadius:6, border:`1px solid ${C.border}`, background:C.input, color:C.text, fontSize:12, boxSizing:'border-box' }}>
              <option value={0.06}>MEI (6%)</option>
              <option value={0.10}>Simples (10%)</option>
              <option value={0.15}>Lucro Presumido (15%)</option>
            </select>
          </div>
        </div>

        <div>
          <div style={{ background: viavel ? '#0d2d1a' : '#2d1b1b', border:`1px solid ${viavel ? C.green : C.red}`, borderRadius:10, padding:16, marginBottom:12, textAlign:'center' }}>
            <div style={{ fontSize:11, color: viavel ? C.green : C.red, marginBottom:4 }}>Preço promocional</div>
            <div style={{ fontSize:36, fontWeight:900, color: viavel ? C.green : C.red }}>R${precoPromo.toFixed(2)}</div>
            <div style={{ fontSize:12, color: viavel ? '#9FE1CB' : '#f09575', marginTop:4 }}>
              {viavel ? '✅ Promoção viável' : '⚠️ Promoção no prejuízo'}
            </div>
          </div>

          {[
            ['Margem normal', `${margemNormal.toFixed(1)}%`, margemNormal > 10 ? C.green : C.red],
            ['Margem na promoção', `${margemPromo.toFixed(1)}%`, margemPromo > 0 ? C.yellow : C.red],
            ['Lucro por venda', `R$${lucroPorVenda.toFixed(2)}`, lucroPorVenda > 0 ? C.green : C.red],
            ['Queda na margem', `${(margemNormal - margemPromo).toFixed(1)}pp`, C.yellow],
          ].map(([l,v,c]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
              <span style={{ color:C.muted }}>{l}</span>
              <span style={{ fontWeight:600, color:c }}>{v}</span>
            </div>
          ))}

          {viavel && vendasParaCompensarDesconto && (
            <div style={{ marginTop:12, background:'#0d1f35', border:`1px solid #3b82f640`, borderRadius:8, padding:12, fontSize:12, color:'#7ab3f0' }}>
              💡 Precisa de pelo menos <strong>{vendasParaCompensarDesconto} vendas</strong> durante a promoção para compensar o desconto dado.
            </div>
          )}
          {!viavel && (
            <div style={{ marginTop:12, background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:8, padding:12, fontSize:12, color:'#f09575' }}>
              ⚠️ Com esse desconto você vende no prejuízo. Reduza o desconto ou aumente o preço base antes de ativar a promoção.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Promocoes({ mlAuth }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('ativas');

  useEffect(() => {
    if (mlAuth) carregar();
  }, [mlAuth]);

  const carregar = async () => {
    if (!mlAuth) return;
    setLoading(true);
    try {
      const r = await ml.promocoes(mlAuth.ml_user_id, mlAuth.access_token);
      setDados(r);
    } catch {}
    setLoading(false);
  };

  const tipoLabel = {
    'DEAL': 'Campanha ML', 'DOD': 'Oferta do Dia', 'LIGHTNING': 'Oferta Relâmpago',
    'SELLER_CAMPAIGN': 'Campanha do Vendedor', 'SELLER_COUPON_CAMPAIGN': 'Cupom'
  };

  return (
    <div style={{ padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.text }}>Promoções</div>
        <button onClick={carregar} disabled={loading} style={{ padding:'6px 16px', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12, cursor:'pointer' }}>
          {loading ? 'Carregando...' : '🔄 Atualizar'}
        </button>
      </div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:20 }}>Promoções ativas, candidatos e calculadora de desconto</div>

      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        {[['ativas','🏷 Promoções ativas'],['candidatos','💡 Oportunidades'],['calculadora','🧮 Calculadora']].map(([id,label]) => (
          <div key={id} onClick={()=>setAba(id)} style={{ padding:'8px 16px', fontSize:12, cursor:'pointer', borderBottom:`2px solid ${aba===id?C.green:'transparent'}`, color:aba===id?C.green:C.muted, marginBottom:-1 }}>{label}</div>
        ))}
      </div>

      {aba === 'ativas' && (
        <div>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:C.muted }}>Carregando promoções...</div>
          ) : !dados || dados.promocoes_ativas.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:30, textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🏷</div>
              <div style={{ fontSize:14 }}>Nenhuma promoção ativa no momento.</div>
              <div style={{ fontSize:12, marginTop:4 }}>Acesse a Central de Vendedores do ML para criar promoções.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gap:10 }}>
              {dados.promocoes_ativas.map((p, i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                        <span style={{ background:'#0d2d1a', color:'#9FE1CB', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>{tipoLabel[p.tipo] || p.tipo}</span>
                        <span style={{ fontSize:11, color:C.muted }}>{p.status}</span>
                        {p.fim && <span style={{ fontSize:11, color:C.muted }}>até {p.fim}</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{p.titulo}</div>
                    </div>
                    <div style={{ textAlign:'right', marginLeft:16 }}>
                      <div style={{ fontSize:11, color:C.muted, textDecoration:'line-through' }}>R${p.preco_original}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:C.green }}>R${p.preco_promocional}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.yellow }}>{p.desconto_pct}% off</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aba === 'candidatos' && (
        <div>
          <div style={{ background:'#0d1f35', border:`1px solid #3b82f640`, borderRadius:8, padding:12, fontSize:12, color:'#7ab3f0', marginBottom:16 }}>
            💡 Produtos com estoque alto e poucas vendas são bons candidatos para promoção — aumenta o giro e melhora o posicionamento no algoritmo.
          </div>
          {!dados || dados.candidatos_promocao.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:30, textAlign:'center', color:C.muted }}>
              <div style={{ fontSize:14 }}>Nenhum candidato identificado no momento.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gap:10 }}>
              {dados.candidatos_promocao.map((c, i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:6 }}>{c.titulo}</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ background:C.input, color:C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>R${c.preco}</span>
                        <span style={{ background:'#2d1b1b', color:'#f09575', padding:'3px 8px', borderRadius:4, fontSize:11 }}>{c.estoque} un. em estoque</span>
                        <span style={{ background:C.input, color:C.muted, padding:'3px 8px', borderRadius:4, fontSize:11 }}>{c.vendas} vendas</span>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.yellow, maxWidth:160, textAlign:'right' }}>{c.motivo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aba === 'calculadora' && <CalculadoraPromocao />}
    </div>
  );
}
