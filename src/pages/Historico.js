import React, { useState, useEffect } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', red:'#e52b2b', blue:'#3b82f6', input:'#1a1a2e'
};

function fmt(n) { return (n||0).toLocaleString('pt-BR', { minimumFractionDigits:0, maximumFractionDigits:0 }); }
function corScore(s) { return s < 60 ? C.red : s < 80 ? C.yellow : C.green; }

function LineChart({ dados, campo, cor, label, formato }) {
  if (!dados || dados.length < 2) return null;
  const vals = dados.map(d => d[campo] || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 400, H = 80, PAD = 8;
  const xs = dados.map((_, i) => PAD + (i / (dados.length - 1)) * (W - PAD * 2));
  const ys = vals.map(v => H - PAD - ((v - min) / range) * (H - PAD * 2));
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const areaPath = `M${xs[0]},${H} ` + xs.map((x, i) => `L${x},${ys[i]}`).join(' ') + ` L${xs[xs.length-1]},${H} Z`;

  const ultimo = vals[vals.length - 1];
  const anterior = vals[vals.length - 2];
  const diff = ultimo - anterior;
  const diffPct = anterior > 0 ? ((diff / anterior) * 100).toFixed(1) : null;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>{label}</div>
          <div style={{ fontSize:22, fontWeight:800, color:cor }}>
            {formato === 'brl' ? `R$${fmt(ultimo)}` : ultimo}
          </div>
        </div>
        {diffPct !== null && (
          <div style={{ background: diff >= 0 ? '#0d2d1a' : '#2d1b1b', border:`1px solid ${diff >= 0 ? C.green : C.red}40`, borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:600, color: diff >= 0 ? C.green : C.red }}>
            {diff >= 0 ? '↑' : '↓'} {Math.abs(diffPct)}%
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:H }}>
        <defs>
          <linearGradient id={`grad-${campo}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={cor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${campo})`} />
        <polyline points={polyline} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="3" fill={cor} />
        ))}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:10, color:C.muted }}>{dados[0]?.data_fmt}</span>
        <span style={{ fontSize:10, color:C.muted }}>{dados[dados.length-1]?.data_fmt}</span>
      </div>
    </div>
  );
}

function ScoreRadar({ scores }) {
  if (!scores) return null;
  const cats = [
    { key:'reputacao', label:'Rep.' },
    { key:'operacao', label:'Op.' },
    { key:'estoque', label:'Est.' },
    { key:'atendimento', label:'Atend.' },
    { key:'publicidade', label:'Ads' },
  ];
  const N = cats.length;
  const R = 70, CX = 90, CY = 80;
  const angle = (i) => (i / N) * 2 * Math.PI - Math.PI / 2;
  const pt = (i, r) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i))
  });

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = cats.map((c, i) => pt(i, (scores[c.key] || 0) / 100 * R));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px' }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>Radar de scores (atual)</div>
      <svg viewBox="0 0 180 160" style={{ width:'100%', maxWidth:200, display:'block', margin:'0 auto' }}>
        {gridLevels.map(lvl => {
          const pts = cats.map((_, i) => pt(i, lvl / 100 * R));
          const d = pts.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ') + ' Z';
          return <path key={lvl} d={d} fill="none" stroke={C.border} strokeWidth="1" />;
        })}
        {cats.map((_, i) => {
          const p = pt(i, R);
          return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={C.border} strokeWidth="1" />;
        })}
        <path d={dataPath} fill={`${C.green}30`} stroke={C.green} strokeWidth="2" />
        {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.green} />)}
        {cats.map((c, i) => {
          const p = pt(i, R + 14);
          return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={C.muted}>{c.label}</text>;
        })}
      </svg>
    </div>
  );
}

