import Button from "@/components/Button/Button";
import { getCompensationInfoEmailTemplate, updateCompensationInfoEmailTemplate } from "@/pages/api/fetch";
import { useRouter } from "next/router";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import styles from "./[userId]/info-email.module.css";

type Attachment = { id: string; fileName: string; size: number };
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

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialBody;
    void getCompensationInfoEmailTemplate().then(({ data }) => {
      if (!data.template) return;
      setSubject(data.template.subject);
      setBodyHtml(data.template.bodyHtml);
      if (editorRef.current) editorRef.current.innerHTML = data.template.bodyHtml;
      setSavedAttachments(data.template.attachments ?? []);
    }).catch(() => toast.error("Could not load the shared email."));
  }, []);

  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    setBodyHtml(editorRef.current?.innerHTML ?? "");
  };
  const keepEditorSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
  const addLink = () => {
    const url = window.prompt("Paste a URL (https://…)");
    if (!url?.trim()) return;
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
      command("createLink", parsed.toString());
    } catch {
      toast.error("Use a valid http:// or https:// URL.");
    }
  };
  const toggleBulletList = () => {
    const selection = window.getSelection();
    const selectionNode = selection?.anchorNode;
    const element = selectionNode instanceof HTMLElement ? selectionNode : selectionNode?.parentElement;
    const currentList = element?.closest("ol, ul");

    if (currentList?.tagName === "OL") {
      const bulletList = document.createElement("ul");
      bulletList.innerHTML = currentList.innerHTML;
      currentList.replaceWith(bulletList);
      setBodyHtml(editorRef.current?.innerHTML ?? "");
      return;
    }

    if (currentList?.tagName === "UL") {
      const paragraphs = document.createDocumentFragment();
      Array.from(currentList.children).forEach((listItem) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = listItem.textContent;
        paragraphs.appendChild(paragraph);
      });
      currentList.replaceWith(paragraphs);
      setBodyHtml(editorRef.current?.innerHTML ?? "");
      return;
    }

    const selectedText = selection?.toString().trim() ?? "";
    if (selectedText) {
      const lines = selectedText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (lines.length > 0 && range) {
        const bulletList = document.createElement("ul");
        lines.forEach((line) => {
          const item = document.createElement("li");
          item.textContent = line;
          bulletList.appendChild(item);
        });
        range.deleteContents();
        range.insertNode(bulletList);
        selection?.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(bulletList);
        selection?.addRange(nextRange);
        setBodyHtml(editorRef.current?.innerHTML ?? "");
        return;
      }
    }

    editorRef.current?.focus();
    document.execCommand("insertUnorderedList");
    setBodyHtml(editorRef.current?.innerHTML ?? "");
  };
  const addFiles = (list: FileList | null) => {
    const next = [...files, ...Array.from(list ?? [])];
    if (next.length + savedAttachments.length > 5 || next.reduce((sum, file) => sum + file.size, 0) + savedAttachments.reduce((sum, file) => sum + file.size, 0) > 7 * 1024 * 1024) return toast.error("Use no more than 5 attachments, 7 MB total.");
    setFiles(next);
  };
  const save = async () => {
    const html = editorRef.current?.innerHTML ?? "";
    if (!subject.trim() || !html.replace(/<[^>]*>/g, "").trim()) return toast.error("Subject and email content are required.");
    try {
      setSaving(true);
      const result = await updateCompensationInfoEmailTemplate({ subject, bodyHtml: html, attachments: files, removeAttachmentIds: removedIds });
      setSavedAttachments(result.data?.template?.attachments ?? []); setRemovedIds([]); setFiles([]); setBodyHtml(html); toast.success("Shared compensation email saved.");
    } catch (error) { console.log(error); toast.error("Could not save the shared email."); } finally { setSaving(false); }
  };
  return <main className={styles.page}><div className={styles.topbar}><div><h1>Info email</h1><p>This single email is sent to every compensation user.</p></div><Button title="Back" type="OUTLINED" onClick={() => void router.push("/compensation")} /></div><div className={styles.layout}><section className={styles.compose}><label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label><div className={styles.editorLabel}>Message</div><div className={styles.toolbar}><button type="button" onMouseDown={keepEditorSelection} onClick={() => command("formatBlock", "h2")}>H</button><button type="button" onMouseDown={keepEditorSelection} onClick={() => command("bold")}><b>B</b></button><button type="button" onMouseDown={keepEditorSelection} onClick={() => command("italic")}><i>I</i></button><button type="button" onMouseDown={keepEditorSelection} onClick={() => command("underline")}><u>U</u></button><button type="button" onMouseDown={keepEditorSelection} onClick={toggleBulletList}>• List</button><button type="button" onMouseDown={keepEditorSelection} onClick={addLink}>Link</button><input aria-label="Text colour" type="color" onChange={(e) => command("foreColor", e.target.value)} /><input aria-label="Highlight colour" type="color" onChange={(e) => command("hiliteColor", e.target.value)} /></div><div ref={editorRef} className={styles.editor} contentEditable suppressContentEditableWarning onInput={(e) => setBodyHtml(e.currentTarget.innerHTML)} /><div className={styles.attachments}><label className={styles.fileButton}>Add attachments<input type="file" multiple onChange={(e) => addFiles(e.target.files)} /></label>{savedAttachments.map((file) => <div className={styles.attachment} key={file.id}><span>{file.fileName}</span><button type="button" onClick={() => { setSavedAttachments((current) => current.filter((item) => item.id !== file.id)); setRemovedIds((current) => [...current, file.id]); }}>Remove</button></div>)}{files.map((file, index) => <div className={styles.attachment} key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</div><div className={styles.actions}><Button title={saving ? "Saving..." : "Save email"} type="BLACK" onClick={save} isDisabled={saving} /></div></section><aside className={styles.preview}><div className={styles.previewTitle}>Preview</div><div className={styles.previewSubject}>{subject}</div><div dangerouslySetInnerHTML={{ __html: bodyHtml }} /></aside></div></main>;
}
