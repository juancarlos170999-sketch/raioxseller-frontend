import React, { useState, useEffect } from 'react';
import { pagamento } from '../api';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650',
  yellow:'#f5a623', blue:'#3b82f6', red:'#e52b2b', input:'#1a1a2e',
  gold:'#d4a017', platinum:'#a8b8c8'
};

const PLANOS = [
  {
    id: 'starter',
    nome: 'Líder',
    badge: null,
    preco: 97,
    cor: C.blue,
    descricao: 'Para quem está começando a otimizar a operação.',
    features: [
      { icon:'✅', texto:'1 conta ML conectada' },
      { icon:'✅', texto:'Diagnóstico completo (manual)' },
      { icon:'✅', texto:'5 categorias de análise' },
      { icon:'✅', texto:'Calculadora de precificação' },
      { icon:'✅', texto:'Plano de ação priorizado' },
    ],
    bloqueado: [
      'Histórico de evolução',
      'Análise de produto por MLB',
      'Simulador de Ads com ROAS',
      'Módulo de promoções',
    ]
  },
  {
    id: 'pro',
    nome: 'Líder Gold',
    badge: 'MAIS POPULAR',
    preco: 197,
    cor: C.gold,
    descricao: 'Para sellers que querem crescer com dados.',
    destaque: true,
    features: [
      { icon:'✅', texto:'3 contas ML conectadas' },
      { icon:'✅', texto:'Tudo do plano Líder' },
      { icon:'✅', texto:'Histórico de evolução do score' },
      { icon:'✅', texto:'Análise de produto por MLB' },
      { icon:'✅', texto:'Simulador de Ads com ROAS' },
      { icon:'✅', texto:'Módulo de promoções' },
    ],
    bloqueado: [
      'Painel multi-contas',
      'Suporte prioritário via WhatsApp',
    ]
  },
  {
    id: 'agencia',
    nome: 'Líder Platinum',
    badge: 'AGÊNCIAS',
    preco: 397,
    cor: C.platinum,
    descricao: 'Para agências e grandes operações.',
    features: [
      { icon:'✅', texto:'10 contas ML conectadas' },
      { icon:'✅', texto:'Tudo do plano Líder Gold' },
      { icon:'✅', texto:'Painel multi-contas' },
      { icon:'✅', texto:'Suporte prioritário via WhatsApp' },
      { icon:'✅', texto:'Diagnóstico diário automático' },
      { icon:'✅', texto:'Relatório exportável (em breve)' },
    ],
    bloqueado: []
  }
];

const PLANO_LABELS = {
  starter: 'Líder', pro: 'Líder Gold', agencia: 'Líder Platinum', iniciante: 'Líder'
};

