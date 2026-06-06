const API = 'https://dianostico-ml-production.up.railway.app';

export const auth = {
  login: (email, senha) => fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, senha})
  }).then(r => r.json()),

  register: (email, senha, nome, plano) => fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, senha, nome, plano})
  }).then(r => r.json()),
};

export const ml = {
  connect: (code, usuario_id) => fetch(`${API}/ml/connect`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({code, usuario_id})
  }).then(r => r.json()),

  diagnostico: (user_id, token, usuario_id, conta_ml_id) =>
    fetch(`${API}/diagnostico/${user_id}?token=${token}&usuario_id=${usuario_id}&conta_ml_id=${conta_ml_id}`).then(r => r.json()),

  item: (item_id, token, user_id) =>
    fetch(`${API}/item/${item_id}?token=${token}&user_id=${user_id}`).then(r => r.json()),

  historico: (usuario_id, conta_ml_id) =>
    fetch(`${API}/historico/${usuario_id}?conta_ml_id=${conta_ml_id}`).then(r => r.json()),
};
