import Button from "@/components/Button/Button";
import {
  exportCompensationInfoEmailTemplate,
  getCompensationInfoEmailTemplate,
  updateCompensationInfoEmailTemplate,
} from "@/pages/api/fetch";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { useRouter } from "next/router";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import styles from "./[userId]/info-email.module.css";

type Attachment = { id: string; fileName: string; size: number };
type ExportAttachment = Attachment & {
  contentType: string;
  dataBase64: string;
};
const initialBody = "<p>Hello,</p><p></p><p>Best regards,<br>Nannow team</p>";

export default function CompensationInfoEmailTemplatePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState("Information about compensation");
  const [bodyHtml, setBodyHtml] = useState(initialBody);
  const [savedAttachments, setSavedAttachments] = useState<Attachment[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [importDialog, setImportDialog] = useState<
    "none" | "save" | "continue"
  >("none");
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialBody;
    void getCompensationInfoEmailTemplate()
      .then(({ data }) => {
        if (!data.template) return;
        setSubject(data.template.subject);
        setBodyHtml(data.template.bodyHtml);
        if (editorRef.current)
          editorRef.current.innerHTML = data.template.bodyHtml;
        setSavedAttachments(data.template.attachments ?? []);
      })
      .catch(() => toast.error("Could not load the shared email."));
  }, []);
  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    setBodyHtml(editorRef.current?.innerHTML ?? "");
  };
  const keepSelection = (event: MouseEvent<HTMLButtonElement>) =>
    event.preventDefault();
  const addLink = () => {
    const url = window.prompt("Paste a URL (https://…)");
    if (!url?.trim()) return;
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      command("createLink", parsed.toString());
    } catch {
      toast.error("Use a valid http:// or https:// URL.");
    }
  };
  const toggleBulletList = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node instanceof HTMLElement ? node : node?.parentElement;
    const list = element?.closest("ol, ul");
    if (list?.tagName === "OL") {
      const ul = document.createElement("ul");
      ul.innerHTML = list.innerHTML;
      list.replaceWith(ul);
      setBodyHtml(editorRef.current?.innerHTML ?? "");
      return;
    }
    if (list?.tagName === "UL") {
      const fragment = document.createDocumentFragment();
      Array.from(list.children).forEach((item) => {
        const p = document.createElement("p");
        p.textContent = item.textContent;
        fragment.appendChild(p);
      });
      list.replaceWith(fragment);
      setBodyHtml(editorRef.current?.innerHTML ?? "");
      return;
    }
    const text = selection?.toString().trim() ?? "";
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (text && range) {
      const ul = document.createElement("ul");
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
      range.deleteContents();
      range.insertNode(ul);
      setBodyHtml(editorRef.current?.innerHTML ?? "");
      return;
    }
    command("insertUnorderedList");
  };
  const addFiles = (list: FileList | null) => {
    const next = [...files, ...Array.from(list ?? [])];
    if (
      next.length + savedAttachments.length > 5 ||
      next.reduce((sum, file) => sum + file.size, 0) +
        savedAttachments.reduce((sum, file) => sum + file.size, 0) >
        7 * 1024 * 1024
    )
      return toast.error("Use no more than 5 attachments, 7 MB total.");
    setFiles(next);
  };
  const save = async () => {
    const html = editorRef.current?.innerHTML ?? "";
    if (!subject.trim() || !html.replace(/<[^>]*>/g, "").trim())
      return toast.error("Subject and email content are required.");
    try {
      setSaving(true);
      const result = await updateCompensationInfoEmailTemplate({
        subject,
        bodyHtml: html,
        attachments: files,
        removeAttachmentIds: removedIds,
      });
      setSavedAttachments(result.data?.template?.attachments ?? []);
      setRemovedIds([]);
      setFiles([]);
      toast.success("Shared compensation email saved.");
    } catch {
      toast.error("Could not save the shared email.");
    } finally {
      setSaving(false);
    }
  };
  const saveFile = async (name: string, bytes: Uint8Array) => {
    const picker = (
      window as Window & {
        showSaveFilePicker?: (options?: unknown) => Promise<{
          createWritable: () => Promise<{
            write: (data: Uint8Array) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      }
    ).showSaveFilePicker;
    if (picker) {
      const handle = await picker({
        suggestedName: name,
        types: [
          {
            description: "ZIP archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(bytes);
      await writable.close();
      return;
    }
    const blobBytes = new Uint8Array(bytes.byteLength);
    blobBytes.set(bytes);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([blobBytes.buffer], { type: "application/zip" }),
    );
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const exportTemplate = async (): Promise<boolean> => {
    try {
      const { data } = await exportCompensationInfoEmailTemplate();
      const template = data.template as {
        subject: string;
        bodyHtml: string;
        attachments: ExportAttachment[];
        updatedAt: string;
      };
      const manifest = {
        formatVersion: 1,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        updatedAt: template.updatedAt,
        attachments: template.attachments.map(
          ({ id, fileName, contentType, size }) => ({
            id,
            fileName,
            contentType,
            size,
            path: `attachments/${id}-${fileName}`,
          }),
        ),
      };
      const filesToZip: Record<string, Uint8Array> = {
        "template.json": strToU8(JSON.stringify(manifest, null, 2)),
      };
      template.attachments.forEach((attachment) => {
        const binary = atob(attachment.dataBase64);
        filesToZip[`attachments/${attachment.id}-${attachment.fileName}`] =
          Uint8Array.from(binary, (char) => char.charCodeAt(0));
      });
      await saveFile(
        `compensation-email-template-${new Date().toISOString().slice(0, 10)}.zip`,
        zipSync(filesToZip),
      );
      return true;
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toast.warning("The template could not be exported. Please try again.");
      }
      return false;
    }
  };
  const openImportPicker = async () => {
    try {
      const picker = (
        window as Window & {
          showOpenFilePicker?: (
            options?: unknown,
          ) => Promise<Array<{ getFile: () => Promise<File> }>>;
        }
      ).showOpenFilePicker;
      let selectedFile: File;
      if (picker) {
        const [handle] = await picker({
          multiple: false,
          types: [
            {
              description: "ZIP archive",
              accept: { "application/zip": [".zip"] },
            },
          ],
        });
        selectedFile = await handle.getFile();
      } else {
        selectedFile = await new Promise<File>((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".zip,application/zip";
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) resolve(file);
            else
              reject(
                new DOMException("File selection cancelled", "AbortError"),
              );
          };
          input.click();
        });
      }
      const archive = unzipSync(
        new Uint8Array(await selectedFile.arrayBuffer()),
      );
      const manifest = JSON.parse(
        strFromU8(archive["template.json"] ?? new Uint8Array()),
      ) as {
        subject: string;
        bodyHtml: string;
        attachments?: Array<{
          id: string;
          fileName: string;
          contentType: string;
          path: string;
        }>;
      };
      const imported = (manifest.attachments ?? []).map(
        (attachment) =>
          new File([archive[attachment.path]], attachment.fileName, {
            type: attachment.contentType,
          }),
      );
      const result = await updateCompensationInfoEmailTemplate({
        subject: manifest.subject,
        bodyHtml: manifest.bodyHtml,
        attachments: imported,
        removeAttachmentIds: savedAttachments.map(
          (attachment) => attachment.id,
        ),
      });
      setSubject(manifest.subject);
      setBodyHtml(manifest.bodyHtml);
      if (editorRef.current) editorRef.current.innerHTML = manifest.bodyHtml;
      setSavedAttachments(result.data?.template?.attachments ?? []);
      setRemovedIds([]);
      setFiles([]);
      toast.success("Template imported successfully.");
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toast.warning(
          "The template could not be imported. Check that the ZIP file is valid.",
        );
      }
    } finally {
      setImportDialog("none");
    }
  };
  const importTemplate = () => setImportDialog("save");
  const saveCurrentBeforeImport = async () => {
    try {
      const saved = await exportTemplate();
      if (!saved) return;
      setImportDialog("continue");
    } catch {
      toast.warning("The current template could not be saved.");
    }
  };
  return (
    <main className={styles.page}>
      <div className={styles.topbar}>
        <div>
          <h1>Info email</h1>
          <p>This single email is sent to every compensation user.</p>
        </div>
        <Button
          title="Back"
          type="OUTLINED"
          onClick={() => void router.push("/compensation")}
        />
      </div>
      <div className={styles.layout}>
        <section className={styles.compose}>
          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
          <div className={styles.editorLabel}>Message</div>
          <div className={styles.toolbar}>
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={() => command("formatBlock", "h2")}
            >
              H
            </button>
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={() => command("bold")}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={() => command("italic")}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={() => command("underline")}
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={toggleBulletList}
            >
              • List
            </button>
            <button type="button" onMouseDown={keepSelection} onClick={addLink}>
              Link
            </button>
            <input
              aria-label="Text colour"
              type="color"
              onChange={(event) => command("foreColor", event.target.value)}
            />
            <input
              aria-label="Highlight colour"
              type="color"
              onChange={(event) => command("hiliteColor", event.target.value)}
            />
          </div>
          <div
            ref={editorRef}
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => setBodyHtml(event.currentTarget.innerHTML)}
          />
          <div className={styles.attachments}>
            <label className={styles.fileButton}>
              Add attachments
              <input
                type="file"
                multiple
                onChange={(event) => addFiles(event.target.files)}
              />
            </label>
            {savedAttachments.map((file) => (
              <div className={styles.attachment} key={file.id}>
                <span>{file.fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSavedAttachments((current) =>
                      current.filter((item) => item.id !== file.id),
                    );
                    setRemovedIds((current) => [...current, file.id]);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {files.map((file, index) => (
              <div className={styles.attachment} key={`${file.name}-${index}`}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <Button
              title="Export ZIP"
              type="OUTLINED"
              onClick={() => void exportTemplate()}
              isDisabled={saving}
            />
            <Button
              title="Import ZIP"
              type="OUTLINED"
              onClick={() => void importTemplate()}
              isDisabled={saving}
            />
            <Button
              title={saving ? "Saving..." : "Save email"}
              type="BLACK"
              onClick={save}
              isDisabled={saving}
            />
          </div>
        </section>
        <aside className={styles.preview}>
          <div className={styles.previewTitle}>Preview</div>
          <div className={styles.previewSubject}>{subject}</div>
          <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </aside>
      </div>
      {importDialog !== "none" && (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true">
            {importDialog === "save" ? (
              <>
                <h2>Import email template?</h2>
                <p>
                  Importing will overwrite the current shared email. Save the
                  current template first?
                </p>
                <div className={styles.modalActions}>
                  <Button
                    title="Cancel"
                    type="OUTLINED"
                    onClick={() => setImportDialog("none")}
                  />
                  <Button
                    title="Import"
                    type="OUTLINED"
                    onClick={() => void openImportPicker()}
                  />
                  <Button
                    title="Save current"
                    type="BLACK"
                    onClick={() => void saveCurrentBeforeImport()}
                  />
                </div>
              </>
            ) : (
              <>
                <h2>Current template saved</h2>
                <p>
                  The current template was saved successfully. Continue to
                  import another template?
                </p>
                <div className={styles.modalActions}>
                  <Button
                    title="Cancel"
                    type="OUTLINED"
                    onClick={() => setImportDialog("none")}
                  />
                  <Button
                    title="Continue"
                    type="BLACK"
                    onClick={() => void openImportPicker()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
