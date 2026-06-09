import React, { useState } from 'react';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', blue:'#3b82f6', yellow:'#f5a623'
};

// Tour guiado: tooltips com seta apontando para elementos do dashboard
const TOUR_STEPS = [
  {
    id: 'diagnostico',
    titulo: '▶ Gerar diagnóstico',
    descricao: 'Clique aqui para analisar sua conta e descobrir quanto está perdendo por mês.',
    posicao: 'bottom-left', // tooltip abaixo do botão no canto superior direito
    destaque: 'top-right',
  },
  {
    id: 'sidebar',
    titulo: '📋 Plano de ação',
    descricao: 'Após o diagnóstico, veja seu plano de ação priorizado por impacto financeiro.',
    posicao: 'right',
    destaque: 'sidebar-plano',
  },
  {
    id: 'planos',
    titulo: '⬆ Fazer upgrade',
    descricao: 'Desbloqueie Histórico, Análise de produto e Simulador de Ads nos planos Gold e Platinum.',
    posicao: 'top',
    destaque: 'bottom-left',
  },
];

function TourTooltip({ step, total, onNext, onPular }) {
  const isLast = step === total - 1;

  // Posições fixas para cada tooltip do tour
  const posStyles = [
    { top: 70, right: 16 },       // step 0 — abaixo do botão Gerar diagnóstico
    { top: '40%', left: 180 },    // step 1 — ao lado do sidebar Plano de ação
    { bottom: 90, left: 16 },     // step 2 — acima do botão Fazer upgrade (mobile/sidebar)
  ];

  const pos = posStyles[step] || { top: 80, right: 16 };

  return (
    <>
      {/* Overlay escuro semi-transparente */}
      <div style={{ position:'fixed', inset:0, background:'#00000060', zIndex:400 }} onClick={onPular} />

      {/* Tooltip */}
      <div style={{
        position:'fixed', ...pos, zIndex:401,
        background:C.card, border:`2px solid ${C.green}`,
        borderRadius:14, padding:'16px 18px', maxWidth:260,
        boxShadow:`0 0 24px ${C.green}40`
      }}>
        {/* Indicador de progresso */}
        <div style={{ display:'flex', gap:4, marginBottom:10 }}>
          {Array.from({length:total}).map((_,i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= step ? C.green : C.border }} />
          ))}
        </div>

        <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:6 }}>
          {TOUR_STEPS[step].titulo}
        </div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:14 }}>
          {TOUR_STEPS[step].descricao}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={onPular} style={{ background:'transparent', border:'none', color:C.muted, fontSize:11, cursor:'pointer' }}>
            Pular tour
          </button>
          <button onClick={onNext} style={{
            padding:'7px 16px', background: isLast ? C.green : C.blue,
            color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer'
          }}>
            {isLast ? 'Concluir ✓' : 'Próximo →'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Onboarding({ usuario, mlAuth, onPular }) {
  const [fase, setFase] = useState('boas-vindas'); // 'boas-vindas' | 'tour'
  const [tourStep, setTourStep] = useState(0);

  const iniciarTour = () => setFase('tour');

  const proximoTour = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(s => s + 1);
    } else {
      onPular(); // tour concluído
    }
  };

  if (fase === 'tour') {
    return (
      <TourTooltip
        step={tourStep}
        total={TOUR_STEPS.length}
        onNext={proximoTour}
        onPular={onPular}
      />
    );
  }

  // Fase: boas-vindas
  return (
    <div style={{ position:'fixed', inset:0, background:'#00000090', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:460, padding:'36px 32px', textAlign:'center' }}>

        <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:6 }}>
          Bem-vindo ao RaioxSeller, {usuario.nome?.split(' ')[0] || 'vendedor'}!
        </div>
        {mlAuth?.nickname && (
          <div style={{ background:'#0d2d1a', border:`1px solid ${C.green}`, borderRadius:10, padding:'8px 16px', display:'inline-block', fontSize:13, color:'#9FE1CB', margin:'12px 0' }}>
            ✅ {mlAuth.nickname} conectado
          </div>
        )}
        <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:24, marginTop:8 }}>
          Sua conta está conectada! Quer um tour rápido pelo dashboard?
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28, textAlign:'left' }}>
          {[
            ['⚡', 'Gerar diagnóstico completo em segundos'],
            ['💰', 'Ver quanto está perdendo por mês'],
            ['📋', 'Plano de ação priorizado por impacto'],
          ].map(([icon, texto]) => (
            <div key={texto} style={{ display:'flex', alignItems:'center', gap:12, background:'#0f0f1a', borderRadius:10, padding:'11px 14px' }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:13, color:C.text }}>{texto}</span>
            </div>
          ))}
        </div>

        <button onClick={iniciarTour} style={{
          width:'100%', padding:'13px 0', background:C.green, color:'#fff',
          border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:8
        }}>
          🗺 Fazer tour guiado →
        </button>
        <button onClick={onPular} style={{
          width:'100%', padding:'10px 0', background:'transparent', color:C.muted,
          border:'none', fontSize:12, cursor:'pointer'
        }}>
          Pular e ir direto para o dashboard
        </button>
      </div>
    </div>
  );
}
