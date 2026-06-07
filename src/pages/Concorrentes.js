import React from 'react';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', yellow:'#f5a623'
};

export default function Concorrentes() {
  return (
    <div style={{ padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>Análise de concorrentes</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:24 }}>Veja como você se compara com os top sellers da sua categoria</div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔭</div>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>Em desenvolvimento</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20, maxWidth:400, margin:'0 auto 20px' }}>
          A análise automática de concorrentes por categoria está sendo desenvolvida e será liberada em breve.
        </div>
        <div style={{ background:'#0d1f35', border:`1px solid #3b82f640`, borderRadius:8, padding:16, maxWidth:440, margin:'0 auto', textAlign:'left' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#7ab3f0', marginBottom:8 }}>O que será possível ver:</div>
          {[
            'Top 5 concorrentes por volume de vendas na sua categoria',
            'Comparação de preço, frete e logística',
            'Reputação e nível MercadoLíder dos concorrentes',
            'Alertas quando um concorrente reduzir o preço',
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'4px 0', fontSize:12, color:'#a0c4f0' }}>
              <span style={{ color:'#7ab3f0', marginTop:1 }}>→</span> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
