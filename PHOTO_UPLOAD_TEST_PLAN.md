/**
 * Photo Upload Test Plan
 * Testing both save-location-form and edit-location-form photo upload functionality
 * 
 * This document outlines the test plan to ensure both forms handle photo uploads consistently.
 */

## Test Plan: Photo Upload Forms Consistency

### 🎯 Objective
Ensure both save-location-form and edit-location-form use the same photo upload logic without breaking each other.

### 🔧 System Components Being Tested

1. **LocationPhotoManager** (Instance Methods)
   - `handlePhotoFile(event, mode)`
   - `processPhotoFiles(files, mode)` 
   - `addPhotoPreview(src, file, mode)`
   - `uploadPendingPhotos(pendingPhotos, placeId)`

2. **Global Photo Arrays**
   - `window.pendingPhotos` (for save form)
   - `window.pendingEditPhotos` (for edit form)

3. **Event Delegation** (LocationEventManager)
   - File input change events
   - Drop zone click events
   - Form submission with photo upload

4. **Form Setup** (LocationFormManager)
   - Photo upload initialization
   - Drag and drop setup

### 📋 Test Cases

#### Test Case 1: Save Form Photo Upload
- **Setup**: Open save-location-dialog
- **Action**: Add photos via file input or drag/drop
- **Expected**: Photos appear in preview, added to `window.pendingPhotos`
- **Verification**: Form submission uploads photos to new location

#### Test Case 2: Edit Form Photo Upload  
- **Setup**: Open edit-location-dialog for existing location
- **Action**: Add photos via file input or drag/drop
- **Expected**: Photos appear in preview, added to `window.pendingEditPhotos`
- **Verification**: Form submission uploads photos to existing location

#### Test Case 3: Form Isolation
- **Setup**: Open both forms sequentially
- **Action**: Add photos to each form
- **Expected**: Photos in each form remain separate
- **Verification**: Save form uses `pendingPhotos`, edit form uses `pendingEditPhotos`

#### Test Case 4: Photo Array Cleanup
- **Setup**: Complete form submission with photos
- **Action**: Submit form successfully
- **Expected**: Respective pending array is cleared after upload
- **Verification**: No photo data leaks between forms

### 🚀 Implementation Details

#### Shared Photo Upload Logic
Both forms use the same underlying `LocationPhotoManager` methods:

```javascript
// Same for both 'save' and 'edit' modes
LocationPhotoManager.handlePhotoFile(event, mode)
LocationPhotoManager.addPhotoPreview(src, file, mode)
LocationPhotoManager.uploadPendingPhotos(photosArray, placeId)
```

#### Mode-Specific Differences
```javascript
// Save mode
mode = 'save'
photoArray = window.pendingPhotos
elementIds = 'save-photo-file-input', 'save-photo-drop-zone', 'save-photo-preview'

// Edit mode  
mode = 'edit'
photoArray = window.pendingEditPhotos
elementIds = 'edit-photo-file-input', 'edit-photo-drop-zone', 'edit-photo-preview'
```

### ✅ Success Criteria

1. ✅ Both forms can upload photos without conflicts
2. ✅ Photo previews work in both forms
3. ✅ Drag and drop works in both forms
4. ✅ Photo arrays remain separate between forms
5. ✅ Photo arrays are cleaned up after successful submission
6. ✅ ImageKit integration works for both forms
7. ✅ No JavaScript errors when switching between forms

### 🐛 Known Issues Fixed

1. **Parameter Order Bug**: Fixed `uploadPendingPhotos` parameter order
2. **Instance vs Static**: Ensured `LocationPhotoManager` is properly exposed as instance
3. **Array Initialization**: Added automatic initialization of pending photo arrays
4. **Form Setup**: Added photo upload setup to `LocationFormManager.setupFormEnhancements`
5. **Array Cleanup**: Added cleanup of pending arrays after successful upload

### 🧪 Test Files

- `test-photo-upload-forms.html` - Interactive test page
- Browser console logging for debugging
- Manual testing in both Chrome and Safari

### 📝 Test Results

To be filled after running tests...

#### Save Form Results:
- [ ] Photo file input works
- [ ] Drag and drop works  
- [ ] Photo preview appears
- [ ] Photos added to pendingPhotos array
- [ ] Form submission uploads photos
- [ ] Array cleaned up after upload

#### Edit Form Results:
- [ ] Photo file input works
- [ ] Drag and drop works
- [ ] Photo preview appears  
- [ ] Photos added to pendingEditPhotos array
- [ ] Form submission uploads photos
- [ ] Array cleaned up after upload

#### Consistency Results:
- [ ] Both forms use same photo manager methods
- [ ] No conflicts between forms
- [ ] No memory leaks or array pollution
- [ ] ImageKit integration works for both
