# AUTH REFACTOR PLAN
## 🗂️ Overview
The goal of this refactor is to improve the maintainability and performance of the Auth module.

Check camelCase for all functions and parameters, ensure they are consistent with the rest of the codebase.

## 🔍 Current Issues
- **AuthUI.js**: 1,601 lines (WAY over 400-500 limit)
- **AuthHandlers.js**: 568 lines (over 400-500 limit)  
- **AuthService.js**: 390 lines (within acceptable range)

Reduce file size to 400 lines of code per file, up to 500 is acceptable if the file is working well.

## 📋 Refactoring Strategy

### Split AuthUI.js into specialized services:
1. **AuthUICore.js** - Basic UI updates, navigation buttons, core functionality
2. **AuthModalService.js** - Auth modals (login, register, profile, forgot password)
3. **AuthAdminService.js** - Admin panel, user management, location management
4. **AuthNotificationService.js** - Notifications, error handling, banners

### Split AuthHandlers.js into:
1. **AuthFormHandlers.js** - Form submission and validation handlers
2. **AuthEventHandlers.js** - Navigation, button clicks, dropdown handlers

### Keep AuthService.js as-is (390 lines - acceptable)

## 🧪 Testing Requirements
- Test as updates are made to ensure no functionality is broken
- Use login credentials: email: rodczaro@gmail.com, password: Dakota1973$$
- Eliminate redundant code and improve readability
- Keep function and parameter names consistent with existing codebase
- Reuse existing functions rather than writing new ones

## 📁 File Organization
When finished with refactor, place any unused files in a folder named "unused" in the Auth module. 