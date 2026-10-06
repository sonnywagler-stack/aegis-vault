# Aegis Vault

Site vitrine et boutique d'Aegis Vault, vitrines acryliques pour collectionneurs d'ETB.

Site statique, sans build : ouvrez `index.html` dans un navigateur, ou servez le dossier (`npx http-server .`).

- `index.html` — contenu des pages
- `styles.css` — mise en forme (thème sombre, accent or)
- `script.js` — dessins du Vault 3×3 générés à l'échelle depuis le plan de découpe, configurateur de mur, panier

## Shopify

Le panier du site envoie vers le checkout de la boutique Shopify (`SHOPIFY_STORE` en haut de `script.js`) via un permalien `/cart/<variante>:<quantité>,…`. Paiement, livraison et commandes sont gérés par Shopify.

- Chaque produit de `PRODUCTS` porte l'ID de sa variante Shopify (`variant`). Si un produit est recréé dans Shopify, mettez l'ID à jour.
- Les prix affichés sur le site doivent rester identiques à ceux de Shopify.
- La remise mur (−5 % dès 2 Vault 3×3, −10 % dès 4) est une remise automatique Shopify ; `wallDiscount` dans `script.js` ne sert qu'à l'affichage.

Le formulaire de contact ouvre un email prérempli vers contact@aegisvault.fr.
