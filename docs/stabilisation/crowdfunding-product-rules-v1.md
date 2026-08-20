# Règles produit Crowdfunding — V1

## Décisions confirmées

La page d’accueil Crowdfunding utilisera un scroll infini de campagnes. Les campagnes boostées seront classées avant les campagnes normales, mais uniquement pendant la durée payée du boost. Le boost sera proposé après la création du projet, et non comme une étape obligatoire du formulaire initial. Le porteur choisira librement la durée du boost, sans durée minimale ni durée maximale imposée par la plateforme. Le tarif initial est de 500 FCFA par jour, avec calcul automatique du montant total. L’administrateur pourra modifier ultérieurement le tarif journalier depuis son dashboard. Après paiement confirmé, la campagne sera automatiquement publiée ou relayée sur WAB. Les campagnes boostées resteront prioritaires dans le scroll infini uniquement pendant la durée payée du boost.

Les quatre types de financement initiaux sont conservés : don simple (`donation`), don avec contrepartie (`reward`), prise de participation (`equity`) et prêt (`lending`). L’administrateur pourra ajouter ultérieurement un type de projet supplémentaire depuis son dashboard, mais sans modifier les paramètres techniques réservés au développeur.

Le lancement couvre les pays francophones africains retenus par le projet, ainsi que le Nigeria et le Ghana. Le système doit toutefois être conçu pour étendre ultérieurement la couverture à d’autres pays africains.

La plateforme détecte automatiquement la langue et la devise d’affichage selon le pays depuis lequel le visiteur ouvre le site. Cette règle est transversale à l’écosystème EAM. Le porteur choisit la devise de son projet et saisit directement les montants dans cette devise ; les montants de la campagne ne doivent pas être silencieusement modifiés par une conversion d’affichage.

La durée maximale d’une campagne est de trois mois, soit 90 jours. Un porteur ne peut avoir qu’un seul brouillon et ne peut pas lancer plus d’un projet actif simultanément. La commission peut varier selon le type de financement. Le dashboard du porteur affichera séparément le montant brut total collecté et la commission qui sera due. La commission sera calculée sur le montant brut effectivement collecté, et non sur le montant net après frais. Elle ne sera pas prélevée à chaque contribution : elle sera calculée et prélevée au moment de la demande de remboursement ou de reversement des fonds. Le taux applicable à chaque projet devra être enregistré et visible avant le lancement afin de préserver la transparence.

Les vidéos seront ajoutées sous forme de liens externes validés, par exemple YouTube ou Vimeo. L’upload vidéo n’est pas prévu dans la première version afin de limiter le poids et la complexité technique.

La traduction des campagnes sera automatique ; le porteur n’aura pas à fournir manuellement les versions linguistiques. Les textes originaux resteront conservés afin d’éviter toute perte et de permettre une correction ultérieure si nécessaire.

L’accompagnement par le cabinet partenaire est obligatoire uniquement pour le financement Angel. Lors de la création d’un projet Angel, le porteur doit choisir l’une des trois formules documentées : 50 000 FCFA par mois, 80 000 FCFA par mois ou 100 000 FCFA par mois. Le porteur paie directement le cabinet. La facturation et l’accompagnement commencent dès le démarrage de la société, lorsque le cabinet et le porteur commencent effectivement leur travail commun. L’accompagnement couvre notamment la gestion financière, la comptabilité, le management, le marketing et le suivi de la croissance. Il se poursuit jusqu’à l’autonomie du porteur, définie ici comme le moment où le promoteur obtient lui-même un financement lui permettant d’avancer sans cet accompagnement. La fin de l’accompagnement doit être validée et tracée dans le système.

Pour les financements participatifs et les emprunts, l’accompagnement du cabinet n’est pas obligatoire. En revanche, tout porteur qui boucle un financement doit publier régulièrement ses comptes, résultats et informations d’évolution sur la plateforme. Les investisseurs disposent d’un reporting mensuel dans leur dashboard et peuvent demander des précisions complémentaires au porteur par messagerie.

## Décisions restant à confirmer avant le développement

1. Définir la liste exacte des pays francophones inclus au lancement et confirmer si la Mauritanie, Djibouti, les Comores, les Seychelles et Madagascar sont inclus malgré leurs situations linguistiques particulières.
2. Définir les devises réellement activées pour chaque pays de lancement et les moyens de paiement Moneroo disponibles par pays.
3. Le porteur est limité à un seul brouillon et à un seul projet actif ou en validation à la fois.
4. Le boost coûte initialement 500 FCFA par jour ; le porteur choisit librement la durée sans minimum ni maximum, le total est calculé automatiquement et l’administrateur peut modifier le tarif journalier.
5. Une campagne boostée est publiée automatiquement dans WAB après confirmation du paiement.
6. Définir les seuils financiers minimum et maximum par devise ou par pays.
7. Définir qui configure le taux de commission par type et si le taux est verrouillé au lancement ou reste modifiable avant la demande de reversement.
8. Définir la méthode de KYC minimale avant soumission et les documents réellement vérifiés par l’administrateur.
9. Les trois formules du cabinet sont fixées à 50 000, 80 000 et 100 000 FCFA par mois ; elles doivent être documentées dans l’interface.
10. Définir le mode de paiement technique des formules du cabinet et le suivi des échéances mensuelles.
11. Définir les indicateurs mensuels obligatoires du reporting pour les projets participatifs et les emprunts.
12. Définir le délai de publication du reporting et la procédure en cas de retard ou d’information incomplète.

## Règle d’architecture

Les campagnes publiques seront lues depuis Supabase avec pagination par curseur pour le scroll infini. Le classement utilisera d’abord les boosts actifs et non expirés, puis les campagnes actives normales, avec un ordre secondaire stable par date de publication. Les campagnes non actives ne seront jamais exposées publiquement.
