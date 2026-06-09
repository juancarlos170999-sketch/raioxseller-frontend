import React, { useState, useEffect } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e'
};

const CURVA_COR = { A: '#00a650', B: '#f5a623', C: '#6b6b8a' };
const CURVA_BG  = { A: '#0d2d1a', B: '#2d200a', C: '#1a1a2e' };
const CURVA_DESC = {
  A: 'Produtos que geram ~80% da sua receita. Prioridade máxima.',
  B: 'Produtos intermediários. Potencial de crescimento.',
  C: 'Produtos de baixo giro. Avaliar manter ou descontinuar.',
};

function fmt(n) { return (n||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function fmtInt(n) { return (n||0).toLocaleString('pt-BR'); }

function CardResumo({ label, valor, cor, sub }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px', flex:1, minWidth:120 }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color: cor || C.text }}>{valor}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function TagAlerta({ texto, cor }) {
  return (
    <span style={{ background: cor+'20', color: cor, border:`1px solid ${cor}40`, borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
      {texto}
    </span>
  );
}

function TabelaCurva({ titulo, itens, cor, bg, desc, temDadosCampanha, isMobile }) {
  const [aberto, setAberto] = useState(titulo === 'A');

  return (
    <div style={{ marginBottom:16 }}>
      <button onClick={() => setAberto(a => !a)} style={{
        width:'100%', background: bg, border:`1px solid ${cor}40`,
        borderRadius: aberto ? '12px 12px 0 0' : 12,
        padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between',
        cursor:'pointer', color:C.text
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ background:cor, color:'#fff', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:800 }}>
            CURVA {titulo}
          </span>
          <span style={{ fontSize:13, fontWeight:600 }}>{itens.length} produtos</span>
          <span style={{ fontSize:11, color:C.muted }}>{desc}</span>
        </div>
        <span style={{ color:C.muted, fontSize:14 }}>{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div style={{ background:C.card, border:`1px solid ${cor}20`, borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
          {itens.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:C.muted, fontSize:13 }}>Nenhum produto nesta curva.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#0f0f1a', borderBottom:`1px solid ${C.border}` }}>
                    <th style={{ padding:'10px 14px', textAlign:'left', color:C.muted, fontWeight:600 }}>Produto</th>
                    {!isMobile && <th style={{ padding:'10px 14px', textAlign:'right', color:C.muted, fontWeight:600 }}>Receita 90d</th>}
                    {!isMobile && <th style={{ padding:'10px 14px', textAlign:'right', color:C.muted, fontWeight:600 }}>Vendas</th>}
                    <th style={{ padding:'10px 14px', textAlign:'center', color:C.muted, fontWeight:600 }}>FULL</th>
                    {temDadosCampanha && <th style={{ padding:'10px 14px', textAlign:'center', color:C.muted, fontWeight:600 }}>Ads</th>}
                    {titulo === 'A' && <th style={{ padding:'10px 14px', textAlign:'left', color:C.muted, fontWeight:600 }}>Alertas</th>}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom:`1px solid ${C.border}`, background: i%2===0 ? 'transparent' : '#0f0f1a0a' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width:32, height:32, borderRadius:4, objectFit:'cover', flexShrink:0 }} />}
                          <div>
                            <div style={{ color:C.text, fontWeight:500, lineHeight:1.3, maxWidth: isMobile?140:280 }} title={item.titulo}>
                              {item.titulo?.length > (isMobile?35:70) ? item.titulo.substring(0, isMobile?35:70)+'...' : item.titulo}
                            </div>
                            <div style={{ color:C.muted, fontSize:10 }}>{item.id} · R${fmt(item.preco)}</div>
                            {isMobile && <div style={{ color:C.muted, fontSize:10 }}>R${fmt(item.receita_90d)} · {item.vendas_90d} vendas</div>}
                          </div>
                        </div>
                      </td>
                      {!isMobile && <td style={{ padding:'10px 14px', textAlign:'right', color:C.green, fontWeight:600 }}>R${fmt(item.receita_90d)}</td>}
                      {!isMobile && <td style={{ padding:'10px 14px', textAlign:'right', color:C.text }}>{fmtInt(item.vendas_90d)}</td>}
                      <td style={{ padding:'10px 14px', textAlign:'center' }}>
                        {item.em_full
                          ? <span style={{ color:C.green, fontSize:14 }}>✅</span>
                          : <span style={{ color:'#333', fontSize:14 }}>✗</span>}
                      </td>
                      {temDadosCampanha && (
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          {item.em_campanha
                            ? <span style={{ color:C.green, fontSize:14 }}>✅</span>
                            : <span style={{ color:'#333', fontSize:14 }}>✗</span>}
                        </td>
                      )}
                      {titulo === 'A' && (
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {item.sem_full && <TagAlerta texto="⚡ Ativar FULL" cor={C.yellow} />}
                            {item.sem_campanha && temDadosCampanha && <TagAlerta texto="📢 Criar Ads" cor={C.blue} />}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CurvaABC({ mlAuth, usuario, isMobile }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('A');

  useEffect(() => {
    if (mlAuth?.access_token && mlAuth?.conta_ml_id) {
      carregar();
    }
  }, [mlAuth]);

  const carregar = async () => {
    setLoading(true); setErro('');
    try {
      const r = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://dianostico-ml-production.up.railway.app'}/ml/curva-abc?conta_ml_id=${mlAuth.conta_ml_id}&token=${mlAuth.access_token}`
      );
      const data = await r.json();
      if (data.erro) { setErro(data.erro); }
      else { setDados(data); }
    } catch (e) { setErro('Erro ao carregar dados.'); }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ padding:48, textAlign:'center' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14, color:C.muted }}>Analisando seus produtos... pode levar alguns segundos.</div>
    </div>
  );

  if (erro) return (
    <div style={{ padding:32, textAlign:'center' }}>
      <div style={{ fontSize:13, color:'#f09575', marginBottom:12 }}>{erro}</div>
      <button onClick={carregar} style={{ padding:'9px 20px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Tentar novamente</button>
    </div>
  );

  if (!dados) return null;

  const { curva_a, curva_b, curva_c, resumo } = dados;
  const temDadosCampanha = resumo?.tem_dados_campanha;

  const itensPorAba = { A: curva_a, B: curva_b, C: curva_c };

  return (
    <div style={{ padding: isMobile ? 16 : 28, fontFamily:'Inter, sans-serif', maxWidth:960, margin:'0 auto' }}>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize: isMobile?18:22, fontWeight:800, color:C.text, marginBottom:4 }}>📊 Curva ABC de Produtos</div>
        <div style={{ fontSize:12, color:C.muted }}>Últimos 90 dias · {fmtInt(resumo?.total_itens)} produtos ativos</div>
      </div>

      {/* Explicação do critério (baseado no ML) */}
      <div style={{ background:'#0f1520', border:`1px solid ${C.blue}30`, borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:11, color:C.muted, lineHeight:1.6 }}>
        📖 <strong style={{ color:C.text }}>Classificação baseada no critério do Mercado Livre:</strong> Curva A = produtos que geram ~80% da receita (prioridade máxima) · Curva B = 15% da receita · Curva C = 5% da receita. Período: últimos 90 dias.
      </div>

      {/* Cards clicáveis para selecionar curva */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Receita Total 90d</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.green }}>R${fmt(resumo?.receita_total_90d)}</div>
        </div>
        {[
          { curva:'A', qtd: resumo?.qtd_a, cor:C.green, sub:'~80% da receita', desc:'Produtos prioritários' },
          { curva:'B', qtd: resumo?.qtd_b, cor:C.yellow, sub:'~15% da receita', desc:'Potencial crescimento' },
          { curva:'C', qtd: resumo?.qtd_c, cor:C.muted, sub:'~5% da receita', desc:'Baixo giro' },
        ].map(({ curva, qtd, cor, sub, desc }) => (
          <button key={curva} onClick={() => setAba(curva)} style={{
            background: aba === curva ? cor+'20' : C.card,
            border: `2px solid ${aba === curva ? cor : C.border}`,
            borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left',
            transition:'all 0.15s', boxShadow: aba === curva ? `0 0 12px ${cor}30` : 'none'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ background:cor, color:'#fff', borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:800 }}>CURVA {curva}</span>
              {aba === curva && <span style={{ fontSize:10, color:cor }}>● selecionada</span>}
            </div>
            <div style={{ fontSize:22, fontWeight:800, color: aba === curva ? cor : C.text }}>{qtd} <span style={{ fontSize:12, fontWeight:400, color:C.muted }}>produtos</span></div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{sub} · {desc}</div>
          </button>
        ))}
      </div>

      {/* Alertas Curva A */}
      {(resumo?.a_sem_full > 0 || resumo?.a_sem_campanha > 0) && (
        <div style={{ background:'#2d200a', border:`1px solid ${C.yellow}40`, borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.yellow, marginBottom:4, width:'100%' }}>⚠️ Oportunidades nos produtos Curva A</div>
          {resumo?.a_sem_full > 0 && (
            <div style={{ fontSize:12, color:C.text }}>
              <span style={{ color:C.yellow, fontWeight:700 }}>{resumo.a_sem_full}</span> produtos Curva A <strong>sem FULL</strong> — ativar fulfillment pode aumentar visibilidade e conversão
            </div>
          )}
          {resumo?.a_sem_campanha > 0 && temDadosCampanha && (
            <div style={{ fontSize:12, color:C.text }}>
              <span style={{ color:C.blue, fontWeight:700 }}>{resumo.a_sem_campanha}</span> produtos Curva A <strong>sem campanha de Ads</strong> — impulsionar os mais rentáveis
            </div>
          )}
        </div>
      )}

      {/* Título da curva selecionada + botão atualizar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color: CURVA_COR[aba] }}>
          Produtos Curva {aba} — {itensPorAba[aba]?.length} itens
        </div>
        <button onClick={carregar} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, fontSize:11, cursor:'pointer' }}>
          🔄 Atualizar
        </button>
      </div>

      {/* Tabela da aba ativa */}
      <TabelaCurva
        titulo={aba}
        itens={itensPorAba[aba] || []}
        cor={CURVA_COR[aba]}
        bg={CURVA_BG[aba]}
        desc={CURVA_DESC[aba]}
        temDadosCampanha={temDadosCampanha}
        isMobile={isMobile}
      />

      {!temDadosCampanha && (
        <div style={{ fontSize:11, color:'#333', textAlign:'center', marginTop:8 }}>
          * Dados de campanhas de Ads não disponíveis — requer permissão adicional na API do Mercado Livre.
        </div>
      )}
    </div>
  );
}
