// Mobile App Service Worker - Phase 4A Advanced Mobile Features
// PURPOSE: Offline support, caching, background sync for mobile app
// FEATURES: Photo upload queue, offline data sync, cache management

const CACHE_NAME = 'mobile-app-v1.0.0';
const STATIC_CACHE_NAME = 'static-v1.0.0';
const PHOTO_CACHE_NAME = 'photos-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/mobile-app.html',
    '/css/auth.css',
    '/css/components/mobile-camera.css',
    '/css/components/auth-nav.css',
    '/js/mobile-app.js',
    '/js/modules/mobile/MobileCameraService.js',
    '/js/modules/mobile/MobilePhotoUploadService.js',
    '/js/modules/mobile/MobileCameraUI.js',
    '/js/modules/AuthService.js',
    '/js/modules/LocationsService.js',
    '/js/utils/helpers.js',
    '/js/utils/validation.js',
    'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places',
];

// Background sync tags
const PHOTO_UPLOAD_SYNC_TAG = 'photo-upload-sync';
const LOCATION_DATA_SYNC_TAG = 'location-data-sync';

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('📱 Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES.filter(url => !url.includes('YOUR_API_KEY')));
            }),
            
            // Initialize photo cache
            caches.open(PHOTO_CACHE_NAME).then((cache) => {
                console.log('📸 Initializing photo cache...');
                return cache;
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== PHOTO_CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - handle requests with cache-first strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Handle different types of requests
    if (event.request.method === 'GET') {
        if (isStaticResource(event.request)) {
            event.respondWith(handleStaticResource(event.request));
        } else if (isPhotoRequest(event.request)) {
            event.respondWith(handlePhotoRequest(event.request));
        } else if (isAPIRequest(event.request)) {
            event.respondWith(handleAPIRequest(event.request));
        } else {
            event.respondWith(handleGenericRequest(event.request));
        }
    } else if (event.request.method === 'POST' && isPhotoUpload(event.request)) {
        event.respondWith(handlePhotoUpload(event.request));
    }
});

// Background sync event - handle offline uploads
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === PHOTO_UPLOAD_SYNC_TAG) {
        event.waitUntil(uploadQueuedPhotos());
    } else if (event.tag === LOCATION_DATA_SYNC_TAG) {
        event.waitUntil(syncLocationData());
    }
});

// Message event - handle communication with main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'QUEUE_PHOTO_UPLOAD':
            queuePhotoUpload(data);
            break;
        case 'GET_OFFLINE_STATUS':
            event.ports[0].postMessage({ 
                isOffline: !navigator.onLine,
                queuedUploads: getQueuedUploadsCount()
            });
            break;
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
        default:
            console.log('📱 Unknown message type:', type);
    }
});

// Helper functions

