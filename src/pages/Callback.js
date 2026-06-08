import React, { useEffect, useState, useRef } from 'react';
import { ml } from '../api';

const C = {
  bg:'#0a0a12', text:'#e2e2f0', muted:'#6b6b8a',
  green:'#00a650', red:'#e52b2b', card:'#13131f', border:'#1e1e2e'
};

export default function Callback({ usuario, onMlAuth }) {
  const [status, setStatus] = useState('conectando');
  const [erro, setErro] = useState('');
  const chamado = useRef(false); // evita dupla chamada do React StrictMode

  useEffect(() => {
    if (chamado.current) return;
    chamado.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setStatus('erro');
      setErro('Código de autorização não encontrado na URL.');
      return;
    }

    if (!usuario) {
      localStorage.setItem('ml_pending_code', code);
      window.location.href = '/';
      return;
    }

    ml.connect(code, usuario.id)
      .then(r => {
        if (r.success) {
          onMlAuth(r);
          setStatus('sucesso');
          setTimeout(() => { window.location.href = '/'; }, 2000);
        } else {
          setStatus('erro');
          setErro(r.detail || 'Erro ao conectar conta ML. Tente autorizar novamente.');
        }
      })
      .catch(() => {
        setStatus('erro');
        setErro('Erro de conexão com o servidor. Tente novamente.');
      });
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'40px 48px', textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:40, marginBottom:16 }}>
          {status === 'conectando' ? '🔄' : status === 'sucesso' ? '✅' : '❌'}
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>
          {status === 'conectando' ? 'Conectando sua conta...' : status === 'sucesso' ? 'Conta conectada!' : 'Erro ao conectar'}
        </div>
        <div style={{ fontSize:13, color:C.muted, marginBottom: status === 'erro' ? 16 : 0 }}>
          {status === 'conectando' ? 'Aguarde enquanto autorizamos sua conta do Mercado Livre.' :
           status === 'sucesso' ? 'Redirecionando para o dashboard...' : erro}
        </div>
        {status === 'erro' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => window.location.href='/'} style={{ padding:'10px 24px', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
              Voltar ao início
            </button>
            <div style={{ fontSize:11, color:'#444' }}>
              O código do ML expira em poucos minutos. Se o erro persistir, tente autorizar novamente.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
