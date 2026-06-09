const CACHE_NAME = 'el-cache-v7';
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
