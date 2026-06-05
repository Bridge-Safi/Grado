import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

export function MarkdownRenderer({ content }: { content: string }) {
  // Simple renderer since we can't reliably install react-markdown
  
  const parseBlocks = (text: string) => {
    const blocks = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        blocks.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      blocks.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      blocks.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    return blocks;
  };

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return <CodeBlock key={i} language={block.language} code={block.content} />;
        }
        
        // Very basic inline formatting
        const formattedText = block.content
          .split('\n').map((line, j) => (
            <React.Fragment key={j}>
              {line}
              {j < block.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ));
          
        return <div key={i}>{formattedText}</div>;
      })}
    </div>
  );
}

function CodeBlock({ language, code }: { language?: string, code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md overflow-hidden bg-[#0D0D12] border border-border my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111118] border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">{language || 'code'}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <div className="p-3 overflow-x-auto text-xs font-mono text-[#E8E8F0]">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
}
