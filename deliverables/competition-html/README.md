# AdaptLearn Competition HTML Pack

This folder is a static, judge-ready demo package. It contains mock/prototype data only and no real Supabase, OpenAI, Redis, LMS, database, or service-role secrets.

## Recommended entry

Open or deploy:

- index.html

The entry page links to the three requested product demos:

- student.html
- admin.html
- foundation-console.html

## Local/offline judging

Unzip the package and double-click index.html. Every demo is a standalone HTML file with embedded CSS and JavaScript, so no npm install, backend server, Supabase project, Redis, LMS, or OpenAI key is required.

## Online URL submission

Upload the entire competition-html folder to a static host such as Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any object-storage static website host.

Use index.html as the public entry URL. Relative links are used, so the package works from the site root or a subfolder.

## Safety boundary

The Student Web page does not expose internal rule weights, teacher review records, ReviewCase details, other student data, precise rankings, service keys, queue credentials, LMS secrets, or raw RAG chunks.
