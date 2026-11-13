// Aplica o tema salvo antes do React carregar (evita "piscar" a cor padrão)
try {
  var t = JSON.parse(localStorage.getItem('camada3d-tema') || '{}')
  var hex = /^#[0-9a-fA-F]{6}$/
  var r = document.documentElement
  if (hex.test(t.primaria)) r.style.setProperty('--brand', t.primaria)
  if (hex.test(t.secundaria)) r.style.setProperty('--accent', t.secundaria)
  var claro = t.modo === 'claro' || (t.modo === 'sistema' && window.matchMedia('(prefers-color-scheme: light)').matches)
  if (claro) r.classList.add('light')
} catch (e) {}
