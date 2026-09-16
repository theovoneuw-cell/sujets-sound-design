# Générateur de sujets — Sound design & composition

Un tirage de sujets d'exercice pour des étudiants de 3ᵉ année en sound design.
Une seule page HTML, sans installation, sans connexion : elle marche sur Mac, Windows, Linux, depuis une clé USB, un mail ou l'ENT.

- **[index.html](index.html)** — le générateur (à ouvrir dans un navigateur)
- **[BANQUE.md](BANQUE.md)** — tous les sujets, contraintes, intentions et familles, lisibles d'un coup

## Ouvrir

**Sur Mac** : télécharge le dépôt (bouton *Code → Download ZIP*, ou `git clone`), décompresse, puis double-clique sur `index.html`. Safari, Chrome ou Firefox conviennent. Si macOS demande une confirmation la première fois, clic droit → *Ouvrir*.

**En classe, sans rien distribuer** : le générateur est en ligne à l’adresse **<https://theovoneuw-cell.github.io/sujets-sound-design/>** (GitHub Pages, mis à jour automatiquement à chaque push sur `main`). Les étudiants l’ouvrent sur leur propre machine, sans rien télécharger.

Toute la page est un téléviseur cathodique : réglages à gauche, sujet diffusé à droite, chrono et réglages d'image sur la façade du bas. Tout tient en une seule vue, sans défilement.

## Utiliser

L'étudiant (ou l'enseignant) choisit :

| Réglage | Options |
|---|---|
| **Travail** | Sound design seul · Composition seule · Compo + sound design |
| **Niveau** | Au hasard · 1 Fondamentaux · 2 Confirmé · 3 Expert |
| **En groupe** | Non, ou 2 à 12 participants (exercice de famille, une carte chacun) |
| **Durée** | Au hasard · Court 20-40 s · Moyen 1-2 min · Long 3 min + |

Puis **TIRER UN SUJET** (ou la barre d'espace).

### Ce que contient un sujet

| Bloc | Rôle |
|---|---|
| **La scène** / **La commande** | Ce qu'il se passe, ce qu'on demande. Une à deux phrases. |
| **Ce qui doit s'entendre** | Le critère de réussite, vérifiable à l'écoute. C'est là-dessus que le rendu est évalué. |
| **Intention / registre** | Le ton demandé. Il est tiré séparément de la scène : les associations inattendues sont voulues. |
| **Contraintes techniques** | 1 en niveau 1, 2 en niveau 2, 3 en niveau 3, choisies dans le lot autorisé au niveau. |
| **Rendu** | Durée, format (WAV 48 kHz / 24 bits) et nom de fichier attendu : `RÉF_NOM.wav`. |

Chaque sujet porte une référence (`SD-042`, `CO-017`, `MX-078`, `FA-012` pour les familles) : pratique pour dire « refais-moi le SD-042 » ou pour nommer un rendu.

Les boutons sous l'écran : **↻ Intention** et **↻ Contraintes** retirent au sort sans changer la scène. **Copier** met le sujet complet en texte brut dans le presse-papier. **Imprimer** ne sort que le sujet, en noir sur blanc, avec un cartouche nom / date.

### Sujet du jour

Donne le **même sujet à toute la classe** pour une date et des réglages donnés, sans rien distribuer. Il change tout seul le lendemain et ne consomme pas la banque.

### Pas de répétition

Les sujets tirés sont mémorisés par le navigateur et ne reviennent qu'une fois tous ceux du filtre épuisés. Le lien en bas à gauche remet le compteur à zéro. La mémoire est propre à chaque ordinateur et à chaque navigateur.

### Façade du poste

| | |
|---|---|
| **Chrono** | 15 min à 3 h. Trois bips à la fin, puis il passe en négatif pour montrer le dépassement. Il s'affiche aussi en bas à droite de l'écran. |
| **Phosphore** | Ambre / vert / blanc — retinte toute l'interface. |
| **Balayage** | Coupe les lignes de balayage si elles gênent la lecture (vidéoprojecteur, écran fatigué). |

## Contenu de la banque

| | |
|---|---|
| Sound design seul | 97 sujets |
| Composition seule | 89 sujets |
| Compo + sound design | 95 sujets |
| **Total** | **281 sujets** × 34 intentions × 47 contraintes, + 34 exercices de famille |

Chaque combinaison niveau × durée de chaque mode contient au moins trois sujets.

## Modifier la banque

Tout le contenu est en clair en haut du bloc `<script>` de `index.html`. Après modification, relance `node outils/exporter-banque.js` pour régénérer `BANQUE.md`.

Un sujet :

```js
{t:"La scène : ce qu'il se passe, en une à deux phrases.",
 e:"Ce qui doit s'entendre : le critère de réussite, vérifiable à l'écoute.",d:2,l:2},
```

- `t` — la scène (sound design, mix) ou la commande (composition). Vise 130 caractères maximum pour rester lisible à l'écran.
- `e` — l'enjeu. Une phrase, concrète, que l'on peut vérifier en écoutant le rendu. Vise 150 caractères maximum.
- `d` — niveau : `1` fondamentaux, `2` confirmé, `3` expert. Fixe le nombre de contraintes.
- `l` — durée : `1` court, `2` moyen, `3` long.

Ajoute-le dans le bon tableau : `sd`, `compo` ou `mix`. Ne supprime pas la virgule finale. Les références (`SD-042`…) suivent l'ordre du tableau : ajouter en fin de tableau évite de renuméroter les sujets existants.

Une contrainte :

```js
{t:"Le texte de la contrainte.",min:2},
```

`min` = niveau à partir duquel elle peut tomber (`2` = jamais en niveau 1). `CONS.common` = tous les modes, `CONS.sd` = sound design, `CONS.compo` = composition.

Une intention : une simple ligne de texte entre guillemets dans `INTENTIONS`.

Une famille (exercice de groupe) :

```js
{t:"Le nom de la famille", c:"La consigne commune.", m:["Carte 1","Carte 2","Carte 3"]},
```

Le nombre de cartes fixe la taille maximale du groupe pour cette famille.

Garde au moins un sujet dans chaque combinaison niveau × durée de chaque mode, sinon ce réglage affichera « HORS PORTÉE ».
