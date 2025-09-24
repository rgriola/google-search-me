8-28-2025 as of. 

Script Loading Order in app.html:

First: auth-immediate-check.js (in head)
Second: cache-init.js (module)
Third: app-page.js (module)
Fourth: initMap.js (module)
                initMap.js loads → main.js (dynamically imported)
                main.js exports → initializeAllModules function
                initMap.js calls → initializeAllModules() to bootstrap your app

Fifth: test-layout-control-buttons.js
Sixth: LayoutController.js (module)
Seventh: layout-integration-bridge.js
Eighth: Google Maps API (async defer)