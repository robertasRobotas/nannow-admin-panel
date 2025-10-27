import styles from "./detailedFeedback.module.css";
import { nunito } from "@/helpers/fonts";
import arrowImg from "../../../assets/images/arrow-right.svg";
import crossImg from "../../../assets/images/cross.svg";
import checkmarkImg from "../../../assets/images/checkmark-white.svg";
import avatarImg from "../../../assets/images/default-avatar.png";
import Button from "@/components/Button/Button";
import { useMediaQuery } from "react-responsive";
import { updateFeedbackStatus } from "@/pages/api/fetch";
import arrowOut from "../../../assets/images/arrow-out.svg";
import { toast } from "react-toastify";
import { copyFeedback } from "@/helpers/clipboardWrites";
import attentionImg from "../../../assets/images/attention.svg";
import checkmarkGreenImg from "../../../assets/images/circle-checkmark-filled.svg";
import { Dispatch, SetStateAction, useState } from "react";
import { FeedbackType } from "@/types/Feedback";

type DetailedFeedback = {
  feedback: FeedbackType;
  onBackClick?: () => void;
  feedbacks: FeedbackType[];
  setFeedbacks: Dispatch<SetStateAction<FeedbackType[]>>;
};

const DetailedFeedback = ({
  feedback,
  feedbacks,
  onBackClick,
  setFeedbacks,
}: DetailedFeedback) => {
  const isMobile = useMediaQuery({ query: "(max-width: 936px)" });
  const [isSolved, setIsSolved] = useState(feedback?.isResolved);

  const onMarkSolved = async (isSolved: boolean) => {
    try {
      const response = await updateFeedbackStatus(feedback.id, isSolved);
      if (response.status === 200) {
        toast("Successfully updated status");
        setFeedbacks(
          feedbacks.map((r) => {
            if (r.id === feedback.id) {
              return { ...r, isResolved: !r.isResolved };
            } else return r;
          })
        );
        setIsSolved((prevState) => !prevState);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const onShare = async () => {
    copyFeedback(feedback.id);
    toast("Link to feedback copied!");
  };

  return (
    <div className={styles.main}>
      <span className={`${styles.sectionTitle} ${nunito.className}`}>
        Details
      </span>
      <div className={styles.status}>
        <span className={styles.statusTitle}>STATUS:</span>
        <img
          src={isSolved ? checkmarkGreenImg.src : attentionImg.src}
          className={styles.statusImg}
        />
        <span
          className={isSolved ? styles.solvedStatus : styles.reportedStatus}
        >
          {isSolved ? "SOLVED" : "REPORTED"}
        </span>
      </div>
      <div className={styles.heading}>
        <div className={styles.feedbackDetails}>
          <div className={styles.profile}>
            <img src={feedback?.user?.imgUrl ?? avatarImg.src} alt="Profile" />
            <div>
              <span className={styles.title}>Feedback by</span>
              <span className={styles.name}>
                {`${feedback?.user?.firstName ?? "Deleted"}\n${
                  feedback?.user?.lastName ?? "User"
                }`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.btnsWrapper}>
          {!isSolved && (
            <Button
              title="Mark as solved"
              imgUrl={checkmarkImg.src}
              type="GREEN"
              onClick={() => onMarkSolved(true)}
            />
          )}
          {isSolved && (
            <Button
              title="Mark as not solved"
              imgUrl={crossImg.src}
              type="GRAY"
              onClick={() => onMarkSolved(false)}
            />
          )}

          <Button
            title="Share"
            imgUrl={arrowOut.src}
            type="OUTLINED"
            onClick={() => onShare()}
          />
          {isMobile && onBackClick && (
            <Button title="Back" type="OUTLINED" onClick={onBackClick} />
          )}
        </div>
      </div>
      <div className={styles.review}>
        <img src={feedback?.user.imgUrl ?? avatarImg.src} alt="Profile" />
        <div className={styles.reviewBubble}>
          {feedback?.message ?? "No feedback message"}
        </div>
      </div>
    </div>
  );
};

export default DetailedFeedback;