export default function Planos({ usuario, onVoltar, onAtualizarUsuario }) {
  const [loading, setLoading] = useState(null);
  const [erro, setErro] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [confirmaCancelamento, setConfirmaCancelamento] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const planoAtual = usuario.plano;
  const temPlano = ['pro', 'agencia'].includes(planoAtual);

  const assinar = async (plano_id) => {
    setLoading(plano_id); setErro('');
    try {
      const r = await pagamento.criar(plano_id, usuario.id, usuario.email, usuario.nome || '');
      if (r.success && r.checkout_url) {
        window.location.href = r.checkout_url;
      } else {
        setErro(r.detail || 'Erro ao criar assinatura. Tente novamente.');
      }
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    setLoading(null);
  };

  const cancelarPlano = async () => {
    setCancelando(true);
    try {
      const r = await pagamento.cancelar(usuario.id);
      if (r.success) {
        setConfirmaCancelamento(false);
        if (onAtualizarUsuario) onAtualizarUsuario({ ...usuario, plano: 'starter' });
        alert('Assinatura cancelada. Seu acesso foi rebaixado para o plano Líder.');
        onVoltar();
      } else {
        setErro(r.detail || 'Erro ao cancelar. Entre em contato com o suporte.');
      }
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    setCancelando(false);
  };

  const planoIdx = { starter:0, iniciante:0, pro:1, agencia:2 };
  const idxAtual = planoIdx[planoAtual] ?? 0;

  return (
    <div style={{ padding: isMobile ? 16 : 28, fontFamily:'Inter, sans-serif', maxWidth:960, margin:'0 auto' }}>
      <button onClick={onVoltar} style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', fontSize:13, marginBottom:16 }}>← Voltar</button>

      <div style={{ textAlign:'center', marginBottom: isMobile ? 24 : 36 }}>
        <div style={{ fontSize: isMobile ? 20 : 26, fontWeight:800, color:C.text, marginBottom:8 }}>Escolha seu plano</div>
        <div style={{ fontSize:13, color:C.muted }}>Cancele quando quiser. Sem fidelidade. Sem taxa de adesão.</div>
      </div>

      {erro && (
        <div style={{ background:'#2d1b1b', border:'1px solid #e52b2b40', borderRadius:8, padding:12, color:'#f09575', fontSize:13, marginBottom:16, textAlign:'center' }}>{erro}</div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 16, marginBottom:24 }}>
        {PLANOS.map((plano, idx) => {
          const isAtual = usuario.plano === plano.id || (plano.id === 'starter' && ['starter','iniciante'].includes(usuario.plano));
          const isUpgrade = idx > idxAtual;
          const isDowngrade = idx < idxAtual;

          return (
            <div key={plano.id} style={{
              background: C.card,
              border: `${plano.destaque ? '2px' : '1px'} solid ${isAtual ? C.green : plano.destaque ? plano.cor : C.border}`,
              borderRadius:14, padding: isMobile ? '20px 18px' : 24, position:'relative',
              boxShadow: plano.destaque ? `0 0 30px ${plano.cor}15` : 'none'
            }}>
              {plano.badge && (
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background: plano.badge === 'AGÊNCIAS' ? C.platinum : plano.cor, color: plano.badge === 'AGÊNCIAS' ? '#0a0a12' : '#fff', padding:'3px 14px', borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
                  {plano.badge}
                </div>
              )}
              {isAtual && (
                <div style={{ position:'absolute', top:-12, right:16, background:C.green, color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700 }}>
                  PLANO ATUAL
                </div>
              )}

              <div style={{ marginBottom:4 }}>
                <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:800, color:plano.cor }}>{plano.nome}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{plano.descricao}</div>
              </div>

              <div style={{ display:'flex', alignItems:'baseline', gap:4, margin:'14px 0 6px' }}>
                <span style={{ fontSize: isMobile ? 28 : 34, fontWeight:900, color:C.text }}>R${plano.preco}</span>
                <span style={{ fontSize:12, color:C.muted }}>/mês</span>
              </div>
              <div style={{ fontSize:10, color:C.muted, marginBottom:18 }}>
                R${(plano.preco / 30).toFixed(2)}/dia · cobrado mensalmente
              </div>

              <div style={{ marginBottom:18 }}>
                {plano.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'4px 0', fontSize:12, color:C.text }}>
                    <span style={{ color:C.green, flexShrink:0 }}>{f.icon}</span>
                    <span>{f.texto}</span>
                  </div>
                ))}
                {plano.bloqueado.map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'4px 0', fontSize:12, color:'#333' }}>
                    <span style={{ flexShrink:0 }}>✗</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => !isAtual && assinar(plano.id)}
                disabled={loading === plano.id || isAtual}
                style={{
                  width:'100%', padding:'12px 0',
                  background: isAtual ? '#1e1e2e' : isDowngrade ? C.border : plano.cor,
                  color: isAtual ? C.muted : isDowngrade ? C.muted : plano.id === 'agencia' ? '#0a0a12' : '#fff',
                  border:'none', borderRadius:8, fontWeight:700, fontSize:13,
                  cursor: isAtual ? 'default' : 'pointer'
                }}
              >
                {loading === plano.id ? 'Aguarde...' : isAtual ? '✓ Plano atual' : isUpgrade ? `Fazer upgrade →` : isDowngrade ? 'Fazer downgrade' : `Assinar ${plano.nome}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* COMPARATIVO MOBILE */}
      {isMobile && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>Comparativo de features</div>
          {[
            ['Contas ML', '1', '3', '10'],
            ['Diagnóstico', 'Manual', 'Manual', 'Diário auto'],
            ['Histórico', '✗', '✅', '✅'],
            ['Análise produto', '✗', '✅', '✅'],
            ['Simulador Ads', '✗', '✅', '✅'],
            ['Multi-contas', '✗', '✗', '✅'],
            ['Suporte WhatsApp', '✗', '✗', '✅'],
          ].map(([feat, v1, v2, v3]) => (
            <div key={feat} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4, padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:11, alignItems:'center' }}>
              <span style={{ color:C.muted }}>{feat}</span>
              <span style={{ textAlign:'center', color: v1==='✗' ? '#333' : C.text }}>{v1}</span>
              <span style={{ textAlign:'center', color: v2==='✗' ? '#333' : C.gold }}>{v2}</span>
              <span style={{ textAlign:'center', color: v3==='✗' ? '#333' : C.platinum }}>{v3}</span>
            </div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4, marginTop:8 }}>
            <span style={{ fontSize:10, color:C.muted }}></span>
            <span style={{ fontSize:10, color:C.blue, textAlign:'center', fontWeight:600 }}>Líder</span>
            <span style={{ fontSize:10, color:C.gold, textAlign:'center', fontWeight:600 }}>Gold</span>
            <span style={{ fontSize:10, color:C.platinum, textAlign:'center', fontWeight:600 }}>Platinum</span>
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', fontSize:11, color:'#333', marginBottom:24 }}>
        🔒 Pagamento seguro via Mercado Pago · Cancele quando quiser · Sem contrato de fidelidade
      </div>

      {/* CANCELAMENTO */}
      {temPlano && !confirmaCancelamento && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'14px 18px', background:C.card, border:`1px solid ${C.border}`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:13, color:C.muted }}>Quer cancelar sua assinatura?</div>
            <div style={{ fontSize:11, color:'#444', marginTop:2 }}>Você terá acesso até o fim do período pago. Depois volta para o plano Líder.</div>
          </div>
          <button onClick={() => setConfirmaCancelamento(true)} style={{ padding:'8px 18px', background:'transparent', color:C.red, border:`1px solid ${C.red}40`, borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
            Cancelar assinatura
          </button>
        </div>
      )}

      {confirmaCancelamento && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 24px', background:'#2d1b1b', border:`1px solid ${C.red}40`, borderRadius:10 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#f09575', marginBottom:8 }}>⚠️ Confirmar cancelamento</div>
          <div style={{ fontSize:13, color:'#f09575', marginBottom:16 }}>
            Tem certeza? Você perderá acesso às funcionalidades do plano {PLANO_LABELS[planoAtual]} e voltará para o Líder.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={cancelarPlano} disabled={cancelando} style={{ padding:'9px 20px', background:C.red, color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
            </button>
            <button onClick={() => setConfirmaCancelamento(false)} style={{ padding:'9px 20px', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
