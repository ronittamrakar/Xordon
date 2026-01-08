# Enable Developer Mode

To access all pages including the `/operations/*` and `/finance/*` routes, you need to enable **Developer Mode**.

## How to Enable Developer Mode:

1. **Open your browser's Developer Console** (F12 or Right-click → Inspect)

2. **Run this command in the Console**:
   ```javascript
   localStorage.setItem('xordon_developer_mode', 'true');
   ```

3. **Refresh the page** (F5 or Ctrl+R)

4. **All pages should now be accessible!**

## How to Disable Developer Mode:

Run this command in the console:
```javascript
localStorage.removeItem('xordon_developer_mode');
```

Then refresh the page.

## Alternative: Enable via Settings UI

If there's a settings page in your app, look for a "Developer Mode" toggle in the account settings.

---

**Note**: Developer mode bypasses all module restrictions and is intended for development purposes only.
