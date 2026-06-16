"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useCallback } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, ImageIcon, Link as LinkIcon, Heading1, Heading2, Heading3, Undo, Redo, RemoveFormatting } from 'lucide-react';

export function RichTextEditor({ value, onChange }: { value: string; onChange: (content: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(async () => {
    if (!editor) return;
    
    // Create a file input element dynamically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Use our existing upload endpoint
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          editor.chain().focus().setImage({ src: data.url }).run();
        } else {
          alert('Failed to upload image');
        }
      } catch (error) {
        console.error('Upload error', error);
        alert('Error uploading image');
      }
    };
    
    input.click();
  }, [editor]);

  if (!editor) {
    return <div className="h-64 w-full bg-gray-50 border rounded flex items-center justify-center text-gray-400">Loading Editor...</div>;
  }

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 flex-shrink-0 flex items-center justify-center rounded transition-colors ${
        isActive ? 'bg-primary-100 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link">
          <LinkIcon size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Image">
          <ImageIcon size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <RemoveFormatting size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} title="Undo">
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} title="Redo">
          <Redo size={18} />
        </ToolbarButton>
      </div>
      
      <div className="flex-1 bg-white overflow-y-auto cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
