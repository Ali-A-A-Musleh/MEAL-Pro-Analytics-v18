# تعليمات رفع التطبيق إلى cPanel

بما أن هذا التطبيق مبني باستخدام **React + Vite**، كـ "تطبيق صفحة واحدة" (Single Page Application - SPA)، فإنه يتطلب بعض الإعدادات الخاصة عند رفعه إلى سيرفر يعتمد على Apache (مثل أغلب سيرفرات cPanel).

## الخطوات الأساسية للرفع:

1. **بناء المشروع (Building):**
   - قم بتشغيل الأمر التالي في جهازك المحلي (بعد تحميل الملفات من AI Studio):
     ```bash
     npm run build
     ```
   - سينتج عن هذا الأمر مجلد يسمى `dist`. هذا المجلد يحتوي على جميع الملفات التي تحتاج لرفعها.

2. **الرفع إلى cPanel:**
   - ادخل إلى **File Manager** في لوحة تحكم cPanel.
   - اذهب إلى المجلد الرئيسي لموقعك (عادة ما يكون `public_html`).
   - قم برفع محتويات مجلد `dist` بالكامل إلى داخل `public_html`.

3. **إعداد توجيه الروابط (Routing):**
   - لقد قمت بالفعل بإضافة ملف يسمى `.htaccess` داخل مجلد `public` في المشروع.
   - عند إجراء عملية البناء (Build)، سينتقل هذا الملف تلقائياً إلى مجلد `dist`.
   - هذا الملف يضمن أن جميع الروابط تعمل بشكل صحيح ولا يظهر خطأ 404 عند تحديث الصفحة أو الدخول لروابط فرعية.

## محتوى ملف .htaccess المرفق:
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

## ملاحظات هامة:
- تأكد من تعيين نسخة **Node.js** مناسبة (مثل الإصدار 18 أو أحدث) إذا كنت تقوم بعملية البناء (Build) مباشرة على السيرفر عبر Terminal الخاص بـ cPanel.
- إذا كنت ترفع الموقع في مجلد فرعي (مثلاً: `yourdomain.com/analytics/`) بدلاً من الموقع الرئيسي، ستحتاج لتعديل قيمة `base` في ملف `vite.config.js` لتكون `base: '/analytics/'`.
