// Environment detection for automatic debug configuration
const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('dev');

// Debug configuration - automatically enabled in development environments
export const DEBUG = true; //!isProduction;

// Make DEBUG available globally for legacy scripts
window.DEBUG = DEBUG;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {string} file - Module identifier
 * @param {...any} args - Arguments to log
 */
export function debug(file, ...args) {
    if (!DEBUG) return;
    
    // Check for log type
    let logType = 'log';
    let logArgs = [...args]; // Clone args
    
    if (args.length > 0 && typeof args[args.length - 1] === 'string') {
        const possibleType = args[args.length - 1];
        if (['log', 'warn', 'error', 'info', 'trace'].includes(possibleType)) {
            logType = possibleType;
            logArgs.pop(); // Remove the type
        }
    }

    // Get source location information from stack trace
    let sourceInfo = '';
    try {
        const stackLine = new Error().stack.split('\n')[2] || '';
        const match = stackLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) || 
                     stackLine.match(/at\s+()(.*):(\d+):(\d+)/);
        
        if (match && match.length >= 4) {
            const fileName = match[2].split('/').pop();
            const lineNumber = match[3];
            //sourceInfo = `${fileName}:${lineNumber}`;
            sourceInfo = `:${lineNumber}`;
        }
    } catch (e) {
        // Ignore errors in stack parsing
    }

    // Format prefix with source information
    const prefix = sourceInfo ? 
        `[${file} ${sourceInfo}]` : 
        `[${file}]`;

    // Format the first argument if it's a string
    if (logArgs.length > 0 && typeof logArgs[0] === 'string') {
        logArgs[0] = `${prefix} ${logArgs[0]}`;
    } else {
        logArgs.unshift(prefix);
    }
    
    // Special handling for trace type
    if (logType === 'trace') {
        console.log(...logArgs);
        console.trace(); // Show the full stack trace
        return;
    }
    
    // Use console directly to preserve call site
    switch(logType) {
        case 'warn':
            console.warn(...logArgs);
            break;
        case 'error':
            console.error(...logArgs);
            break;
        case 'info':
            console.info(...logArgs);
            break;
        default:
            console.log(...logArgs);
    }
}

// Register debugger with ScriptInitManager when it's available
// Uses a technique to wait for ScriptInitManager without creating circular dependencies
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.ScriptInitManager) {
            window.ScriptInitManager.register('Debugger', { debug, DEBUG });
        }
    }, 100);
});