import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import ModalPageTemplate from "@/components/ModalPageTemplate/ModalPageTemplate";
import {
  createChatModerationRule,
  getChatModerationRules,
  getChatModerationSettings,
  updateChatModerationRule,
  updateChatModerationSettings,
  deleteChatModerationRule,
} from "@/pages/api/fetch";

const LANGUAGES = ["en", "lt"] as const;
type Language = (typeof LANGUAGES)[number];
type Rule = { id: string; label: string; translations: Record<string, string[]>; weight: number; enabled: boolean };

const emptyTranslations = () => Object.fromEntries(LANGUAGES.map((language) => [language, [] as string[]]));
const variants = (value: unknown): string[] => Array.isArray(value) ? value : typeof value === "string" && value.trim() ? [value] : [];

export default function ChatModerationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState({ label: "", translations: emptyTranslations(), weight: 1 });
  const [threshold, setThreshold] = useState(1);
  const [error, setError] = useState("");
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [deletingRule, setDeletingRule] = useState<Rule | null>(null);

  const load = async () => {
    try {
      const [rulesResponse, settingsResponse] = await Promise.all([getChatModerationRules(), getChatModerationSettings()]);
      setRules(rulesResponse.data?.items ?? []);
      setThreshold(settingsResponse.data?.item?.detectorThreshold ?? 1);
    } catch { setError("Failed to load moderation settings."); }
  };

  useEffect(() => { void load(); }, []);

  const addRule = async () => {
    if (!newRule.label.trim() || !Object.values(newRule.translations).some((value) => value.some((phrase) => phrase.trim()))) return;
    try {
      const item = (await createChatModerationRule({ ...newRule, language: "any", enabled: true })).data.item;
      setRules((current) => [...current, item]);
      setNewRule({ label: "", translations: emptyTranslations(), weight: 1 });
    } catch { setError("Failed to add rule."); }
  };

  const saveRule = async (rule: Rule) => {
    try {
      const item = (await updateChatModerationRule(rule.id, rule)).data.item;
      setRules((current) => current.map((candidate) => candidate.id === rule.id ? item : candidate));
    } catch { setError("Failed to save rule."); }
  };
  const removeRule = (rule: Rule) => setDeletingRule(rule);
  const confirmDeleteRule = async () => { if (!deletingRule) return; try { await deleteChatModerationRule(deletingRule.id); setRules((current) => current.filter((item) => item.id !== deletingRule.id)); setDeletingRule(null); } catch { setError("Failed to delete rule."); } };
  const updateEditingTranslation = (language: Language, value: string) => setEditingRule((current) => current ? { ...current, translations: { ...current.translations, [language]: value.split("\n").map((phrase) => phrase.trim()).filter(Boolean) } } : current);

  const updateNewTranslation = (language: Language, value: string) =>
    setNewRule((current) => ({ ...current, translations: { ...current.translations, [language]: value.split("\n").map((phrase) => phrase.trim()).filter(Boolean) } }));

  return (
    <ModalPageTemplate isScrollable>
      <main style={{ padding: 40, maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div><h1>Payment detection keywords</h1><p>Manage one rule with translations for every supported language.</p></div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><label>Detector threshold <select value={threshold} onChange={async (event) => { const value = Number(event.target.value); setThreshold(value); await updateChatModerationSettings(value); }}>{Array.from({ length: 20 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><Button title="Back to chats" type="OUTLINED" onClick={() => window.history.back()} /></div>
        </div>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1100 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 70px 70px 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 80px", gap: 8, padding: 12, fontWeight: 700 }}><span>Rule</span><span>Weight</span><span>Enabled</span>{LANGUAGES.map((language) => <span key={language}>{language.toUpperCase()}</span>)}<span /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 70px 70px 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 80px", gap: 8, padding: 12, borderBottom: "1px solid #ddd" }}><input placeholder="Label" value={newRule.label} onChange={(event) => setNewRule({ ...newRule, label: event.target.value })} /><input type="number" min={1} max={10} value={newRule.weight} onChange={(event) => setNewRule({ ...newRule, weight: Number(event.target.value) })} /><span>on</span>{LANGUAGES.map((language) => <textarea key={language} rows={2} placeholder={`${language.toUpperCase()} variants, one per line`} value={newRule.translations[language].join("\n")} onChange={(event) => updateNewTranslation(language, event.target.value)} />)}<Button title="Add" type="BLACK" onClick={addRule} /></div>
            {rules.map((rule) => <div key={rule.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 70px 70px repeat(5, 1.2fr) 80px 80px", gap: 8, alignItems: "center", padding: "10px 12px", borderBottom: "1px solid #eee" }}><input value={rule.label} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, label: event.target.value } : item))} /><input type="number" min={1} max={10} value={rule.weight} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, weight: Number(event.target.value) } : item))} /><input type="checkbox" checked={rule.enabled} onChange={(event) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: event.target.checked } : item))} />{LANGUAGES.map((language) => <button type="button" key={language} style={{ minHeight: 40, textAlign: "left", border: "1px solid #eee", background: "#fff", padding: 8, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} onClick={() => setEditingRule({ ...rule, translations: Object.fromEntries(LANGUAGES.map((key) => [key, variants(rule.translations?.[key])])) })}>{variants(rule.translations?.[language])[0] || `${language.toUpperCase()} — add variant`}</button>)}<Button title="Save" type="BLACK" onClick={() => saveRule(rule)} /><Button title="Delete" type="DELETE" onClick={() => removeRule(rule)} /></div>)}
          </div>
        </div>
      </main>
      {editingRule && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "min(900px, 95vw)", maxHeight: "85vh", overflow: "auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2>Edit translations</h2><Button title="Close" type="PLAIN" onClick={() => setEditingRule(null)} /></div><input style={{ width: "100%", margin: "12px 0" }} value={editingRule.label} onChange={(event) => setEditingRule({ ...editingRule, label: event.target.value })} />{LANGUAGES.map((language) => <label key={language} style={{ display: "block", marginBottom: 12 }}>{language.toUpperCase()}<textarea rows={4} style={{ display: "block", width: "100%" }} value={variants(editingRule.translations?.[language]).join("\n")} placeholder="One variant per line" onChange={(event) => updateEditingTranslation(language, event.target.value)} /></label>)}<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Button title="Cancel" type="OUTLINED" onClick={() => setEditingRule(null)} /><Button title="Save" type="BLACK" onClick={async () => { await saveRule(editingRule); setEditingRule(null); }} /></div></div></div>}
      {deletingRule && <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "min(420px, 92vw)" }}><h2>Delete rule?</h2><p>Are you sure you want to delete “{deletingRule.label}”?</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Button title="Cancel" type="OUTLINED" onClick={() => setDeletingRule(null)} /><Button title="Delete" type="DELETE" onClick={confirmDeleteRule} /></div></div></div>}
    </ModalPageTemplate>
  );
}
