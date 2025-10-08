#!/bin/bash

echo "Testing direct API call to /api/database/config/imagekit-url"
curl -v http://localhost:3000/api/database/config/imagekit-url

echo -e "\n\nTesting API call with Accept header"
curl -v -H "Accept: application/json" http://localhost:3000/api/database/config/imagekit-url

echo -e "\n\nTesting API call with Content-Type header"
curl -v -H "Content-Type: application/json" http://localhost:3000/api/database/config/imagekit-url

echo -e "\n\nTesting API call with both headers"
curl -v -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3000/api/database/config/imagekit-url