function isStaticResource(request) {
    const url = new URL(request.url);
    return STATIC_FILES.some(file => url.pathname.endsWith(file.replace(/^\//, ''))) ||
           url.pathname.includes('/css/') ||
           url.pathname.includes('/js/modules/') ||
           url.pathname.includes('/js/utils/');
}

function isPhotoRequest(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/photos/') || 
           url.pathname.includes('/uploads/') ||
           request.destination === 'image';
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

function isPhotoUpload(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/api/photos/upload');
}

async function handleStaticResource(request) {
    try {
        // Cache first strategy for static resources
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Fetch and cache
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
        
    } catch (error) {
        console.error('❌ Static resource error:', error);
        return new Response('Offline - Resource not available', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

async function handlePhotoRequest(request) {
    try {
        // Network first for photos, fallback to cache
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(PHOTO_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        // Try cache if network fails
        const cache = await caches.open(PHOTO_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📸 Serving photo from cache:', request.url);
            return cachedResponse;
        }
        
        return new Response('Photo not available offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

async function handleAPIRequest(request) {
    try {
        // Network only for API requests
        return await fetch(request);
        
    } catch (error) {
        console.error('🌐 API request failed:', error);
        
        // Return offline response for certain endpoints
        if (request.url.includes('/api/locations')) {
            return getOfflineLocations();
        } else if (request.url.includes('/api/photos')) {
            return getOfflinePhotos();
        }
        
        return new Response(JSON.stringify({
            error: 'Offline - API not available',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleGenericRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

async function handlePhotoUpload(request) {
    try {
        // Try network upload first
        const response = await fetch(request);
        
        if (response.ok) {
            return response;
        } else {
            throw new Error('Upload failed');
        }
        
    } catch (error) {
        console.log('📱 Queueing photo upload for background sync');
        
        // Queue for background sync
        const formData = await request.formData();
        await queuePhotoUpload({
            url: request.url,
            method: request.method,
            body: formData,
            headers: Object.fromEntries(request.headers.entries()),
            timestamp: Date.now()
        });
        
        // Register background sync
        await self.registration.sync.register(PHOTO_UPLOAD_SYNC_TAG);
        
        return new Response(JSON.stringify({
            success: true,
            queued: true,
            message: 'Photo queued for upload when online'
        }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function queuePhotoUpload(uploadData) {
    try {
        const db = await openDB();
        const tx = db.transaction(['uploads'], 'readwrite');
        const store = tx.objectStore('uploads');
        
        await store.add({
            ...uploadData,
            id: Date.now(),
            status: 'queued'
        });
        
        console.log('📱 Photo upload queued:', uploadData.url);
        
    } catch (error) {
        console.error('❌ Error queueing upload:', error);
    }
}

async function uploadQueuedPhotos() {
    try {
        const db = await openDB();
        const tx = db.transaction(['uploads'], 'readwrite');
        const store = tx.objectStore('uploads');
        const queuedUploads = await store.getAll();
        
        console.log(`📱 Processing ${queuedUploads.length} queued uploads`);
        
        for (const upload of queuedUploads) {
            try {
                const formData = new FormData();
                
                // Reconstruct FormData from stored data
                if (upload.body instanceof FormData) {
                    for (const [key, value] of upload.body.entries()) {
                        formData.append(key, value);
                    }
                }
                
                const response = await fetch(upload.url, {
                    method: upload.method,
                    body: formData,
                    headers: {
                        ...upload.headers,
                        // Remove Content-Type to let browser set it with boundary
                        'Content-Type': undefined
                    }
                });
                
                if (response.ok) {
                    // Upload successful - remove from queue
                    await store.delete(upload.id);
                    console.log('✅ Uploaded queued photo:', upload.id);
                    
                    // Notify clients
                    notifyClients({
                        type: 'UPLOAD_COMPLETED',
                        uploadId: upload.id,
                        success: true
                    });
                } else {
                    console.error('❌ Upload failed:', response.status);
                }
                
            } catch (error) {
                console.error('❌ Error uploading queued photo:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error processing upload queue:', error);
    }
}

async function syncLocationData() {
    // Placeholder for location data sync
    console.log('🗺️ Syncing location data...');
}

async function getOfflineLocations() {
    // Return cached locations data
    return new Response(JSON.stringify({
        locations: [],
        offline: true,
        message: 'Offline locations data'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function getOfflinePhotos() {
    // Return cached photos data
    return new Response(JSON.stringify({
        photos: [],
        offline: true,
        message: 'Offline photos data'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

function getQueuedUploadsCount() {
    // Placeholder - would need to query IndexedDB
    return 0;
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

function notifyClients(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}

// IndexedDB helper for upload queue
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MobileAppDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create uploads object store
            if (!db.objectStoreNames.contains('uploads')) {
                const uploadsStore = db.createObjectStore('uploads', { keyPath: 'id' });
                uploadsStore.createIndex('status', 'status', { unique: false });
                uploadsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            // Create locations object store for offline data
            if (!db.objectStoreNames.contains('locations')) {
                const locationsStore = db.createObjectStore('locations', { keyPath: 'id' });
                locationsStore.createIndex('lastModified', 'lastModified', { unique: false });
            }
        };
    });
}

console.log('📱 Mobile App Service Worker loaded - Phase 4A ready');
