"use client";

import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { ENGINE_TYPE_DEFINITIONS } from "../../src/engineTypes";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  // Configures Monaco options once it mounts in the DOM
  const handleEditorWillMount = (monaco: Monaco) => {
    // Inject custom API definitions into JavaScript auto-completion
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      ENGINE_TYPE_DEFINITIONS,
      "ts:filename/engine.d.ts"
    );

    // Enable strict type checking inside the editor
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });
  };

  const handleEditorDidMount: OnMount = (editor) => {
    // Focus editor automatically
    editor.focus();
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || "")}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Courier New', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true, // Auto-resizes when split panel resizes
          tabSize: 2,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
}