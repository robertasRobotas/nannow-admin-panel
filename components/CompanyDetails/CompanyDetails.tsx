import { FormEvent, useEffect, useState } from "react";
import { getCurrentAdminRolesFromJwt, getCompanyDetails, updateCompanyDetails, type CompanyDetails as CompanyDetailsData } from "@/pages/api/fetch";

const empty: CompanyDetailsData = { name: "", companyCode: "", vatNumber: "", address: "", email: null, phone: "", vatRatePercent: 0, vatHistory: [] };

const CompanyDetails = () => {
  const [details, setDetails] = useState<CompanyDetailsData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    setAllowed(roles.includes("SUPER_ADMIN"));
    if (!roles.includes("SUPER_ADMIN")) { setLoading(false); return; }
    getCompanyDetails().then((response) => setDetails(response.data)).catch(() => setMessage("Could not load company details.")).finally(() => setLoading(false));
  }, []);

  type EditableKey = Exclude<keyof CompanyDetailsData, 'vatHistory'>;
  const update = (key: EditableKey, value: string) =>
    setDetails((current) => ({ ...current, [key]: key === "vatRatePercent" ? Number(value) : value }));

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try { const response = await updateCompanyDetails(details); setDetails(response.data); setMessage("Company details saved."); }
    catch { setMessage("Could not save company details."); }
    finally { setSaving(false); }
  };

  if (!allowed && !loading) return <p>Only SUPER_ADMIN can access company details.</p>;
  return <section style={{ maxWidth: 720 }}><h1>Company details</h1><p>These details appear on Nannow platform-fee invoices. VAT is added to the platform fee only.</p>
    {loading ? <p>Loading…</p> : <form onSubmit={save} style={{ display: "grid", gap: 14 }}>
      {([ ["name", "Company name"], ["companyCode", "Company code"], ["vatNumber", "PVM payer code"], ["address", "Address"], ["email", "Email"], ["phone", "Phone"], ["vatRatePercent", "VAT / PVM percentage"] ] as Array<[EditableKey, string]>).map(([key, label]) => <label key={key} style={{ display: "grid", gap: 5 }}>{label}<input required={key !== "email"} type={key === "vatRatePercent" ? "number" : "text"} min={key === "vatRatePercent" ? 0 : undefined} max={key === "vatRatePercent" ? 100 : undefined} step={key === "vatRatePercent" ? "0.01" : undefined} value={details[key] ?? ""} onChange={(e) => update(key, e.target.value)} /></label>)}
      <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save company details"}</button>{message && <p>{message}</p>}
    </form>}
    {!loading && details.vatHistory && <><h2>VAT / PVM history</h2><ul>{details.vatHistory.slice().sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()).map((entry) => <li key={`${entry.effectiveFrom}-${entry.vatRatePercent}`}>{Number(entry.vatRatePercent).toFixed(2)}% from {new Date(entry.effectiveFrom).toLocaleString()}</li>)}</ul></>}
  </section>;
};
export default CompanyDetails;
