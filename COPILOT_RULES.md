# COPILOT DEVELOPMENT RULES & SAFETY GUIDELINES

## 🚨 CRITICAL RULES - FOLLOW ALWAYS

### 1. **NEVER MODIFY WORKING CODE WITHOUT EXPLICIT PERMISSION**
- If code is working, ask before changing it
- Always check if a feature/style already exists before adding new code
- Use `grep_search` and `read_file` to understand existing implementation BEFORE making changes

### 2. **CSS/HTML SAFETY PROTOCOL**
- **BEFORE** modifying any CSS: Use `grep_search` to find existing styles for the same elements
- **NEVER** add duplicate CSS rules - check if styles already exist
- **NEVER** override working styles without backing them up
- When adding new CSS, use specific selectors to avoid conflicts
- Test responsiveness impact of any CSS changes

### 3. **JAVASCRIPT SAFETY PROTOCOL**
- **BEFORE** modifying JS: Use `semantic_search` to understand the module structure
- **NEVER** change function signatures that are used elsewhere
- **NEVER** modify event handlers without checking all usages with `list_code_usages`
- Always check for existing functionality before implementing new features

### 4. **MANDATORY PRE-CHANGE CHECKS**
Before ANY code modification, run these checks:
```bash
# 1. Check if similar functionality exists
semantic_search "query related to the feature"

# 2. Find existing styles/functions
grep_search "selector or function name"

# 3. Check dependencies
list_code_usages "function or class name"

# 4. Read the current implementation
read_file path/to/file startLine endLine
```

### 5. **BACKUP & TESTING PROTOCOL**
- Always create git commits before major changes
- Test each change incrementally
- If a change breaks something, immediately revert and try a different approach
- Use `get_errors` after each file modification

## 🛡️ SPECIFIC PROTECTION AREAS

### CSS Protection Rules
- **Modal Systems**: Check existing modal CSS before adding new modal styles
- **Responsive Design**: Test CSS changes don't break mobile layout
- **Animations**: Don't modify working animations unless broken
- **Grid/Flexbox**: Preserve existing layout systems

### JavaScript Protection Rules
- **Authentication System**: Never modify auth flow without full understanding
- **State Management**: Don't change StateManager without checking all dependencies
- **Event Handlers**: Preserve existing event listener patterns
- **API Calls**: Don't modify working API endpoints or request formats

### Database Protection Rules
- **Schema Changes**: Always backup database before schema modifications
- **Existing Data**: Preserve existing data during migrations
- **Foreign Keys**: Don't break existing relationships

## 📋 CHANGE REQUEST PROTOCOL

### When User Requests Changes:
1. **Analyze Request**: What exactly needs to be changed?
2. **Check Existing Code**: Does this functionality already exist?
3. **Impact Assessment**: What other code might be affected?
4. **Propose Approach**: Explain how you'll make the change safely
5. **Get Approval**: Ask user to confirm approach before proceeding

### Before Any Modification:
```
🔍 SAFETY CHECK:
- [ ] Searched for existing implementation
- [ ] Checked for CSS/JS conflicts  
- [ ] Identified all dependencies
- [ ] Planned minimal-impact approach
- [ ] Ready to create backup commit
```

## 🚨 EMERGENCY PROCEDURES

### If You Break Something:
1. **STOP** making additional changes
2. Use `git status` to see what was modified
3. Use `git restore <file>` to revert problematic changes
4. Analyze what went wrong
5. Try a different, more conservative approach

### If User Reports Broken Functionality:
1. **Immediately** check `git log --oneline -10` to see recent changes
2. Use `get_errors` to identify specific issues
3. Offer to revert recent changes: `git reset --hard HEAD~1`
4. Fix incrementally with smaller, tested changes

## 📖 USAGE INSTRUCTIONS

### For User:
Copy and paste this at the start of any Copilot conversation:
```
⚠️ IMPORTANT: Before making ANY changes, follow the rules in COPILOT_RULES.md:
1. Check existing code first
2. Ask permission before modifying working features
3. Test changes incrementally
4. Create git commits before major changes
```

### For Copilot:
- Reference this file in every session
- Follow the safety protocols religiously
- When in doubt, ask the user
- Prefer small, incremental changes over large rewrites

## 🎯 CURRENT PROJECT CONTEXT

### Working Features (DO NOT BREAK):
- User authentication system
- Google Maps integration
- Location saving functionality
- Admin panel system
- Database viewer
- Responsive CSS layout
- Modal systems (profile, save-location, admin)

### Known Fragile Areas:
- CSS modal styling (frequently broken by changes)
- Authentication event handlers
- Database schema migrations
- Mobile responsive design

### Preferred Patterns:
- Modular JavaScript architecture
- CSS BEM naming conventions
- RESTful API endpoints
- SQLite database operations

---
**Remember: It's better to ask twice and get it right than to break working code!**
