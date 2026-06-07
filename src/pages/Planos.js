import React, { useState } from 'react';
import { pagamento } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', blue:'#3b82f6', input:'#1a1a2e'
};

const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 97,
    cor: C.blue,
    features: [
      '1 conta ML conectada',
      'Diagnóstico completo mensal',
      '5 categorias de análise',
      'Calculadora de precificação',
      'Plano de ação priorizado',
    ],
    limitado: ['Sem histórico de evolução', 'Sem análise de produto ilimitada']
  },
  {
    id: 'pro',
    nome: 'Pro',
    preco: 197,
    cor: C.yellow,
    destaque: true,
    features: [
      '3 contas ML conectadas',
      'Diagnóstico semanal automático',
      'Histórico de evolução do score',
      'Análise de produto ilimitada',
      'Simulador de Ads com ROAS',
      'Alertas por email',
    ],
    limitado: []
  },
  {
    id: 'agencia',
    nome: 'Agência',
    preco: 397,
    cor: C.green,
    features: [
      '10 contas ML conectadas',
      'Diagnóstico diário automático',
      'Tudo do plano Pro',
      'Painel multi-contas',
      'Relatório white label',
      'Suporte prioritário',
    ],
    limitado: []
  }
];

export default function Planos({ usuario, onVoltar }) {
  const [loading, setLoading] = useState(null);
  const [erro, setErro] = useState('');

  const assinar = async (plano_id) => {
    setLoading(plano_id);
    setErro('');
    try {
      const r = await pagamento.criar(plano_id, usuario.id, usuario.email, usuario.nome || '');
      if (r.success && r.checkout_url) {
        window.location.href = r.checkout_url;
      } else {
        setErro(r.detail || 'Erro ao criar assinatura. Tente novamente.');
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    }
    setLoading(null);
  };

  return (
    <div style={{ padding:24, fontFamily:'Inter, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
        <button onClick={onVoltar} style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', fontSize:13 }}>← Voltar</button>
      </div>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ fontSize:24, fontWeight:700, color:C.text, marginBottom:8 }}>Escolha seu plano</div>
        <div style={{ fontSize:14, color:C.muted }}>Cancele quando quiser. Sem fidelidade.</div>
      </div>

      {erro && <div style={{ background:'#2d1b1b', border:'1px solid #e52b2b40', borderRadius:8, padding:12, color:'#f09575', fontSize:13, marginBottom:16, textAlign:'center' }}>{erro}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, maxWidth:900, margin:'0 auto' }}>
        {PLANOS.map(plano => (
          <div key={plano.id} style={{
            background: C.card,
            border: `${plano.destaque ? '2px' : '1px'} solid ${plano.destaque ? plano.cor : C.border}`,
            borderRadius:12, padding:24, position:'relative'
          }}>
            {plano.destaque && (
              <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:plano.cor, color:'#fff', padding:'3px 16px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                MAIS POPULAR
              </div>
            )}
            <div style={{ fontSize:16, fontWeight:700, color:plano.cor, marginBottom:4 }}>{plano.nome}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:20 }}>
              <span style={{ fontSize:36, fontWeight:900, color:C.text }}>R${plano.preco}</span>
              <span style={{ fontSize:13, color:C.muted }}>/mês</span>
            </div>

            <div style={{ marginBottom:20 }}>
              {plano.features.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'5px 0', fontSize:13, color:C.text }}>
                  <span style={{ color:C.green, fontSize:16 }}>✓</span> {f}
                </div>
              ))}
              {plano.limitado.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'5px 0', fontSize:13, color:C.muted }}>
                  <span style={{ color:C.muted, fontSize:16 }}>✗</span> {f}
                </div>
              ))}
            </div>

            <button
              onClick={() => assinar(plano.id)}
              disabled={loading === plano.id || usuario.plano === plano.id}
              style={{
                width:'100%', padding:'12px 0',
                background: usuario.plano === plano.id ? '#1e1e2e' : plano.cor,
                color: usuario.plano === plano.id ? C.muted : '#fff',
                border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor: usuario.plano === plano.id ? 'default' : 'pointer'
              }}
            >
              {loading === plano.id ? 'Aguarde...' : usuario.plano === plano.id ? 'Plano atual' : `Assinar ${plano.nome}`}
            </button>
          </div>
        ))}
      </div>

      <div style={{ textAlign:'center', marginTop:24, fontSize:12, color:C.muted }}>
        Pagamento processado com segurança pelo Mercado Pago · Cancele quando quiser
      </div>
    </div>
  );
}
