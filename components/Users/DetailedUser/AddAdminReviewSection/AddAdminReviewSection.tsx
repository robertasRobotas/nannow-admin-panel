import { useMemo, useState } from "react";
import styles from "./addAdminReviewSection.module.css";
import Input from "@/components/Input/Input";
import Button from "@/components/Button/Button";
import { addReviewByAdmin } from "@/pages/api/fetch";
import { UserDetails } from "@/types/Client";

type AdminReviewPayload = {
  generalRating: number;
  punctualityRating?: number;
  empathyRating?: number;
  communicationRating?: number;
  cleanlinessRating?: number;
  text?: string;
  clientId: string;
  providerId: string;
  textCreatedAt?: string | Date;
};

type AddAdminReviewSectionProps = {
  onBackClick: () => void;
  user: UserDetails;
  mode: "client" | "provider";
  defaultOrderId?: string;
};

const AddAdminReviewSection = ({
  onBackClick,
  user,
  mode,
}: AddAdminReviewSectionProps) => {
  const [providerId, setProviderId] = useState("");
  const [generalRating, setGeneralRating] = useState("");
  const [punctualityRating, setPunctualityRating] = useState("");
  const [empathyRating, setEmpathyRating] = useState("");
  const [communicationRating, setCommunicationRating] = useState("");
  const [cleanlinessRating, setCleanlinessRating] = useState("");
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [providerIdErr, setProviderIdErr] = useState(false);
  const [generalRatingErr, setGeneralRatingErr] = useState(false);

  useMemo(() => {
    if (mode === "provider" && !providerId) {
      setProviderId(user.user.id);
    }
  }, [mode, user.user.id, providerId]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const missingProvider = providerId.trim().length === 0;
    const missingGeneral = generalRating.trim().length === 0;

    setProviderIdErr(missingProvider);
    setGeneralRatingErr(missingGeneral);

    const payload: AdminReviewPayload = {
      generalRating: Number(generalRating),
      clientId: "nannow",
      providerId: providerId.trim(),
    };
    if (punctualityRating)
      payload.punctualityRating = Number(punctualityRating);
    if (empathyRating) payload.empathyRating = Number(empathyRating);
    if (communicationRating)
      payload.communicationRating = Number(communicationRating);
    if (cleanlinessRating)
      payload.cleanlinessRating = Number(cleanlinessRating);
    if (text.trim().length > 0) payload.text = text.trim();
    payload.textCreatedAt = new Date().toISOString();

    try {
      setLoading(true);
      await addReviewByAdmin(user.user.id, payload);
      setSuccess("Review added successfully.");
    } catch (err) {
      setError("Failed to add review. Please verify IDs and try again.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  console.log(user);

  return (
    <div className={styles.main}>
      <div className={styles.title}>Add Review (Admin)</div>
      <div className={styles.grid}>
        <Input
          label="Provider ID"
          value={providerId}
          setValue={setProviderId}
          isError={providerIdErr}
          setIsError={setProviderIdErr}
          disabled
        />
        <div className={styles.field}>
          <label className={styles.label}>General rating (required)</label>
          <select
            className={`${styles.select} ${
              generalRatingErr ? styles.selectError : ""
            }`}
            value={generalRating}
            onChange={(e) => setGeneralRating(e.target.value)}
          >
            <option value="" disabled>
              Select general rating...
            </option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Punctuality rating</label>
          <select
            className={styles.select}
            value={punctualityRating}
            onChange={(e) => setPunctualityRating(e.target.value)}
          >
            <option value="" disabled>
              Select punctuality rating...
            </option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Empathy rating</label>
          <select
            className={styles.select}
            value={empathyRating}
            onChange={(e) => setEmpathyRating(e.target.value)}
          >
            <option value="" disabled>
              Select empathy rating...
            </option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Communication rating</label>
          <select
            className={styles.select}
            value={communicationRating}
            onChange={(e) => setCommunicationRating(e.target.value)}
          >
            <option value="" disabled>
              Select communication rating...
            </option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Cleanliness rating</label>
          <select
            className={styles.select}
            value={cleanlinessRating}
            onChange={(e) => setCleanlinessRating(e.target.value)}
          >
            <option value="" disabled>
              Select cleanliness rating...
            </option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
      </div>
      <div className={styles.textFields}>
        <div className={styles.textareaGroup}>
          <label className={styles.label}>Text</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.actions}>
        <Button title="Back" onClick={onBackClick} type="OUTLINED" />
        <Button
          title={loading ? "Submitting..." : "Submit Review"}
          onClick={handleSubmit}
          type="FILLED"
        />
      </div>
    </div>
  );
};

export default AddAdminReviewSection;
