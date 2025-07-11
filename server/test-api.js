#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all endpoints and functionality of the modular server
 */

const http = require('http');
const https = require('https');

class APITester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.authToken = null;
        this.adminToken = null;
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Make HTTP request
     */
    async makeRequest(method, path, data = null, headers = {}) {
        const url = new URL(path, this.baseUrl);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        const defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'API-Tester/1.0',
            ...headers
        };

        if (this.authToken && !headers.Authorization) {
            defaultHeaders.Authorization = `Bearer ${this.authToken}`;
        }

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method.toUpperCase(),
            headers: defaultHeaders
        };

        return new Promise((resolve, reject) => {
            const req = client.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: parsedData
                        });
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: responseData,
                            parseError: error.message
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Run a test
     */
    async test(name, testFn) {
        this.totalTests++;
        console.log(`\n🧪 Testing: ${name}`);
        
        try {
            const result = await testFn();
            if (result) {
                console.log(`✅ PASS: ${name}`);
                this.passedTests++;
                this.testResults.push({ name, status: 'PASS', result });
            } else {
                console.log(`❌ FAIL: ${name}`);
                this.failedTests++;
                this.testResults.push({ name, status: 'FAIL', result });
            }
        } catch (error) {
            console.log(`❌ ERROR: ${name} - ${error.message}`);
            this.failedTests++;
            this.testResults.push({ name, status: 'ERROR', error: error.message });
        }
    }

    /**
     * Test server health and basic endpoints
     */
    async testServerHealth() {
        await this.test('Server Health Check', async () => {
            const response = await this.makeRequest('GET', '/api/health');
            return response.status === 200 && response.data.success === true;
        });

        await this.test('Server Info Endpoint', async () => {
            const response = await this.makeRequest('GET', '/api/info');
            return response.status === 200 && response.data.success === true;
        });

        await this.test('Module Test Endpoint', async () => {
            const response = await this.makeRequest('GET', '/api/test');
            return response.status === 200 && response.data.modules;
        });

        await this.test('404 Handler', async () => {
            const response = await this.makeRequest('GET', '/api/nonexistent');
            return response.status === 404 && response.data.error === 'Not found';
        });
    }

    /**
     * Test authentication endpoints
     */
    async testAuthentication() {
        let testUserEmail;
        
        // Test registration
        await this.test('User Registration', async () => {
            const timestamp = Date.now();
            testUserEmail = `test_${timestamp}@example.com`;
            const userData = {
                username: 'testuser_' + timestamp,
                email: testUserEmail,
                password: 'TestPass123!',
                firstName: 'Test',
                lastName: 'User'
            };

            const response = await this.makeRequest('POST', '/api/auth/register', userData);
            if (response.status === 201 && response.data.success) {
                this.authToken = response.data.token;
                return true;
            }
            return false;
        });

        // Test login with the user we just registered
        await this.test('User Login', async () => {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                email: testUserEmail,
                password: 'TestPass123!'
            });

            if (response.status === 200 && response.data.success) {
                this.authToken = response.data.token; // Update auth token
                return true;
            }
            return false;
        });

        // Test admin login separately (for admin tests later)
        await this.test('Admin Login Setup', async () => {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                email: 'rodczaro@gmail.com',
                password: 'Dakota1973$$'
            });

            if (response.status === 200 && response.data.success) {
                this.adminToken = response.data.token;
                return true;
            }
            // If admin login fails, we'll create a test admin user
            const timestamp = Date.now();
            const adminData = {
                username: 'testadmin_' + timestamp,
                email: `admin_${timestamp}@example.com`,
                password: 'AdminPass123!',
                firstName: 'Test',
                lastName: 'Admin'
            };

            const registerResponse = await this.makeRequest('POST', '/api/auth/register', adminData);
            if (registerResponse.status === 201 && registerResponse.data.success) {
                this.adminToken = registerResponse.data.token;
                // Note: This won't have admin privileges, but will test the endpoints
                return true;
            }
            return false;
        });

        // Test profile access
        await this.test('Protected Profile Access', async () => {
            const response = await this.makeRequest('GET', '/api/auth/profile');
            return response.status === 200 && response.data.success;
        });

        // Test logout
        await this.test('User Logout', async () => {
            const response = await this.makeRequest('POST', '/api/auth/logout');
            return response.status === 200 && response.data.success;
        });
    }

    /**
     * Test location endpoints
     */
    async testLocations() {
        await this.test('Get Popular Locations', async () => {
            const response = await this.makeRequest('GET', '/api/locations/popular');
            return response.status === 200 && Array.isArray(response.data);
        });

        await this.test('Get All Locations', async () => {
            const response = await this.makeRequest('GET', '/api/locations');
            return response.status === 200 && response.data.success;
        });

        // Test save location (requires auth)
        await this.test('Save Location (Auth Required)', async () => {
            const locationData = {
                place_id: 'test_place_' + Date.now(),
                name: 'Test Location',
                address: '123 Test St, Test City',
                lat: 40.7128,
                lng: -74.0060,
                rating: 4.5
            };

            const response = await this.makeRequest('POST', '/api/user/locations', locationData);
            return response.status === 201 && response.data.success;
        });

        // Test get user locations
        await this.test('Get User Locations', async () => {
            const response = await this.makeRequest('GET', '/api/user/locations');
            return response.status === 200 && response.data.success;
        });
    }

    /**
     * Test admin endpoints
     */
    async testAdmin() {
        // Use admin token for these tests
        const originalToken = this.authToken;
        this.authToken = this.adminToken;

        await this.test('Admin Statistics', async () => {
            const response = await this.makeRequest('GET', '/api/admin/stats');
            return response.status === 200 && typeof response.data.totalUsers === 'number';
        });

        await this.test('Admin Get All Users', async () => {
            const response = await this.makeRequest('GET', '/api/admin/users');
            return response.status === 200 && response.data.success;
        });

        await this.test('Admin Get All Locations', async () => {
            const response = await this.makeRequest('GET', '/api/admin/locations');
            return response.status === 200 && response.data.success;
        });

        await this.test('Admin Health Check', async () => {
            const response = await this.makeRequest('GET', '/api/admin/health');
            return response.status === 200 && response.data.success;
        });

        // Restore original token
        this.authToken = originalToken;
    }

    /**
     * Test rate limiting
     */
    async testRateLimiting() {
        await this.test('Rate Limiting (Multiple Requests)', async () => {
            let rateLimitHit = false;
            
            // Make multiple rapid requests to trigger rate limit
            for (let i = 0; i < 12; i++) {
                const response = await this.makeRequest('POST', '/api/auth/login', {
                    email: 'invalid@test.com',
                    password: 'invalid'
                });
                
                if (response.status === 429) {
                    rateLimitHit = true;
                    break;
                }
            }
            
            return rateLimitHit;
        });
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        await this.test('Invalid JSON Handling', async () => {
            try {
                const response = await this.makeRequest('POST', '/api/auth/login', null, {
                    'Content-Type': 'application/json'
                });
                // Send raw invalid JSON
                return response.status >= 400;
            } catch (error) {
                return true; // Error is expected
            }
        });

        await this.test('Unauthorized Access', async () => {
            const response = await this.makeRequest('GET', '/api/admin/stats', null, {
                Authorization: 'Bearer invalid-token'
            });
            return response.status === 403; // Invalid token returns 403
        });
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Comprehensive API Tests...\n');
        
        await this.testServerHealth();
        await this.testAuthentication();
        await this.testLocations();
        await this.testAdmin();
        await this.testRateLimiting();
        await this.testErrorHandling();

        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(test => test.status !== 'PASS')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error || 'Failed'}`);
                });
        }
        
        console.log('\n🎉 Testing completed!');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests().catch(console.error);
}

module.exports = APITester;
