import { useState } from 'react';

interface CodeDisplayProps {
  code: string;
  filename: string;
}

export default function CodeDisplay({ code, filename }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 text-center">
      <p className="text-gray-600 mb-2 text-sm">
        קוד הורדה עבור <span className="font-medium">{filename}</span>
      </p>
      <div className="code-display flex items-center justify-center gap-2 mb-4">
        <div className="flex gap-2">
          {code.split('').map((digit, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center w-12 h-14 text-2xl font-bold bg-gray-100 rounded-lg border border-gray-200 text-gray-800"
            >
              {digit}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className={`
          px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
          ${copied
            ? 'bg-success text-white'
            : 'bg-primary text-white hover:bg-primary-hover'
          }
        `}
      >
        {copied ? 'הועתק!' : 'העתק קוד'}
      </button>
    </div>
  );
}
