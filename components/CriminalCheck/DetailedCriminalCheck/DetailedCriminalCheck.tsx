import { User } from "@/types/CriminalCheckUser";
import styles from "./detailedCriminalCheck.module.css";
import { nunito } from "@/helpers/fonts";
import Button from "@/components/Button/Button";
import crossImg from "../../../assets/images/cross.svg";
import checkmarkImg from "../../../assets/images/check-black.svg";
import clockImg from "../../../assets/images/clock.svg";
import questionImg from "../../../assets/images/question.svg";
import { useState } from "react";
import DropDownButton from "@/components/DropDownButton/DropDownButton";
import { updateCriminalCheckStatus } from "@/pages/api/fetch";
import VerifiedType from "./VerifiedType/VerifiedType";
import RecordChangedAt from "./RecordChangedAt/RecordChangedAt";
import CriminalRecordCode from "./CriminalRecordCode/CriminalRecordCode";
import CriminalRecordComment from "./CriminalRecordComment/CriminalRecordComment";

type DetailedCriminalCheckProps = {
  user: User;
};

const DetailedCriminalCheck = ({ user }: DetailedCriminalCheckProps) => {
  const [comment, setComment] = useState("-");

  const options = [
    { title: "Approved", icon: checkmarkImg.src, value: "APPROVED" },
    { title: "Not submitted", icon: questionImg.src, value: "NOT_SUBMITTED" },
    { title: "Pending", icon: clockImg.src, value: "PENDING" },
    { title: "Rejected", icon: crossImg.src, value: "REJECTED" },
  ];

  const [selectedOption, setSelectedOption] = useState<number>(
    options.findIndex(
      (o) => o.value === (user.provider.criminalRecordStatus ?? "NOT_SUBMITTED")
    )
  );

  const onUpdateCriminalCheck = async () => {
    try {
      const response = await updateCriminalCheckStatus(
        user.id,
        options[selectedOption].value
      );
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.heading}>
        <div className={styles.profile}>
          <img src={user.imgUrl} alt="Profile img" />
          <span
            className={`${styles.name} ${nunito.className}`}
          >{`${user.firstName} ${user.lastName}`}</span>
        </div>
        <div className={styles.buttons}>
          <DropDownButton
            options={options}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
          <Button
            title="Update"
            type="BLACK"
            onClick={() => onUpdateCriminalCheck()}
          />
        </div>
      </div>
      <div className={styles.criminalCheckInfo}>
        <VerifiedType verifiedType={user.provider.criminalRecordVerifiedType} />
        <RecordChangedAt changedAt={user.provider.criminalRecordVerifiedAt} />
        {user.provider.criminalRecordCode && (
          <CriminalRecordCode code={user.provider.criminalRecordCode} />
        )}
        <CriminalRecordComment comment={comment} setComment={setComment} />
      </div>
    </div>
  );
};

export default DetailedCriminalCheck;
