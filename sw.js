/* Service worker — Conferência de Roteiro (Patrimar Móveis)
   Ao publicar qualquer mudança no app, incremente VERSAO. O navegador detecta
   o sw.js novo, baixa tudo de novo e o app oferece "Atualizar" ao usuário. */
'use strict';

const VERSAO = '2.3.0';
const CACHE = 'conferir-roteiro-' + VERSAO;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'ATIVAR') self.skipWaiting();
});

/* Cache-first: o app é todo local e versionado pelo VERSAO acima.
   Rede só como reserva — na fábrica ela é o elo fraco, não o cache. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request))
  );
});