export default function Historico({ mlAuth, usuario, isMobile }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (mlAuth && usuario) carregar();
  }, [mlAuth, usuario]);

  const carregar = async () => {
    setLoading(true); setErro('');
    try {
      const r = await ml.historico(usuario.id, mlAuth?.conta_ml_id || '');
      if (r.historico) setDados(r);
      else setErro(r.detail || 'Nenhum histórico encontrado.');
    } catch { setErro('Erro ao carregar histórico.'); }
    setLoading(false);
  };

  const hist = dados?.historico || [];
  const histFmt = hist.map(h => ({
    ...h,
    data_fmt: new Date(h.criado_em || h.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }),
    score_total: h.score_total || 0,
    receita_perdida: h.receita_perdida_estimada || h.receita_perdida || 0,
    faturamento: h.faturamento_estimado || h.faturamento || 0,
    alertas_criticos: h.alertas_criticos || 0,
  }));

  const ultimo = histFmt[histFmt.length - 1];
  const penultimo = histFmt[histFmt.length - 2];

  return (
    <div style={{ padding: isMobile ? 16 : 28, maxWidth:960, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:700 }}>Histórico de evolução</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Acompanhe o progresso da sua conta ao longo do tempo</div>
        </div>
        <button onClick={carregar} disabled={loading} style={{ padding:'8px 16px', background:C.border, color:C.muted, border:'none', borderRadius:8, fontSize:12, cursor:'pointer' }}>
          {loading ? '⏳' : '↻ Atualizar'}
        </button>
      </div>

      {!mlAuth && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:'center', color:C.muted }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔗</div>
          <div style={{ fontSize:14 }}>Conecte sua conta ML para ver o histórico.</div>
        </div>
      )}

      {mlAuth && loading && (
        <div style={{ textAlign:'center', padding:60, color:C.muted, fontSize:14 }}>⏳ Carregando histórico...</div>
      )}

      {mlAuth && erro && !loading && (
        <div style={{ background:'#13131f', border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14, color:C.muted, marginBottom:16 }}>Ainda não há histórico disponível.</div>
          <div style={{ fontSize:12, color:'#444' }}>Gere alguns diagnósticos na Visão Geral para começar a registrar sua evolução.</div>
        </div>
      )}

      {mlAuth && !loading && histFmt.length > 0 && (
        <>
          {/* RESUMO ÚLTIMO VS ANTERIOR */}
          {ultimo && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Score atual', val: ultimo.score_total, prev: penultimo?.score_total, fmt: v => v, cor: corScore(ultimo.score_total) },
                { label:'Receita perdida', val: ultimo.receita_perdida, prev: penultimo?.receita_perdida, fmt: v => `R$${fmt(v)}`, cor: C.red, inverso: true },
                { label:'Faturamento est.', val: ultimo.faturamento, prev: penultimo?.faturamento, fmt: v => `R$${fmt(v)}`, cor: C.green },
                { label:'Alertas críticos', val: ultimo.alertas_criticos, prev: penultimo?.alertas_criticos, fmt: v => v, cor: C.yellow, inverso: true },
              ].map(({ label, val, prev, fmt: fmtFn, cor, inverso }) => {
                const diff = prev != null ? val - prev : null;
                const positivo = inverso ? diff < 0 : diff > 0;
                return (
                  <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:800, color:cor }}>{fmtFn(val)}</div>
                    {diff !== null && diff !== 0 && (
                      <div style={{ fontSize:10, marginTop:4, color: positivo ? C.green : C.red }}>
                        {positivo ? '↑' : '↓'} {fmtFn(Math.abs(diff))} vs anterior
                      </div>
                    )}
                    {diff === 0 && <div style={{ fontSize:10, marginTop:4, color:C.muted }}>= sem mudança</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* GRÁFICOS */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:16 }}>
            <LineChart dados={histFmt} campo="score_total" cor={C.blue} label="Score total" formato="num" />
            <LineChart dados={histFmt} campo="receita_perdida" cor={C.red} label="Receita perdida estimada" formato="brl" />
            <LineChart dados={histFmt} campo="faturamento" cor={C.green} label="Faturamento estimado" formato="brl" />
            {ultimo?.scores && <ScoreRadar scores={ultimo.scores} />}
          </div>

          {/* TIMELINE */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700 }}>Timeline de diagnósticos</div>
              <div style={{ fontSize:11, color:C.muted }}>{histFmt.length} diagnóstico{histFmt.length !== 1 ? 's' : ''} registrado{histFmt.length !== 1 ? 's' : ''}</div>
            </div>
            {[...histFmt].reverse().map((h, i) => {
              const anterior = [...histFmt].reverse()[i + 1];
              const diffScore = anterior ? h.score_total - anterior.score_total : null;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 18px', borderBottom: i < histFmt.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`${corScore(h.score_total)}20`, border:`2px solid ${corScore(h.score_total)}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:corScore(h.score_total), flexShrink:0 }}>
                    {h.score_total}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{h.data_fmt}</div>
                    <div style={{ fontSize:11, color:C.muted }}>
                      {h.alertas_criticos > 0 ? `${h.alertas_criticos} alerta(s) crítico(s)` : 'Sem alertas críticos'} · {h.receita_perdida > 0 ? `R$${fmt(h.receita_perdida)} perdidos/mês` : 'Receita saudável'}
                    </div>
                  </div>
                  {diffScore !== null && diffScore !== 0 && (
                    <div style={{ fontSize:12, fontWeight:700, color: diffScore > 0 ? C.green : C.red, flexShrink:0 }}>
                      {diffScore > 0 ? '+' : ''}{diffScore} pts
                    </div>
                  )}
                  {i === 0 && (
                    <div style={{ background:'#1a2a1a', border:`1px solid ${C.green}40`, borderRadius:5, padding:'2px 8px', fontSize:9, color:C.green, fontWeight:700, flexShrink:0 }}>ATUAL</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
