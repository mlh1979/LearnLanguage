const CACHE_NAME = 'el-cache-v13';
const FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(FILES);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(n) { return n !== CACHE_NAME; })
                     .map(function(n) { return caches.delete(n); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(e) {
    // Only handle http/https requests — ignore chrome-extension, devtools, etc.
    if (e.request.url.startsWith('chrome-extension') || e.request.url.startsWith('chrome-devtools') || e.request.url.startsWith('ws:')) {
        return;
    }
    var url = new URL(e.request.url);
    // Always fetch index.html from network (it contains the latest JS)
    if (e.request.mode === 'navigate' || (url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
        e.respondWith(
            fetch(e.request).then(function(response) {
                return caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(e.request, response.clone());
                    return response;
                });
            }).catch(function() {
                return caches.match(e.request);
            })
        );
        return;
    }
    e.respondWith(
        caches.match(e.request).then(function(r) {
            return r || fetch(e.request).then(function(response) {
                return caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});

// When a new service worker is ready, notify the page
self.addEventListener('message', function(e) {
    if (e.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
