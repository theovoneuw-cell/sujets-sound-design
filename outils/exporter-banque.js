#!/usr/bin/env node
/* Exporte la banque de sujets contenue dans index.html vers BANQUE.md,
   pour relire ou imprimer tous les sujets d'un coup.
   Usage : node outils/exporter-banque.js   (depuis la racine du dépôt) */
const fs = require("fs");
const path = require("path");

const racine = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(racine, "index.html"), "utf8");

// on isole les constantes de données (SUJETS, CONS, INTENTIONS, FAMILLES)
const debut = html.indexOf("const SUJETS");
const fin = html.indexOf("const DUREES");
if (debut < 0 || fin < 0) throw new Error("bloc de données introuvable dans index.html");
const donnees = {};
new Function("SUJETS_OUT", html.slice(debut, fin) +
  "\nObject.assign(SUJETS_OUT,{SUJETS,CONS,INTENTIONS,FAMILLES});")(donnees);
const { SUJETS, CONS, INTENTIONS, FAMILLES } = donnees;

const MODES = { sd: "Sound design seul", compo: "Composition seule", mix: "Composition + sound design" };
const SCENE = { sd: "Scène", compo: "Commande", mix: "Scène" };
const PREFIX = { sd: "SD", compo: "CO", mix: "MX" };
const NIVEAUX = { 1: "Niveau 1 · Fondamentaux (1 contrainte)", 2: "Niveau 2 · Confirmé (2 contraintes)", 3: "Niveau 3 · Expert (3 contraintes)" };
const DUREES = { 1: "Court · 20 à 40 s", 2: "Moyen · 1 à 2 min", 3: "Long · 3 min et plus" };

let md = "# Banque de sujets — Sound design & composition\n\n";
md += "> Généré automatiquement depuis `index.html` par `outils/exporter-banque.js`. Ne pas modifier à la main : modifier `index.html` puis relancer le script.\n\n";

const total = Object.values(SUJETS).reduce((n, a) => n + a.length, 0);
md += "## Sommaire\n\n";
md += `- ${total} sujets : ${Object.keys(SUJETS).map(m => `${SUJETS[m].length} ${MODES[m].toLowerCase()}`).join(", ")}\n`;
md += `- ${CONS.common.length + CONS.sd.length + CONS.compo.length} contraintes techniques\n`;
md += `- ${INTENTIONS.length} intentions / registres\n`;
md += `- ${FAMILLES.length} exercices de famille (travail en groupe)\n\n`;
md += "Chaque sujet se lit ainsi : **la scène** (ce qu'il se passe) puis **ce qui doit s'entendre** (le critère de réussite, vérifiable à l'écoute). L'intention et les contraintes sont tirées séparément par le générateur.\n\n";

for (const m of Object.keys(SUJETS)) {
  md += `## ${MODES[m]}\n\n`;
  for (const d of [1, 2, 3]) {
    for (const l of [1, 2, 3]) {
      const liste = SUJETS[m].map((s, i) => ({ ...s, i })).filter(s => s.d === d && s.l === l);
      if (!liste.length) continue;
      md += `### ${NIVEAUX[d]} — ${DUREES[l]}\n\n`;
      for (const s of liste) {
        const ref = PREFIX[m] + "-" + String(s.i + 1).padStart(3, "0");
        md += `**${ref}** — ${s.t}  \n`;
        md += `*Ce qui doit s'entendre :* ${s.e}\n\n`;
      }
    }
  }
}

md += "## Contraintes techniques\n\n";
md += "Le chiffre entre parenthèses est le niveau à partir duquel la contrainte peut tomber.\n\n";
for (const [k, titre] of [["common", "Tous les modes"], ["sd", "Sound design"], ["compo", "Composition"]]) {
  md += `### ${titre}\n\n`;
  for (const c of CONS[k]) md += `- ${c.t} *(niv. ${c.min}+)*\n`;
  md += "\n";
}

md += "## Intentions / registres\n\n";
for (const i of INTENTIONS) md += `- ${i}\n`;
md += "\n";

md += "## Exercices de famille (travail en groupe)\n\n";
md += "Une carte par participant, consigne commune. Le nombre de cartes fixe la taille maximale du groupe.\n\n";
FAMILLES.forEach((f, i) => {
  md += `### FA-${String(i + 1).padStart(3, "0")} — ${f.t} (${f.m.length} cartes)\n\n`;
  md += `${f.c}\n\n`;
  md += f.m.map(x => `\`${x}\``).join(" · ") + "\n\n";
});

fs.writeFileSync(path.join(racine, "BANQUE.md"), md);
console.log(`BANQUE.md écrit : ${total} sujets.`);
