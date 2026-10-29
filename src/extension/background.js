// Icône de la barre d'outils ou Alt+Shift+V : demande à la page (et à ses cadres) d'ouvrir le lecteur.
var api = typeof browser !== 'undefined' ? browser : chrome;

function openIn(tab) {
  if (tab && tab.id != null) api.tabs.sendMessage(tab.id, 'va-open').catch(function () {});
}

api.action.onClicked.addListener(openIn);
api.commands.onCommand.addListener(function (cmd, tab) {
  if (cmd !== 'open-player') return;
  if (tab) openIn(tab);
  else api.tabs.query({ active: true, currentWindow: true }).then(function (t) { openIn(t[0]); });
});
