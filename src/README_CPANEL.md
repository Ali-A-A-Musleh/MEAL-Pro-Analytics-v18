# cPanel Deployment Instructions

Since this application is built using **React + Vite** as a Single Page Application (SPA), it requires some special configuration when deploying to an Apache-based server (such as most cPanel hosts).

## Deployment Steps:

1. **Build the project:**
   - Run the following command on your local machine (after opening the files in VS Code):
     ```bash
     npm run build
     ```
   - This command produces a folder named `dist`. That folder contains all the files you need to upload.

2. **Upload to cPanel:**
   - Open **File Manager** in your cPanel dashboard.
   - Navigate to your target deployment folder: `public_html/tools/pro-analytics-studio/`
   - **Delete all old files** in the target folder first.
   - Upload the entire contents of the `dist` folder into the target folder.
   - **IMPORTANT:** Make sure you upload the NEW build files, not old ones. The CSS/JS filenames change with each build (they have hash suffixes like `index-XXXX.css`).

3. **Routing setup:**
   - A `.htaccess` file has already been added into the project's `public` folder.
   - When you build the project, this file is automatically copied into the `dist` folder.
   - This file ensures all routes work correctly and prevents 404 errors when refreshing the page or navigating to subpaths.
   - The `.htaccess` is pre-configured for the path `/tools/pro-analytics-studio/`.

## Included `.htaccess` routing rules:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /tools/pro-analytics-studio/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /tools/pro-analytics-studio/index.html [L]
</IfModule>
```

## Important Notes:
- Make sure your **Node.js** version is appropriate (for example, version 18 or newer) if you are building directly on the server using the cPanel Terminal.
- The `base` in `vite.config.js` is set to `'./'` (relative paths), which works correctly for subfolder deployments.
- **Always delete old files before uploading new ones** to avoid stale CSS/JS files causing style issues.

