# Aegis Vault — thème Shopify

Thème Shopify (Online Store 2.0) de la boutique Aegis Vault : vitrines acryliques pour ETB.

## Structure

- `layout/` — gabarit général (`theme.liquid`) et page d'attente (`password.liquid`)
- `sections/` — sections modifiables dans l'éditeur de thème : bannière, points forts, fiche technique, configurateur de mur, produits, étapes, FAQ, contact, newsletter, et pages principales (produit, collection, panier, compte…)
- `snippets/` — morceaux réutilisés (carte produit, prix, tiroir panier, logo)
- `templates/` — pages en JSON ; `product.vault.json` est la fiche détaillée du Vault 3×3
- `assets/aegis.css`, `assets/aegis.js` — styles, illustrations à l'échelle (cotes du plan de découpe), configurateur, panier AJAX

## Fonctionnement

- **Prix, stock, panier, paiement** : tout vient de Shopify. Le panier utilise l'API AJAX de Shopify (`/cart/add.js`, `/cart/change.js`).
- **Remise mur** : remises automatiques Shopify (−5 % dès 2 Vault 3×3, −10 % dès 4). Le configurateur affiche les mêmes paliers ; ils se règlent dans la section « Configurateur de mur » et doivent rester identiques aux remises Shopify.
- **Illustrations** : un produit sans photo est dessiné automatiquement selon ses tags (`vault`, `aimants`, `roulettes`, sinon vitrine solo). Dès qu'une photo est ajoutée dans Shopify, elle remplace le dessin.
- **Fiche Vault** : le produit Vault 3×3 utilise le modèle `product.vault` (configurateur, cotes, FAQ sous la fiche).

## Développement

Avec [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) :

```sh
shopify theme dev --store a0di9y-dh      # aperçu local
shopify theme check                     # vérification
shopify theme push --unpublished        # envoi vers la boutique
```

On peut aussi relier ce dépôt GitHub à la boutique (Boutique en ligne › Thèmes › Ajouter un thème › Se connecter depuis GitHub) pour synchroniser automatiquement la branche.
