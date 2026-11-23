"use client";

import React, { useState, useEffect } from "react";
import SvgIcon from "@/components/ui/Icon";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
  createdBy: string;
  lastUsedAt?: string | null;
  isRevoked: boolean;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

const AVAILABLE_SCOPES = [
  { id: "articles", label: "Articles & Rédaction", desc: "Créer, modifier et lister les articles et brouillons" },
  { id: "social", label: "Contenus Réseaux Sociaux", desc: "Extraire les punchlines pour LinkedIn, Twitter, Insta, WAB" },
  { id: "magazines", label: "Magazines & Kiosque", desc: "Monter et publier de nouvelles éditions au kiosque" },
  { id: "analytics", label: "Analyse de Données", desc: "Consulter les statistiques de lecture, ventes et audience" },
  { id: "media_kit", label: "Kit Média & Régie", desc: "Consulter et mettre à jour les tarifs et chiffres publicitaires" },
  { id: "wab", label: "Publication WAB", desc: "Diffuser des annonces officielles sur le réseau WAB" },
  { id: "comments", label: "Modération Commentaires", desc: "Approuver, masquer ou supprimer les avis lecteurs" },
];

export default function AdminApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["all"]);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  // Clé nouvellement générée affichée une seule fois
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // État de révocation
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (res.ok && data.keys) {
        setKeys(data.keys);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setGenerating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes.includes("all") ? ["all"] : selectedScopes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de génération");

      setNewlyCreatedSecret(data.rawSecretKey);
      setKeyName("");
      setSelectedScopes(["all"]);
      setShowCreateModal(false);
      setSuccessMsg("Clé d'API générée avec succès ! Pensez à la copier dès maintenant.");
      if (data.supabaseWarning) {
        setWarningMsg(data.supabaseWarning);
      } else {
        setWarningMsg("");
      }
      await fetchKeys();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Êtes-vous certain de vouloir révoquer cette clé d'agent ? L'agent ne pourra plus effectuer aucune action sur votre site.")) {
      return;
    }

    setRevokingId(keyId);
    try {
      const res = await fetch(`/api/admin/api-keys?id=${encodeURIComponent(keyId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la révocation");

      setSuccessMsg(data.message || "Clé révoquée avec succès.");
      await fetchKeys();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[22px] border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#9e001f]/10 text-[#9e001f]">
              <SvgIcon name="key" className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#0A1931]">Agents IA & Clés d'API</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            Générez des clés d'accès sécurisées pour connecter vos agents autonomes (Claude, Cursor, Antigravity, n8n, Make) à Envol Africa via le serveur MCP ou l'API REST.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setErrorMsg("");
          }}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#9e001f] text-xs font-bold text-white shadow-sm transition hover:bg-[#800019]"
        >
          <SvgIcon name="add" className="w-4 h-4" />
          Créer une clé d'agent
        </button>
      </div>

      {/* Message de succès */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="font-bold text-emerald-600 hover:text-emerald-800">×</button>
        </div>
      )}

      {/* Avertissement Supabase Migration */}
      {warningMsg && (
        <div className="flex items-start justify-between p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
          <div className="flex gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="block font-bold">Persistance Supabase recommandée :</strong>
              <p className="mt-0.5 leading-relaxed text-amber-800">{warningMsg}</p>
            </div>
          </div>
          <button type="button" onClick={() => setWarningMsg("")} className="font-bold text-amber-700 hover:text-amber-900 ml-3">×</button>
        </div>
      )}

      {/* Alerte Nouvelle Clé Secrète générée */}
      {newlyCreatedSecret && (
        <div className="p-6 rounded-[22px] bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔑</span>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-amber-900">
                Copiez immédiatement votre nouvelle clé d'API secrète !
              </h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Par mesure de sécurité stricte, cette clé ne sera <strong>plus jamais affichée</strong> après avoir fermé cette boîte. Conservez-la dans votre gestionnaire de secrets ou collez-la dans votre configuration MCP.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newlyCreatedSecret}
                  className="flex-1 font-mono text-xs p-3 rounded-xl bg-white border border-amber-300 text-slate-800 select-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(newlyCreatedSecret)}
                  className={`h-11 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0A1931] text-white hover:bg-slate-800"
                  }`}
                >
                  <SvgIcon name={copied ? "check" : "content_copy"} className="w-4 h-4" />
                  {copied ? "Copié !" : "Copier la clé"}
                </button>
                <button
                  type="button"
                  onClick={() => setNewlyCreatedSecret(null)}
                  className="h-11 px-4 rounded-xl font-bold text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  J'ai copié ma clé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des Clés */}
      <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0A1931]">
            Clés actives et révoquées ({keys.length})
          </h3>
          <button
            type="button"
            onClick={fetchKeys}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <SvgIcon name="refresh" className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            Chargement des clés d'API...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🤖</span>
            <p className="mt-3 text-sm font-bold text-slate-700">Aucune clé d'agent active</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Créez votre première clé pour permettre à un agent IA de rédiger des articles, analyser des données ou publier des numéros de magazine.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-[#9e001f] text-xs font-bold text-white"
            >
              Créer une clé
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Nom de l'agent</th>
                  <th className="py-3 px-5">Identifiant / Préfixe</th>
                  <th className="py-3 px-5">Créée par</th>
                  <th className="py-3 px-5">Dernière utilisation</th>
                  <th className="py-3 px-5">Statut</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map((k) => (
                  <tr key={k.id} className={k.isRevoked ? "bg-slate-50/70 opacity-60" : "hover:bg-slate-50/50"}>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>🤖</span>
                        <span>{k.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600 font-semibold">
                      {k.keyPrefix}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      <div>{k.createdBy}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(k.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {k.lastUsedAt ? (
                        new Date(k.lastUsedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-slate-400 italic">Jamais utilisée</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {k.isRevoked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          Révoquée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active ✓
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {!k.isRevoked && (
                        <button
                          type="button"
                          disabled={revokingId === k.id}
                          onClick={() => handleRevokeKey(k.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <SvgIcon name="block" className="w-3 h-3" />
                          {revokingId === k.id ? "Révocation..." : "Révoquer"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide rapide MCP & API */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-[20px] bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <span>⚡</span>
            <span>Connexion via le Serveur MCP</span>
          </h4>
          <p className="leading-relaxed">
            Pour connecter votre agent dans <strong>Claude Desktop</strong>, <strong>Cursor</strong> ou <strong>Antigravity</strong>, utilisez le projet <code className="bg-slate-100 px-1 py-0.5 rounded">mcp-server-envolafrica</code> avec la clé secrète générée ci-dessus dans la variable <code className="bg-slate-100 px-1 py-0.5 rounded">EAM_AGENT_API_KEY</code>.
          </p>
        </div>

        <div className="p-5 rounded-[20px] bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <span>🌐</span>
            <span>Appel direct en HTTP REST</span>
          </h4>
          <p className="leading-relaxed">
            Pour vos workflows n8n ou scripts Python, passez simplement l'en-tête suivant sur <code className="bg-slate-100 px-1 py-0.5 rounded">/api/agent/*</code> :
          </p>
          <div className="font-mono bg-slate-900 text-slate-100 p-2 rounded-lg text-[11px] overflow-x-auto">
            x-agent-api-key: eam_live_votre_cle_secrete
          </div>
        </div>
      </div>

      {/* Modale de création de clé */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-base text-[#0A1931]">
                Générer une nouvelle clé d'agent IA
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom descriptif de l'agent ou du bot *
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ex: Claude Desktop Rédaction, Bot Social Media n8n, Agent Modération"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e001f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Permissions accordées à l'agent
                </label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <label className="flex items-start gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes("all")}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedScopes(["all"]);
                        else setSelectedScopes(["articles", "social"]);
                      }}
                      className="mt-0.5 rounded border-slate-300 text-[#9e001f]"
                    />
                    <span>Accès complet (Tous les 8 outils autorisés)</span>
                  </label>

                  {!selectedScopes.includes("all") &&
                    AVAILABLE_SCOPES.map((scope) => (
                      <label key={scope.id} className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pl-4">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes([...selectedScopes.filter((s) => s !== "all"), scope.id]);
                            } else {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                            }
                          }}
                          className="mt-0.5 rounded border-slate-300 text-[#9e001f]"
                        />
                        <div>
                          <span className="font-semibold text-slate-800">{scope.label}</span>
                          <span className="block text-[10px] text-slate-400">{scope.desc}</span>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-10 px-4 rounded-full border text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generating || !keyName.trim()}
                  className="h-10 px-6 rounded-full bg-[#9e001f] text-xs font-bold text-white hover:bg-[#800019] disabled:opacity-50"
                >
                  {generating ? "Génération en cours..." : "Générer la clé d'agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
