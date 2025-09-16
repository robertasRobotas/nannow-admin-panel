import styles from "./criminalRecordComment.module.css";
import warningImg from "../../../../assets/images/attention_outlined.svg";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import { addCriminalCheckNote } from "@/pages/api/fetch";

type CriminalRecordCommentProps = {
  notes: string[];
  userId: string;
};

const CriminalRecordComment = ({
  notes,
  userId,
}: CriminalRecordCommentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [note, setNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  /*
  {!isEditingComment && (
        <div
          onClick={() => setIsEditingComment(true)}
          className={`${styles.comment} ${nunito.className}`}
        >
          {comment}
        </div>
      )}
      {isEditingComment && (
        <input
          className={`${styles.commentInput} ${nunito.className}`}
          ref={inputRef}
          placeholder="Enter comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      )}
  */

  const onAddNoteClick = async () => {
    try {
      const response = await addCriminalCheckNote(userId, note);
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
      {notes.map((n) => (
        <div key={n} className={`${styles.note} ${nunito.className}`}>
          {n}
        </div>
      ))}
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
