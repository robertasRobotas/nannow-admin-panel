import Button from "@/components/Button/Button";
import ProfileInfo from "../../ProfileInfo/ProfileInfo";
import ProfileMenuButtons from "../ProfileMenuButtons/ProfileMenuButtons";
import styles from "./profileMenu.module.css";
import trashImg from "../../../../assets/images/trash.svg";
import balanceImg from "../../../../assets/images/wallet.svg";
import { UserDetails } from "@/types/Client";
import { Dispatch, SetStateAction, useState } from "react";
import avatarImg from "../../../../assets/images/default-avatar.png";
import { deleteUser } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { nunito } from "@/helpers/fonts";

type ProfileMenuProps = {
  user: UserDetails;
  selectedSection: string;
  setIsSelectedMenu: () => void;
  setSelectedSection: Dispatch<SetStateAction<string>>;
  mode: "client" | "provider";
};

const ProfileMenu = ({
  user,
  setIsSelectedMenu,
  selectedSection,
  setSelectedSection,
  mode,
}: ProfileMenuProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!user.user.id) return;

    try {
      setIsDeleting(true);
      await deleteUser(user.user.id);
      
      toast.success("User was successfully deleted");
      
      // Redirect to users page after a short delay
      setTimeout(() => {
        router.push("/users");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.aside}>
      <div className={styles.profileWrapper}>
        <ProfileInfo
          name={`${user.user.firstName} ${user.user.lastName}`}
          imgUrl={
            user.user.imgUrl.length > 0 ? user.user.imgUrl : avatarImg.src
          }
          id={user.user.id}
          mode={mode}
        />
        <div className={styles.balance}>
          <img src={balanceImg.src} alt="Balance" />

          {mode === "provider" && (
            <span> Total earnings: € {user?.provider?.totalEarnings}</span>
          )}
        </div>
      </div>
      <ProfileMenuButtons
        setIsSelectedMenu={setIsSelectedMenu}
        user={user}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        mode={mode}
      />
      <Button
        title="Delete profile"
        imgUrl={trashImg.src}
        type="OUTLINED"
        onClick={openDeleteModal}
      />
      
      {isDeleteModalOpen && (
        <div className={styles.confirmationBackdrop}>
          <div className={`${styles.confirmationModal} ${nunito.className}`}>
            <h2 className={styles.confirmationTitle}>Delete user?</h2>
            <p className={styles.confirmationBody}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className={styles.confirmationActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={closeDeleteModal}
                isDisabled={isDeleting}
              />
              <Button
                title={isDeleting ? "Deleting..." : "Delete"}
                type="DELETE"
                onClick={confirmDelete}
                isDisabled={isDeleting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
