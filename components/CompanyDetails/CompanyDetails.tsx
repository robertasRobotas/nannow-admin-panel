import { FormEvent, useEffect, useState } from "react";
import { getCurrentAdminRolesFromJwt, getCompanyDetails, updateCompanyDetails, type CompanyDetails as CompanyDetailsData } from "@/pages/api/fetch";
import styles from "./companyDetails.module.css";

const empty: CompanyDetailsData = { name: "", companyCode: "", vatNumber: "", address: "", email: null, phone: "", vatRatePercent: 0, vatHistory: [] };
const initialVatHistory = [{ vatRatePercent: 0, effectiveFrom: "2026-01-01T00:00:00.000Z", changedByAdminId: null }];

const CompanyDetails = () => {
  const [details, setDetails] = useState<CompanyDetailsData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setAllowed(roles.includes("SUPER_ADMIN"));
    if (!roles.includes("SUPER_ADMIN")) { setLoading(false); return; }
    getCompanyDetails().then((response) => {
      const data = response.data;
      setDetails({ ...data, vatHistory: data.vatHistory?.length ? data.vatHistory : initialVatHistory });
    }).catch(() => setMessage("Could not load company details.")).finally(() => setLoading(false));
  }, []);

  type EditableKey = Exclude<keyof CompanyDetailsData, 'vatHistory'>;
  const update = (key: EditableKey, value: string) =>
    setDetails((current) => ({ ...current, [key]: key === "vatRatePercent" ? Number(value) : value }));

  const openSaveConfirmation = (event: FormEvent) => {
    event.preventDefault();
    setIsSaveConfirmOpen(true);
  };

  const save = async () => {
    setSaving(true); setMessage("");
    try { const response = await updateCompanyDetails(details); setDetails(response.data); setMessage("Company details saved."); setIsSaveConfirmOpen(false); }
    catch { setMessage("Could not save company details."); }
    finally { setSaving(false); }
  };

  if (!allowed && !loading) return <p>Only SUPER_ADMIN can access company details.</p>;
  return <section className={styles.page}><h1 className={styles.title}>Company details</h1><p className={styles.intro}>Seller information for Nannow platform-fee invoices. VAT is added to the platform fee only.</p>
    {loading ? <p>Loading…</p> : <div className={styles.card}><form onSubmit={openSaveConfirmation} className={styles.form}>
      {([ ["name", "Company name"], ["companyCode", "Company code"], ["vatNumber", "PVM payer code"], ["address", "Address"], ["email", "Email"], ["phone", "Phone"], ["vatRatePercent", "VAT / PVM percentage"] ] as Array<[EditableKey, string]>).map(([key, label]) => <label key={key} className={`${styles.field} ${key === "address" || key === "email" ? styles.wide : ""}`}>{label}<input required={key !== "email"} type={key === "vatRatePercent" ? "number" : "text"} min={key === "vatRatePercent" ? 0 : undefined} max={key === "vatRatePercent" ? 100 : undefined} step={key === "vatRatePercent" ? "1" : undefined} value={details[key] ?? ""} onChange={(e) => update(key, e.target.value)} /></label>)}
      <button className={styles.save} type="submit" disabled={saving}>{saving ? "Saving…" : "Save company details"}</button>
    </form>{message && <p className={styles.message}>{message}</p>}</div>}
    {!loading && <div className={styles.history}><h2>VAT / PVM history</h2><ul className={styles.historyList}>{(details.vatHistory ?? []).slice().sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()).map((entry) => <li className={styles.historyItem} key={`${entry.effectiveFrom}-${entry.vatRatePercent}`}><strong>{Number(entry.vatRatePercent).toFixed(2)}%</strong><span className={styles.historyDate}>Effective from {new Date(entry.effectiveFrom).toLocaleString()}</span></li>)}</ul></div>}
    {isSaveConfirmOpen && <div className={styles.modalBackdrop} role="presentation"><div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="company-details-confirm-title"><h2 id="company-details-confirm-title">Save company details?</h2><p>These details will be used on newly generated platform-fee invoices.</p><p><strong>VAT / PVM rate: {Math.round(Number(details.vatRatePercent))}%</strong></p><div className={styles.modalActions}><button type="button" className={styles.cancel} onClick={() => setIsSaveConfirmOpen(false)} disabled={saving}>Cancel</button><button type="button" className={styles.save} onClick={save} disabled={saving}>{saving ? "Saving…" : "Confirm save"}</button></div></div></div>}
  </section>;
};
export default CompanyDetails;
