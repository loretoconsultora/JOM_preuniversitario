"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon } from "lucide-react";

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder,
  minHeightClass = "min-h-[8rem]",
  onChange,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  minHeightClass?: string;
  onChange?: (html: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        code: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: `rich-editor-content ${minHeightClass} rounded-b-xl px-4 py-3 text-sm focus:outline-none`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      if (inputRef.current) inputRef.current.value = html;
      onChange?.(html);
    },
  });

  function toggleLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link (deja vacío para quitarlo):", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const btnClass = (active: boolean) =>
    `rounded-lg p-1.5 transition-colors ${
      active ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "text-fg/70 hover:bg-black/5 dark:hover:bg-white/10"
    }`;

  return (
    <div className="glass overflow-hidden rounded-xl">
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
      {editor && (
        <div className="flex items-center gap-0.5 border-b border-black/5 px-2 py-1.5 dark:border-white/10">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Negritas"
            className={btnClass(editor.isActive("bold"))}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Cursivas"
            className={btnClass(editor.isActive("italic"))}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Subrayado"
            className={btnClass(editor.isActive("underline"))}
          >
            <UnderlineIcon size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/15" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Lista con viñetas"
            className={btnClass(editor.isActive("bulletList"))}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Lista numerada"
            className={btnClass(editor.isActive("orderedList"))}
          >
            <ListOrdered size={14} />
          </button>
          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/15" />
          <button type="button" onClick={toggleLink} aria-label="Link" className={btnClass(editor.isActive("link"))}>
            <LinkIcon size={14} />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
