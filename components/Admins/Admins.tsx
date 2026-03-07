import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Button from "@/components/Button/Button";
import styles from "./admins.module.css";
import {
  AdminRole,
  AdminUserPayload,
  createAdminUser,
  getAllAdmins,
  getCurrentAdminRolesFromJwt,
  updateAdminUser,
} from "@/pages/api/fetch";
import { useRouter } from "next/router";

const ROLE_OPTIONS: AdminRole[] = ["ADMIN", "SUPER_ADMIN"];

const getAdminId = (admin: AdminUserPayload): string =>
  admin.id ?? admin._id ?? "";

const normalizeAdmins = (data: unknown): AdminUserPayload[] => {
  if (Array.isArray(data)) return data as AdminUserPayload[];
  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    const result = payload.result as Record<string, unknown> | undefined;
    const directAdmins = payload.admins;
    const resultAdmins = result?.admins;
    if (Array.isArray(directAdmins)) return directAdmins as AdminUserPayload[];
    if (Array.isArray(resultAdmins)) return resultAdmins as AdminUserPayload[];
  }
  return [];
};

const Admins = () => {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUserPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [createFirstName, setCreateFirstName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRoles, setCreateRoles] = useState<AdminRole[]>(["ADMIN"]);
  const [isCreating, setIsCreating] = useState(false);

  const [editingAdmin, setEditingAdmin] = useState<AdminUserPayload | null>(
    null,
  );
  const [editFirstName, setEditFirstName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [editRoles, setEditRoles] = useState<AdminRole[]>(["ADMIN"]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const roles = getCurrentAdminRolesFromJwt();
    const hasSuperAdmin = roles.includes("SUPER_ADMIN");
    setIsSuperAdmin(hasSuperAdmin);
    if (!hasSuperAdmin) {
      router.replace("/users");
    }
  }, [router]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllAdmins();
      setAdmins(normalizeAdmins(response.data));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Only super admin can access this page.");
        return;
      }
      setError("Failed to load admins.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchAdmins();
  }, [fetchAdmins, isSuperAdmin]);

  const toggleRole = (
    currentRoles: AdminRole[],
    setRoles: (roles: AdminRole[]) => void,
    role: AdminRole,
  ) => {
    if (currentRoles.includes(role)) {
      const next = currentRoles.filter((r) => r !== role);
      if (next.length > 0) setRoles(next);
      return;
    }
    setRoles([...currentRoles, role]);
  };

  const handleCreateAdmin = async () => {
    if (isCreating) return;
    if (!createEmail.trim() || !createFirstName.trim() || createRoles.length === 0) {
      setError("Fill first name, email and roles.");
      return;
    }
    try {
      setIsCreating(true);
      setError("");
      await createAdminUser({
        firstName: createFirstName.trim(),
        email: createEmail.trim(),
        password: createPassword.trim() ? createPassword.trim() : undefined,
        roles: createRoles,
      });
      setCreateFirstName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRoles(["ADMIN"]);
      await fetchAdmins();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to create admin.",
        );
        return;
      }
      setError("Failed to create admin.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (admin: AdminUserPayload) => {
    setEditingAdmin(admin);
    setEditFirstName(admin.firstName ?? "");
    setEditEmail(admin.email ?? "");
    setEditPassword("");
    setRemovePassword(false);
    const initialRoles = (admin.roles ?? []).filter(
      (role): role is AdminRole => role === "ADMIN" || role === "SUPER_ADMIN",
    );
    setEditRoles(initialRoles.length > 0 ? initialRoles : ["ADMIN"]);
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin || isSavingEdit) return;
    const adminId = getAdminId(editingAdmin);
    if (!adminId) {
      setError("Admin id is missing.");
      return;
    }
    if (!editEmail.trim() || !editFirstName.trim() || editRoles.length === 0) {
      setError("Fill first name, email and roles.");
      return;
    }
    try {
      setIsSavingEdit(true);
      setError("");
      await updateAdminUser(adminId, {
        firstName: editFirstName.trim(),
        email: editEmail.trim(),
        roles: editRoles,
        password: removePassword
          ? ""
          : editPassword.trim()
            ? editPassword.trim()
            : undefined,
      });
      setEditingAdmin(null);
      await fetchAdmins();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { error?: string })?.error ??
            "Failed to update admin.",
        );
        return;
      }
      setError("Failed to update admin.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const sortedAdmins = useMemo(
    () =>
      [...admins].sort((a, b) =>
        `${a.firstName ?? ""}${a.email}`.localeCompare(
          `${b.firstName ?? ""}${b.email}`,
        ),
      ),
    [admins],
  );

  return (
    <div className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Admins</h1>
        <Button
          title="Refresh"
          type="OUTLINED"
          onClick={fetchAdmins}
          isDisabled={loading}
          isLoading={loading}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.createCard}>
        <h3 className={styles.cardTitle}>Create admin</h3>
        <div className={styles.fieldsGrid}>
          <label className={styles.field}>
            <span>First name</span>
            <input
              value={createFirstName}
              onChange={(e) => setCreateFirstName(e.target.value)}
              type="text"
              placeholder="NewAdmin"
            />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              type="email"
              placeholder="new.admin@nannow.com"
            />
          </label>
          <label className={styles.field}>
            <span>Password (optional)</span>
            <input
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              type="password"
              placeholder="StrongPassword123!"
            />
          </label>
        </div>
        <div className={styles.rolesRow}>
          {ROLE_OPTIONS.map((role) => (
            <label key={role} className={styles.roleOption}>
              <input
                type="checkbox"
                checked={createRoles.includes(role)}
                onChange={() => toggleRole(createRoles, setCreateRoles, role)}
              />
              {role}
            </label>
          ))}
        </div>
        <Button
          title="Create admin"
          type="BLACK"
          onClick={handleCreateAdmin}
          isDisabled={isCreating}
          isLoading={isCreating}
        />
      </div>

      <div className={styles.list}>
        {sortedAdmins.map((admin) => (
          <div key={getAdminId(admin) || admin.email} className={styles.adminCard}>
            <div className={styles.adminMain}>
              <div>
                <div className={styles.adminName}>{admin.firstName ?? "—"}</div>
                <div className={styles.adminEmail}>{admin.email}</div>
              </div>
              <div className={styles.rolesPills}>
                {(admin.roles ?? []).map((role) => (
                  <span key={`${getAdminId(admin)}-${role}`} className={styles.rolePill}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <Button
              title="Edit"
              type="OUTLINED"
              onClick={() => openEditModal(admin)}
            />
          </div>
        ))}
        {!loading && sortedAdmins.length === 0 && (
          <p className={styles.empty}>No admins found.</p>
        )}
      </div>

      {editingAdmin && (
        <div className={styles.backdrop}>
          <div className={styles.modal}>
            <h3 className={styles.cardTitle}>Edit admin</h3>
            <div className={styles.fieldsGrid}>
              <label className={styles.field}>
                <span>First name</span>
                <input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  type="text"
                />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  type="email"
                />
              </label>
              <label className={styles.field}>
                <span>New password</span>
                <input
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  type="password"
                  disabled={removePassword}
                  placeholder="Leave empty to keep current"
                />
              </label>
            </div>
            <label className={styles.removePasswordRow}>
              <input
                type="checkbox"
                checked={removePassword}
                onChange={(e) => setRemovePassword(e.target.checked)}
              />
              Remove password login
            </label>
            <div className={styles.rolesRow}>
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className={styles.roleOption}>
                  <input
                    type="checkbox"
                    checked={editRoles.includes(role)}
                    onChange={() => toggleRole(editRoles, setEditRoles, role)}
                  />
                  {role}
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <Button
                title="Cancel"
                type="OUTLINED"
                onClick={() => setEditingAdmin(null)}
                isDisabled={isSavingEdit}
              />
              <Button
                title="Save"
                type="BLACK"
                onClick={handleSaveAdmin}
                isDisabled={isSavingEdit}
                isLoading={isSavingEdit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
