import React, { useState } from 'react';

const C = {
  bg:'#0a0a12', card:'#13131f', border:'#1e1e2e',
  text:'#e2e2f0', muted:'#6b6b8a', green:'#00a650', input:'#1a1a2e'
};

function Secao({ titulo, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>{titulo}</div>
      <div style={{ fontSize:12, color:C.muted, lineHeight:1.8 }}>{children}</div>
    </div>
  );
}

export default function TermosPrivacidade({ aba: abaInicial = 'termos', onFechar }) {
  const [aba, setAba] = useState(abaInicial);

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000090', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:'100%', maxWidth:560, maxHeight:'85vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* HEADER */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>🔍 RaioxSeller</div>
          <button onClick={onFechar} style={{ background:'transparent', border:'none', color:C.muted, fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* ABAS */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          {[['termos','📄 Termos de Uso'],['privacidade','🔒 Privacidade (LGPD)']].map(([id,label]) => (
            <button key={id} onClick={() => setAba(id)} style={{
              flex:1, padding:'11px 0', background:'transparent', border:'none', borderBottom:`2px solid ${aba===id?C.green:'transparent'}`,
              color: aba===id ? C.green : C.muted, fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:-1
            }}>{label}</button>
          ))}
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {aba === 'termos' && (
            <>
              <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>Última atualização: junho de 2026</div>

              <Secao titulo="1. O que é o RaioxSeller">
                O RaioxSeller é uma ferramenta de diagnóstico de performance para vendedores do Mercado Livre. Não somos afiliados, parceiros ou representantes do Mercado Livre.
              </Secao>

              <Secao titulo="2. Uso permitido">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li>Usar a plataforma para analisar sua própria conta do Mercado Livre</li>
                  <li>Gerar diagnósticos e planos de ação para sua operação</li>
                  <li>Utilizar a calculadora de precificação e simulador de Ads</li>
                </ul>
              </Secao>

              <Secao titulo="3. Uso proibido">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li>Compartilhar sua conta com terceiros</li>
                  <li>Usar a plataforma para analisar contas de outros vendedores sem autorização</li>
                  <li>Tentar contornar os limites do plano contratado</li>
                  <li>Usar para fins ilegais ou que violem os Termos do Mercado Livre</li>
                </ul>
              </Secao>

              <Secao titulo="4. Acesso à conta ML">
                Ao autorizar a conexão, o RaioxSeller acessa <strong style={{color:C.text}}>apenas métricas de vendas, reputação e anúncios</strong> via OAuth do Mercado Livre. <strong style={{color:C.text}}>Nunca acessamos</strong> sua senha do ML, dados bancários, CPF/CNPJ ou informações de pagamento dos compradores.
              </Secao>

              <Secao titulo="5. Disponibilidade">
                O serviço é fornecido "como está". Não garantimos disponibilidade 100% e podemos realizar manutenções sem aviso prévio.
              </Secao>

              <Secao titulo="6. Cancelamento">
                Você pode cancelar sua assinatura a qualquer momento dentro da plataforma. O acesso permanece ativo até o fim do período pago.
              </Secao>

              <Secao titulo="7. Contato">
                Dúvidas: contato@raioxseller.com.br
              </Secao>
            </>
          )}

          {aba === 'privacidade' && (
            <>
              <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>Conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</div>

              <Secao titulo="📥 Dados que coletamos">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li><strong style={{color:C.text}}>Cadastro:</strong> nome, e-mail, WhatsApp (opcional) e plano escolhido</li>
                  <li><strong style={{color:C.text}}>Conta ML:</strong> nickname, métricas de reputação, volume de vendas, estoque, perguntas sem resposta e dados de anúncios — obtidos via OAuth</li>
                  <li><strong style={{color:C.text}}>Diagnósticos:</strong> histórico de scores gerados para exibir sua evolução</li>
                  <li><strong style={{color:C.text}}>Uso:</strong> páginas acessadas e ações realizadas na plataforma (para melhorias)</li>
                </ul>
              </Secao>

              <Secao titulo="🚫 O que NÃO coletamos">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li>Senha do Mercado Livre</li>
                  <li>Dados bancários ou de cartão de crédito</li>
                  <li>CPF, CNPJ ou documentos pessoais</li>
                  <li>Dados dos seus compradores</li>
                  <li>Conteúdo de mensagens trocadas no ML</li>
                </ul>
              </Secao>

              <Secao titulo="🎯 Para que usamos seus dados">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li>Gerar diagnósticos e planos de ação da sua conta ML</li>
                  <li>Exibir histórico de evolução do seu score</li>
                  <li>Enviar comunicações sobre a plataforma (com seu consentimento)</li>
                  <li>Melhorar os algoritmos de diagnóstico</li>
                </ul>
              </Secao>

              <Secao titulo="🔗 Compartilhamento de dados">
                Seus dados <strong style={{color:C.text}}>não são vendidos</strong> a terceiros. Utilizamos apenas:
                <ul style={{ paddingLeft:16, margin:0, marginTop:6 }}>
                  <li><strong style={{color:C.text}}>Supabase</strong> — armazenamento seguro dos dados</li>
                  <li><strong style={{color:C.text}}>Mercado Pago</strong> — processamento de pagamentos (não recebemos dados do cartão)</li>
                  <li><strong style={{color:C.text}}>Railway</strong> — hospedagem do servidor (EUA, com adequação LGPD)</li>
                </ul>
              </Secao>

              <Secao titulo="⏱ Retenção de dados">
                Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, os dados são excluídos em até <strong style={{color:C.text}}>90 dias</strong>, salvo obrigação legal.
              </Secao>

              <Secao titulo="✅ Seus direitos (LGPD Art. 18)">
                Você tem direito a:
                <ul style={{ paddingLeft:16, margin:0, marginTop:6 }}>
                  <li><strong style={{color:C.text}}>Acessar</strong> os dados que temos sobre você</li>
                  <li><strong style={{color:C.text}}>Corrigir</strong> dados incorretos</li>
                  <li><strong style={{color:C.text}}>Excluir</strong> sua conta e todos os dados associados</li>
                  <li><strong style={{color:C.text}}>Revogar</strong> o acesso à sua conta ML a qualquer momento</li>
                  <li><strong style={{color:C.text}}>Portabilidade</strong> — solicitar exportação dos seus dados</li>
                </ul>
                Para exercer esses direitos: <strong style={{color:C.text}}>contato@raioxseller.com.br</strong>
              </Secao>

              <Secao titulo="🔐 Segurança">
                <ul style={{ paddingLeft:16, margin:0 }}>
                  <li>Senhas armazenadas com hash SHA-256</li>
                  <li>Comunicação via HTTPS em todas as conexões</li>
                  <li>Tokens do ML armazenados de forma isolada por usuário</li>
                  <li>Acesso ao banco restrito ao servidor da aplicação</li>
                </ul>
              </Secao>

              <Secao titulo="📞 Contato do responsável pelo tratamento">
                RaioxSeller · contato@raioxseller.com.br
              </Secao>
            </>
          )}
        </div>

        <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
          <button onClick={onFechar} style={{ width:'100%', padding:'10px 0', background:C.green, color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Entendi e aceito
          </button>
        </div>
      </div>
    </div>
  );
}
