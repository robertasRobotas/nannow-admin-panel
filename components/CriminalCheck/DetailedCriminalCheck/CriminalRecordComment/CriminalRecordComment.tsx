import styles from "./criminalRecordComment.module.css";
import warningImg from "../../../../assets/images/attention_outlined.svg";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { nunito } from "@/helpers/fonts";

type CriminalRecordCommentProps = {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
};

const CriminalRecordComment = ({
  comment,
  setComment,
}: CriminalRecordCommentProps) => {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        if (comment.length === 0) setComment("-");
        setIsEditingComment(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [comment]);

  return (
    <div className={styles.main}>
      <img src={warningImg.src} alt="Warning" />
      <span className={styles.title}>Criminal record status comment</span>
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
    </div>
  );
};

export default CriminalRecordComment;
