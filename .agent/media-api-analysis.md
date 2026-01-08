# Media File Operations API Analysis

## Summary
The media library has **incomplete backend routing**. Several API endpoints that the frontend calls are missing from `backend/public/index.php`, even though the controller methods exist in `FilesController.php`.

---

## ✅ Existing Routes (Working)

### In `backend/public/index.php` (lines 2201-2211):

```php
// ==================== MEDIA LIBRARY ====================
if ($path === '/storage/quota' && $method === 'GET') return FilesController::getStorageQuota();
if ($path === '/files' && $method === 'GET') return FilesController::index();
if ($path === '/files/upload' && $method === 'POST') return FilesController::upload();
if ($path === '/files/folders' && $method === 'GET') return FilesController::folders();
if (preg_match('#^/files/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return FilesController::show($id);
    if ($method === 'PUT' || $method === 'PATCH') return FilesController::update($id);
    if ($method === 'DELETE') return FilesController::delete($id);
}
```

**These work:**
- ✅ `GET /storage/quota` → `FilesController::getStorageQuota()`
- ✅ `GET /files` → `FilesController::index()` (list files)
- ✅ `POST /files/upload` → `FilesController::upload()`
- ✅ `GET /files/folders` → `FilesController::folders()`
- ✅ `GET /files/{id}` → `FilesController::show($id)`
- ✅ `PUT /files/{id}` → `FilesController::update($id)`
- ✅ `DELETE /files/{id}` → `FilesController::delete($id)` (soft delete single file)

---

## ❌ Missing Routes (Broken)

### Frontend calls these endpoints (from `src/lib/api.ts`):

1. **`POST /files/move`** (line 2013)
   - Frontend: `moveMediaFiles(ids, folderId, type)`
   - Backend method exists: `FilesController::move()`
   - **Route missing!**

2. **`DELETE /files/folders/{id}`** (line 2017)
   - Frontend: `deleteMediaFolder(id)`
   - Backend method exists: `FilesController::deleteFolder($id)`
   - **Route missing!**

3. **`POST /files/bulk-delete`** (line 2021)
   - Frontend: `bulkDeleteMediaFiles(ids)`
   - Backend method exists: `FilesController::bulkDelete()`
   - **Route missing!**

4. **`POST /files/folders/{id}/rename`** (line 2029)
   - Frontend: `renameMediaFolder(id, name)`
   - Backend method exists: `FilesController::renameFolder($id)`
   - **Route missing!**

5. **`POST /files/{id}/star`** (line 2033)
   - Frontend: `toggleMediaFileStar(id)`
   - Backend method exists: `FilesController::toggleStar($id)`
   - **Route missing!**

6. **`GET /files/{id}/activity`** (line 2037)
   - Frontend: `getFileActivity(id)`
   - Backend method exists: `FilesController::getActivity($id)`
   - **Route missing!**

---

## 📋 Additional Missing Routes

### From `FilesController.php` (not yet called by frontend):

7. **`POST /files/folders`** - Create folder
   - Backend method exists: `FilesController::createFolder()`
   - Frontend calls: `createMediaFolder(name, parentId)` → `POST /files/folders`
   - **Route missing!**

8. **`PUT /files/{id}/rename`** - Rename file
   - Backend method exists: `FilesController::renameFile($id)`
   - Frontend uses: `renameMediaFile(id, name)` → `PUT /files/{id}` with `original_filename`
   - **Works via update route** (uses generic update endpoint)

9. **`POST /files/{id}/attach`** - Attach file to entity
   - Backend method exists: `FilesController::attach($id)`
   - **Route missing!**

10. **`GET /files/entity/{entityType}/{entityId}`** - Get files for entity
    - Backend method exists: `FilesController::forEntity($entityType, $entityId)`
    - **Route missing!**

---

## 🔧 Required Fixes

Add these routes to `backend/public/index.php` after line 2211:

```php
// Additional file operations
if ($path === '/files/move' && $method === 'POST') return FilesController::move();
if ($path === '/files/bulk-delete' && $method === 'POST') return FilesController::bulkDelete();
if ($path === '/files/folders' && $method === 'POST') return FilesController::createFolder();

// File-specific operations
if (preg_match('#^/files/(\d+)/star$#', $path, $m) && $method === 'POST') {
    return FilesController::toggleStar((int)$m[1]);
}
if (preg_match('#^/files/(\d+)/activity$#', $path, $m) && $method === 'GET') {
    return FilesController::getActivity((int)$m[1]);
}
if (preg_match('#^/files/(\d+)/attach$#', $path, $m) && $method === 'POST') {
    return FilesController::attach((int)$m[1]);
}

// Folder operations
if (preg_match('#^/files/folders/(\d+)/rename$#', $path, $m) && $method === 'POST') {
    return FilesController::renameFolder((int)$m[1]);
}
if (preg_match('#^/files/folders/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return FilesController::deleteFolder((int)$m[1]);
}

// Entity file attachments
if (preg_match('#^/files/entity/([^/]+)/(\d+)$#', $path, $m) && $method === 'GET') {
    return FilesController::forEntity($m[1], (int)$m[2]);
}
```

---

## 📊 Controller Methods Summary

### `FilesController.php` has these methods:

| Method | Purpose | Route Status |
|--------|---------|--------------|
| `index()` | List files with filters | ✅ Working |
| `show($id)` | Get single file | ✅ Working |
| `upload()` | Upload file(s) | ✅ Working |
| `update($id)` | Update file metadata | ✅ Working |
| `delete($id)` | Soft delete single file | ✅ Working |
| `folders()` | List folders | ✅ Working |
| `getStorageQuota()` | Get storage stats | ✅ Working |
| `move()` | Move files/folders | ❌ Missing route |
| `bulkDelete()` | Bulk delete files | ❌ Missing route |
| `createFolder()` | Create new folder | ❌ Missing route |
| `renameFolder($id)` | Rename folder | ❌ Missing route |
| `deleteFolder($id)` | Delete folder | ❌ Missing route |
| `renameFile($id)` | Rename file | ⚠️ Works via update |
| `toggleStar($id)` | Toggle star status | ❌ Missing route |
| `getActivity($id)` | Get file activity log | ❌ Missing route |
| `attach($id)` | Attach file to entity | ❌ Missing route |
| `forEntity($type, $id)` | Get files for entity | ❌ Missing route |

---

## 🎯 Impact

**Current State:**
- Basic file operations work (upload, list, view, delete single file)
- Advanced features are broken:
  - ❌ Cannot move files between folders
  - ❌ Cannot bulk delete files
  - ❌ Cannot create/rename/delete folders
  - ❌ Cannot star/favorite files
  - ❌ Cannot view file activity history
  - ❌ Cannot attach files to entities (contacts, deals, etc.)

**After Fix:**
- All media library features will be fully functional
- Users can organize files into folders
- Bulk operations will work
- File activity tracking will be visible
- Files can be attached to CRM entities
