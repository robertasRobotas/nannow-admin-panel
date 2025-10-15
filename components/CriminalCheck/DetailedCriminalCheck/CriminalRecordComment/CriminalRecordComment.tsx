import styles from "./criminalRecordComment.module.css";
import warningImg from "../../../../assets/images/attention_outlined.svg";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { addCriminalCheckNote } from "@/pages/api/fetch";
import { toast } from "react-toastify";

type CriminalRecordCommentProps = {
  notes: string[];
  userId: string;
  setNotes: Dispatch<SetStateAction<string[]>>;
};

const CriminalRecordComment = ({
  notes,
  userId,
  setNotes,
}: CriminalRecordCommentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [note, setNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);

  const onAddNoteClick = async () => {
    try {
      const response = await addCriminalCheckNote(userId, note);
      if (response.status === 200) {
        toast("Successfully added note.");
        setNotes((prevState) => [...prevState, note]);
        setNote("");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !inputRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsEditingNote(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.main}>
      <img src={warningImg.src} alt="Warning" />
      <span className={styles.title}>Criminal record status notes</span>
      {notes.length > 0 ? (
        notes.map((n) => (
          <div key={n} className={`${styles.note} ${nunito.className}`}>
            {n}
          </div>
        ))
      ) : (
        <span className={`${styles.note} ${nunito.className}`}>
          No notes yet
        </span>
      )}
      <input
        className={`${styles.noteInput} ${nunito.className}`}
        ref={inputRef}
        placeholder="Add new note?"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onClick={() => setIsEditingNote(true)}
      />
      {isEditingNote && (
        <Button
          ref={buttonRef}
          title="Add note"
          type="BLACK"
          alignBaseline={true}
          onClick={() => {
            onAddNoteClick();
            setIsEditingNote(false);
          }}
        />
      )}
    </div>
  );
};

export default CriminalRecordComment;
