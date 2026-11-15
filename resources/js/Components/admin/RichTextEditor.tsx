import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
    Bold,
    Italic,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Minus,
    Undo2,
    Redo2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

/** Tombol toolbar yang mengikuti state editor (aktif/tidak). */
function ToolbarButton({
    onClick,
    active,
    disabled,
    label,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tech-blue ${
                active
                    ? "border-tech-blue/40 bg-tech-blue/10 text-tech-blue"
                    : "border-transparent text-navy/70 hover:border-border-soft hover:bg-light-gray hover:text-navy"
            } disabled:cursor-not-allowed disabled:opacity-40`}
        >
            {children}
        </button>
    );
}

/**
 * Editor konten halaman statis. Admin menulis langsung dalam format tampilan
 * (paragraf, sub-judul, daftar, garis pemisah); markup HTML tetap tersimpan
 * di belakang layar dan dibersihkan di sisi server sebelum masuk database.
 */
export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Level heading dibatasi sesuai struktur halaman publik.
                heading: { levels: [2, 3] },
                codeBlock: false,
                code: false,
            }),
        ],
        content: value || "",
        editorProps: {
            attributes: {
                class: "rich-editor-content min-h-[320px] px-4 py-3 outline-none",
            },
        },
        onUpdate: ({ editor }: { editor: Editor }) => {
            const empty =
                editor.isEmpty ||
                editor.getHTML() === "<p></p>";
            onChange(empty ? "" : editor.getHTML());
        },
    });

    // Sinkron bila nilai di-reset dari luar (mis. form berhasil disimpan ulang).
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-border-soft bg-white focus-within:border-tech-blue/50 focus-within:ring-1 focus-within:ring-tech-blue/30">
            <div className="flex flex-wrap items-center gap-1 border-b border-border-soft bg-light-gray px-2 py-1.5">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    disabled={!editor.can().toggleBold()}
                    label="Tebal"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    disabled={!editor.can().toggleItalic()}
                    label="Miring"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border-soft" aria-hidden="true" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    active={editor.isActive("paragraph")}
                    label="Paragraf"
                >
                    <span className="text-[11px] font-bold">P</span>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive("heading", { level: 2 })}
                    disabled={!editor.can().toggleHeading({ level: 2 })}
                    label="Sub-judul besar"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive("heading", { level: 3 })}
                    disabled={!editor.can().toggleHeading({ level: 3 })}
                    label="Sub-judul kecil"
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border-soft" aria-hidden="true" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive("bulletList")}
                    disabled={!editor.can().toggleBulletList()}
                    label="Daftar berbutir"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive("orderedList")}
                    disabled={!editor.can().toggleOrderedList()}
                    label="Daftar bernomor"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    disabled={!editor.can().setHorizontalRule()}
                    label="Garis pemisah panel"
                >
                    <Minus className="h-4 w-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border-soft" aria-hidden="true" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    label="Urungkan"
                >
                    <Undo2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    label="Ulangi"
                >
                    <Redo2 className="h-4 w-4" />
                </ToolbarButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
