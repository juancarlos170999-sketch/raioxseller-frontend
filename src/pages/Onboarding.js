import React from 'react';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', blue:'#3b82f6'
};

export default function Onboarding({ usuario, mlAuth, onPular }) {
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
          Sua conta está conectada! Agora clique em <strong style={{ color:C.text }}>"Gerar diagnóstico"</strong> para descobrir quanto você está perdendo por mês.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28, textAlign:'left' }}>
          {[
            ['⚡', 'Diagnóstico completo em 5 categorias'],
            ['💰', 'Cálculo de receita perdida por mês'],
            ['📋', 'Plano de ação priorizado por impacto'],
          ].map(([icon, texto]) => (
            <div key={texto} style={{ display:'flex', alignItems:'center', gap:12, background:'#0f0f1a', borderRadius:10, padding:'11px 14px' }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:13, color:C.text }}>{texto}</span>
            </div>
          ))}
        </div>

        <button onClick={onPular} style={{
          width:'100%', padding:'13px 0', background:C.green, color:'#fff',
          border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer'
        }}>
          Ir para o dashboard →
        </button>
      </div>
    </div>
  );
}
