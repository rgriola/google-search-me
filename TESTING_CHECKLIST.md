# POST-CHANGE TESTING CHECKLIST

## 🧪 After ANY Code Change, Test These:

### Frontend Tests (Open app.html in browser):
- [ ] Page loads without console errors
- [ ] User can log in/logout
- [ ] Google Maps displays correctly
- [ ] User dropdown works
- [ ] Profile modal opens/closes
- [ ] Location saving works
- [ ] Admin panel opens (if admin user)
- [ ] All buttons/links are clickable
- [ ] Responsive design works on mobile view

### Backend Tests (if server changes):
- [ ] Server starts without errors: `node server.js`
- [ ] API endpoints respond: `curl http://localhost:3000/api/health`
- [ ] Database operations work
- [ ] Authentication endpoints work

### CSS-Specific Tests:
- [ ] No overlapping elements
- [ ] All modals center properly
- [ ] Buttons have hover effects
- [ ] Text is readable (contrast)
- [ ] Mobile layout doesn't break
- [ ] Animations work smoothly

### JavaScript-Specific Tests:
- [ ] No console errors
- [ ] Event handlers work
- [ ] State management works
- [ ] API calls succeed
- [ ] Error handling works

## 🚨 If ANY Test Fails:
1. **STOP** making more changes
2. Revert: `git restore <file>` or `git reset --hard HEAD~1`
3. Analyze what broke
4. Make smaller, incremental changes
5. Re-test after each small change

## 🎯 Browser Dev Tools Checks:
- **Console**: No red errors
- **Network**: API calls return 200s
- **Elements**: CSS applies correctly
- **Sources**: No 404s for JS/CSS files
