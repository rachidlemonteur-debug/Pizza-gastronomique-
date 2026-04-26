import React from 'react';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';

export function LegalPagesWrapper({ title, content, globalConfig }: { title: string, content: string, globalConfig?: any }) {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#DA291C] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au site
        </Link>
        <div className="bg-white rounded-[2rem] p-8 sm:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight uppercase mb-8 pb-8 border-b border-gray-100">{title}</h1>
          <div className="markdown-body prose prose-red max-w-none text-gray-600 prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight prose-a:text-[#DA291C]">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultPrivacyContent = `
## 1. Données collectées
Nous recueillons :
- **Données d'identification** : Nom, prénom ou pseudo.
- **Données de contact** : Numéro de téléphone (via WhatsApp) et adresses de livraison.
- **Données de géolocalisation** (avec votre consentement) : Pour identifier le restaurant le plus proche et vous livrer précisément.
- **Données techniques** : Adresse IP, modèle d'appareil, pour identifier et résoudre les anomalies.

## 2. Pourquoi sont-elles collectées ?
Nous utilisons ces informations uniquement pour :
- Prendre en charge, préparer et livrer votre commande vers la bonne adresse.
- Assurer le suivi de commande en temps réel.
- Améliorer notre service de livraison via les retours sur expérience.

## 3. Durée de conservation
Vos données de commande sont conservées dans notre système de gestion interne pour une durée maximale de 3 ans, pour des raisons purement comptables et de suivi qualité.

## 4. Partage d'informations
Vos données ne sont **ni louées, ni vendues**. Elles sont exclusivement partagées entre le serveur central et les livreurs de La Gastronomie de manière chiffrée, limitées au strict nécessaire (votre position et numéro).

## 5. Vos droits
Conformément à la réglementation, vous bénéficiez des droits d'accès, de rectification, de portabilité et de suppression de vos données. Pour les exercer, contactez le support via nos numéros WhatsApp associés à vos points de vente habituels, ou par email si applicable.

## 6. Protection & Sécurité
Nous appliquons les meilleures pratiques de cryptage et de sécurisation de base de données (Zero-Trust Security, Authentification stricte des requêtes web) pour empêcher tout accès frauduleux à vos adresses.
`;

const defaultTermsContent = `
## 1. Conditions d'utilisation (CGU)
L'utilisation de cette application web implique l'acceptation pleine et entière de ces CGU. Si vous n'êtes pas d'accord, veuillez cesser votre navigation.

## 2. Conditions de Commande
Toute commande déclenchée via le bouton "Commander" (sur le site ou la redirection WhatsApp) constitue la conclusion ferme d'un achat.
- **Validation** : La commande est validée dès lors qu'elle apparaît avec le statut "Nouvelle" dans le système.
- **Disponibilité** : En cas de rupture subite de matière première, un restaurant peut annuler votre commande ; vous en serez notifié via suivi ou appel direct.
- **Modification** : Une fois "En préparation" ou "En cuisine", les modifications de commande ne sont généralement plus acceptées.
- **Litiges** : Pour toute réclamation, un reçu détaillé est disponible dans votre espace de suivi.

## 3. Paiement
Les paiements se font selon les modalités locales (ex. Mobile Money ou en espèces à la livraison), détaillés au moment où notre centre vous confirmera la réception.

## 4. Tarifs
Les prix s'affichent en Ariary (Ar) ou devises locales. La Gastronomie se réserve le droit d’ajuster les tarifs, sans que ces changements n'impactent une commande déjà confirmée.

## 5. Propriété intellectuelle
Tous les contenus visuels, logos, noms et concepts présents sur ce site appartiennent à La Gastronomie Pizza.
`;

const defaultCookiesContent = `
## 1. Qu'est-ce qu'un cookie ?
Un cookie est fichier déposé de manière temporaire sur votre équipement terminal.

## 2. Notre politique « Zéro Cookie Publicitaire »
Notre plateforme est conçue pour l'action. **Nous n'utilisons aucun traceur publicitaire intrusif** (pas de retargeting, pas de pistage inter-sites).

## 3. Cookies strictement nécessaires
Nous utilisons quasi exclusivement le « Local Storage » pour :
- Mémoriser le contenu de votre panier en cas de fermeture accidentelle.
- Sauvegarder l'ID de votre commande en cours pour actualiser le statut de livraison automatiquement à votre retour.
- Votre sélection de Pays ou de Point de Vente.

## 4. Gestion
Si vous videz le cache de votre navigateur, vous perdrez votre panier en cours et votre suivi de commande, sans autres conséquences sévères sur le fonctionnement global.
`;

const defaultDeliveryContent = `
## 1. Processus et Zones
La Gastronomie livre à domicile dans un rayon délimité autour de chacun de ses restaurants. Lors de la commande, le point de vente le plus proche vous est automatiquement affecté ou proposé.
Veuillez vérifier les horaires d'ouverture avant validation.

## 2. Retrait sur place (À emporter)
Dans l'option "À emporter", une fois votre commande validée, un "Code de Retrait" est généré. Veuillez le présenter au comptoir pour sécuriser le transfert de votre commande sans attente !

## 3. Délais estimés
Notre algorithme et l'estimation du restaurant calculent une heure approximative d'arrivée (incluant temps de cuisson et variations de trafic). Ce délai reste **indicatif** (30 à 50 minutes en moyenne).

## 4. Limites de Livraison
En cas d'adresse erronée, illisible, absente sur les plateformes cartographiques, ou de zone non-sécurisée, le chauffeur livreur peut exiger un point de rencontre précis.
`;

const defaultAboutContent = `
## Notre Mission : Vous servir mieux, plus vite.
La Gastronomie Pizza est l'épicentre d'un savoir-faire de restauration rapide, allié à des outils technologiques de pointe. 

Notre ambition aujourd'hui : 
Réduire au strict minimum le temps qui vous sépare de vos plats préférés, en supprimant toute friction entre l'envie et la commande.

## Fraîcheur & Excellence
Que ce soit nos pâtes fraîches, nos ingrédients rigoureusement contrôlés, ou notre emballage pensé pour préserver la chaleur, nous sommes obsédés par l'excellence de bout en bout. Testez l'expérience digitale, et goûtez la qualité qui a fait notre renommée.
`;

const defaultContactContent = `
## Qui sommes-nous ?
**La Gastronomie Pizza**
Société de restauration rapide opérant dans toute la juridiction de Madagascar.

## Coordonnées Générales
- **Adresse centrale** : [Compléter avec adresse physique ou principale]
- **Email** : contact@lagastronomiepizza.com
- **Siège social** : Antananarivo, Madagascar.

## Mentions de contact Support & Réclamation
En cas de problème sur votre commande, le livreur ou la plateforme :
1. Privilégiez directement la **ligne WhatsApp du support** (visible sur votre application / en bas de page).
2. Fournissez votre numéro de commande "CMD-XXXX".
3. Un responsable opérationnel prendra le relai dans les minutes qui suivent.
`;

export function PagePrivacy() { return <LegalPagesWrapper title="Politique de Confidentialité" content={defaultPrivacyContent} /> }
export function PageTerms() { return <LegalPagesWrapper title="TOS & Conditions de Commande" content={defaultTermsContent} /> }
export function PageCookies() { return <LegalPagesWrapper title="Politique des Cookies" content={defaultCookiesContent} /> }
export function PageDelivery() { return <LegalPagesWrapper title="Livraison & Retrait" content={defaultDeliveryContent} /> }
export function PageAbout() { return <LegalPagesWrapper title="À Propos" content={defaultAboutContent} /> }
export function PageContact() { return <LegalPagesWrapper title="Contact & Accessibilité" content={defaultContactContent} /> }

