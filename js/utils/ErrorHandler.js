export class ErrorHandler {
    static classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (this.isAuthError(message)) return 'AUTH_ERROR';
        if (this.isMapsError(message)) return 'MAPS_ERROR';
        if (this.isModuleError(message)) return 'MODULE_ERROR';
        
        return 'GENERIC_ERROR';
    }
    
    static isAuthError(message) {
        const authKeywords = ['token', 'session', 'unauthorized', '401', 'currentuser'];
        return authKeywords.some(keyword => message.includes(keyword));
    }
    
    static isMapsError(message) {
        const mapsKeywords = ['google maps', 'maps api', 'mapservice'];
        return mapsKeywords.some(keyword => message.includes(keyword));
    }
    
    static isModuleError(message) {
        return message.includes('module') || message.includes('import');
    }
}