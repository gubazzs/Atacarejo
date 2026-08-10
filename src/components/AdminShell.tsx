"use client";

import { ErrorBoundary } from "@tiendanube/nexo";
import nexo from "@/components/NexoClient";
import AdminApp from "@/components/AdminApp";

// Envolve o app no ErrorBoundary do Nexo (obrigatório pra publicar).
// Se algo quebrar no render, ele mostra um fallback e reporta o erro ao admin,
// em vez de deixar uma tela branca dentro do painel do lojista.
export default function AdminShell() {
  return (
    <ErrorBoundary nexo={nexo}>
      <AdminApp />
    </ErrorBoundary>
  );
}
