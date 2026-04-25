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
## 1. Informations que nous collectons
Nous recueillons les informations que vous nous fournissez directement, notamment lors de la création d'une commande (nom, adresse, numéro de téléphone).

## 2. Comment nous utilisons vos informations
Nous utilisons les informations que nous collectons pour :
- Traiter et livrer vos commandes.
- Vous envoyer des mises à jour sur l'état de celles-ci.
- Répondre à vos questions et demandes via le support.

## 3. Partage d'informations
Vos données personnelles ne sont **jamais** vendues à des acteurs tiers. Elles sont uniquement partagées avec nos équipes de préparation et de livraison pour assurer le service.

## 4. Sécurité
Nous mettons en œuvre des mesures de sécurité pour protéger vos données contre les accès non autorisés, la modification ou la destruction.

## 5. Contact
Pour toute question, veuillez nous contacter aux numéros affichés en bas de page.
`;

const defaultTermsContent = `
## 1. Conditions d'utilisation
En accédant au présent site web, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables.

## 2. Commandes et Validations
Toute commande effectuée sur la plateforme constitue un engagement ferme. Nous nous réservons le droit d'annuler ou de refuser toute commande d'un client avec lequel il existerait un litige.

## 3. Tarifs
Les prix de nos produits sont indiqués en Ariary (Ar) toutes taxes comprises. La Gastronomie se réserve le droit de modifier ses prix à tout moment.

## 4. Droit applicable
Les présentes conditions sont régies et interprétées conformément aux lois en vigueur à Madagascar.
`;

const defaultCookiesContent = `
## 1. Qu'est-ce qu'un cookie ?
Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite du site ou de la consultation d'une page.

## 2. Utilisation
Notre application utilise uniquement des cookies essentiels ou des technologies de stockage local (Local Storage) nécessaires au fonctionnement du panier et au maintien de votre session de commande ou d'administration.

## 3. Cookies Tiers
Nous pouvons occasionnellement utiliser des services tiers (pour la cartographie, exemples OSRM ou Leaflet) qui peuvent déposer des cookies pour analyser les flux.
`;

const defaultDeliveryContent = `
## 1. Zones de livraison
Nous livrons dans les zones couvertes par nos points de vente. L'application vous permet de sélectionner le magasin le plus proche. Si votre adresse est hors de portée de notre flotte, nous vous contacterons.

## 2. Frais
Un tarif forfaitaire ou variable peut s'appliquer en fonction de la distance, défini lors de l'estimation de votre commande.

## 3. Délais
Nous nous efforçons d'assurer des livraisons rapides (généralement entre 30 et 45 minutes selon l'éloignement et le volume de commandes). Les conditions de circulation ou météorologiques peuvent faire varier le délai.
`;

const defaultAboutContent = `
## Notre Histoire
La Gastronomie Pizza a vu le jour avec une ambition simple : amener l'excellence de la restauration rapide (QSR) à Madagascar.

## Notre Mission
Servir rapidement nos clients avec des produits frais, locaux, et une qualité irréprochable. Nous continuons d'étendre notre zone de couverture avec toujours plus de points de vente pour être plus proche de vous.
`;

export function PagePrivacy() { return <LegalPagesWrapper title="Politique de Confidentialité" content={defaultPrivacyContent} /> }
export function PageTerms() { return <LegalPagesWrapper title="Conditions d'Utilisation" content={defaultTermsContent} /> }
export function PageCookies() { return <LegalPagesWrapper title="Politique des Cookies" content={defaultCookiesContent} /> }
export function PageDelivery() { return <LegalPagesWrapper title="Politique de Livraison" content={defaultDeliveryContent} /> }
export function PageAbout() { return <LegalPagesWrapper title="À Propos" content={defaultAboutContent} /> }

