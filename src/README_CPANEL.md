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
   - Navigate to your website root folder (usually `public_html`).
   - Upload the entire contents of the `dist` folder into `public_html`.

3. **Routing setup:**
   - A `.htaccess` file has already been added into the project's `public` folder.
   - When you build the project, this file is automatically copied into the `dist` folder.
   - This file ensures all routes work correctly and prevents 404 errors when refreshing the page or navigating to subpaths.

## Included `.htaccess` content:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

## Important Notes:
- Make sure your **Node.js** version is appropriate (for example, version 18 or newer) if you are building directly on the server using the cPanel Terminal.
- If you are deploying the site to a subfolder (for example: `yourdomain.com/analytics/`) instead of the root domain, you will need to update the `base` value in `vite.config.js` to `base: '/analytics/'`.
