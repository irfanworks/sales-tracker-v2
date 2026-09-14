"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AiMarkdownReport({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) {
  return (
    <div className="ai-report relative">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 text-xl font-bold tracking-tight text-slate-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2.5 mt-6 border-b border-slate-100 pb-1.5 text-lg font-bold tracking-tight text-slate-900 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-base font-semibold text-slate-900 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1.5 mt-4 text-sm font-semibold text-slate-800">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-[14px] leading-relaxed text-slate-700 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5 marker:text-cyan-700">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
          hr: () => <hr className="my-5 border-slate-200" />,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-cyan-300 bg-cyan-50/50 px-3 py-2 text-[14px] text-slate-700">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className?.includes("language-"));
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-xl bg-slate-900 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-slate-100">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-cyan-900">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-2 hover:text-cyan-800"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full border-collapse text-left text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 text-slate-700">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="align-top">{children}</tr>,
          th: ({ children }) => (
            <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2.5 text-[13px] leading-relaxed text-slate-700">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming ? (
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-cyan-600 align-middle" />
      ) : null}
    </div>
  );
}
