"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [protocol, setProtocol] = useState("");

  useEffect(() => {
    void fetch("/api/monitoring", {
      body: JSON.stringify({ digest: error.digest, message: error.message, path: window.location.pathname }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => setProtocol(data.protocol || ""))
      .catch(() => undefined);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <div className="max-w-md rounded-lg border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              <AlertTriangle size={24} />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Nao foi possivel concluir esta operacao</h1>
            <p className="mt-2 text-sm text-slate-600">O problema foi isolado. Tente novamente e, caso persista, informe o protocolo ao suporte.</p>
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-left text-xs font-medium text-rose-700">
              Erro real: {error.message || "Erro inesperado"}{error.digest ? ` | Digest: ${error.digest}` : ""}
            </p>
            {protocol ? <p className="mt-3 font-mono text-xs font-semibold text-slate-500">{protocol}</p> : null}
            <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={reset} type="button">
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
