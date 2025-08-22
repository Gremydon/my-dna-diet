warning: in the working copy of 'script.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/script.js b/script.js[m
[1mindex 9f3b67d..b5d61ad 100644[m
[1m--- a/script.js[m
[1m+++ b/script.js[m
[36m@@ -417,7 +417,9 @@[m [mfunction cleanOCRText(text) {[m
     // Normalize whitespace[m
     .replace(/\s+/g, ' ')[m
     // Remove common OCR artifacts and unwanted characters (less aggressive)[m
[31m-    .replace(/[^\w\s,.-()&]/g, '')[m
[32m+[m[32m    .replace(/[^\w\s.,()&\-]/g, '')[m
[32m+[m
[32m+[m
     // Remove single characters that are likely OCR errors[m
     .replace(/\b[a-z]\b/g, '')[m
     // Remove multiple commas[m
[33m964a013[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m  COMPREHENSIVE UPDATE: Restore Full Multi-Format File Upload Support with Profile Integration
[33m8e02475[m  REPLACE: Simplified upload handling with new intolerance-upload system
