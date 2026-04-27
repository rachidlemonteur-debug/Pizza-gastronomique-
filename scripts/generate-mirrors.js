import fs from 'fs';
import path from 'path';

const domain = 'https://www.lagastronomiepizza.com';

const pages = [
  { path: '', title: 'Accueil - La Gastronomie Pizza', file: 'index.md' },
  { path: 'menu', title: 'Notre Menu', file: 'menu.md' },
  { path: 'restaurants', title: 'Nos Restaurants', file: 'restaurants.md' },
  { path: 'app-fidelite', title: 'Programme de Fidélité', file: 'app-fidelite.md' },
  { path: 'a-propos', title: 'À Propos de Nous', file: 'a-propos.md' },
  { path: 'contact', title: 'Nous Contacter', file: 'contact.md' },
  { path: 'faq', title: 'Foire Aux Questions', file: 'faq.md' },
  { path: 'recrutement', title: 'Recrutement', file: 'recrutement.md' },
  { path: 'politique-de-confidentialite', title: 'Politique de Confidentialité', file: 'politique-de-confidentialite.md' },
  { path: 'conditions-utilisation', title: "Conditions d'Utilisation", file: 'conditions-utilisation.md' },
  { path: 'politique-cookies', title: 'Politique des Cookies', file: 'politique-cookies.md' },
  { path: 'politique-livraison', title: 'Politique de Livraison', file: 'politique-livraison.md' },
];

const publicDir = path.join(process.cwd(), 'public');
const dateStr = new Date().toISOString().split('T')[0];

console.log('Génération des mirrors Markdown...');

let llmsContent = `# La Gastronomie Pizza - Markdown Mirrors\n\n`;
llmsContent += `Ce fichier liste les versions Markdown de chaque page du site, optimisées pour la lecture par les modèles de langage.\n\n`;

let generatedCount = 0;

pages.forEach(page => {
  const fileUrl = page.path === '' ? `${domain}/index.md` : `${domain}/${page.file}`;
  const absoluteUrl = page.path === '' ? `${domain}/` : `${domain}/${page.path}`;
  
  const mdContent = `---
title: "${page.title}"
url: "${absoluteUrl}"
last_updated: "${dateStr}"
---

# ${page.title}

Vous lisez la version texte brut (Markdown) de la page : ${absoluteUrl}
Cette version est optimisée pour les assistants IA.

(Le contenu complet textuel devrait être inséré ici. Ceci est un squelette généré par le script de création des mirrors.)
`;

  fs.writeFileSync(path.join(publicDir, page.file), mdContent);
  generatedCount++;
  
  llmsContent += `- [${page.title}](${fileUrl})\n`;
});

// Generate llms.txt
fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsContent);
console.log(`✅ Succès ! ${generatedCount} fichiers .md générés.`);
console.log(`✅ Fichier llms.txt généré avec la liste complète.`);
