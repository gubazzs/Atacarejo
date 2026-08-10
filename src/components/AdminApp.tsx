"use client";

import { useEffect, useState } from "react";
import { connect, iAmReady } from "@tiendanube/nexo";
import { Layout, Page } from "@nimbus-ds/patterns";
import {
  Box,
  Button,
  Card,
  Icon,
  Input,
  Spinner,
  Table,
  Text,
} from "@nimbus-ds/components";
import { DisketteIcon, CogIcon } from "@nimbus-ds/icons";
import nexo from "@/components/NexoClient";
import { api } from "@/lib/api";
import ConfigView from "@/components/ConfigView";

interface Variant {
  id: number;
  price: string;
  sku: string | null;
  stock: number | null;
  values: { pt?: string; es?: string }[];
}
interface Product {
  id: number;
  name: { pt?: string; es?: string };
  variants: Variant[];
}

const HEADERS = ["Produto", "Variantes", "Estoque", "Preço", "Atacado"];

export default function AdminApp() {
  const [conectado, setConectado] = useState(false);
  const [view, setView] = useState<"produtos" | "config">("produtos");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [precos, setPrecos] = useState<Record<number, string>>({});
  // só libera a tela depois de passar no guard (iframe + domínio Nuvemshop)
  const [liberado, setLiberado] = useState(false);

  // guard: o app só roda embutido no admin da Nuvemshop.
  // fora do iframe OU embutido por um domínio que não é Nuvemshop -> redireciona.
  useEffect(() => {
    const DESTINO = "https://nextcubeinc.com";
    const DOMINIOS_OK = [
      "tiendanube.com",
      "nuvemshop.com.br",
      "nuvemshop.com",
      "lojavirtualnuvem.com.br",
    ];

    // 1) não está em iframe -> abriram a URL direto
    if (window.self === window.top) {
      window.location.replace(DESTINO);
      return;
    }

    // 2) domínio do pai (quando dá pra saber): se claramente NÃO é Nuvemshop, redireciona.
    //    ancestorOrigins é Chromium; document.referrer é o fallback.
    const ancestor =
      (window.location as any).ancestorOrigins?.[0] || document.referrer;
    if (ancestor) {
      try {
        const host = new URL(ancestor).hostname;
        const ok = DOMINIOS_OK.some((d) => host === d || host.endsWith("." + d));
        if (!ok) {
          window.location.replace(DESTINO);
          return;
        }
      } catch {
        // se não der pra parsear, não bloqueia (o JWT do Nexo segura os dados)
      }
    }

    setLiberado(true);
  }, []);

  // conecta ao admin (Nexo)
  useEffect(() => {
    connect(nexo).then(() => {
      setConectado(true);
      iAmReady(nexo);
    });
  }, []);

  // busca produtos + preços salvos
  useEffect(() => {
    if (!conectado) return;
    Promise.all([api.get("/api/products"), api.get("/api/wholesale")])
      .then(([prod, whole]) => {
        setProdutos(prod.data);
        const mapa: Record<number, string> = {};
        whole.data.forEach((i: { variant_id: number; price_atc: string }) => {
          mapa[i.variant_id] = Number(i.price_atc) > 0 ? String(i.price_atc) : "";
        });
        setPrecos(mapa);
      })
      .catch((e) => console.error("Falha ao carregar:", e))
      .finally(() => setCarregando(false));
  }, [conectado]);

  const salvar = async () => {
    setSalvando(true);
    setSalvo(false);
    const items = produtos.flatMap((p) =>
      p.variants.map((v) => ({
        product_id: p.id,
        variant_id: v.id,
        price_atc: precos[v.id]?.trim() ? precos[v.id] : "0",
      }))
    );
    try {
      await api.post("/api/wholesale", { items });
      setSalvo(true);
    } catch (e) {
      console.error("Falha ao salvar:", e);
    } finally {
      setSalvando(false);
    }
  };

  const setPreco = (variantId: number, valor: string) => {
    setPrecos((prev) => ({ ...prev, [variantId]: valor }));
    setSalvo(false);
  };

  // enquanto o guard não liberar (ou está redirecionando), não mostra nada
  if (!liberado) {
    return null;
  }

  if (!conectado) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Conectando...</Text>
      </Box>
    );
  }

  // "roteamento" da SPA: troca de view por estado
  if (view === "config") {
    return <ConfigView onVoltar={() => setView("produtos")} />;
  }

  return (
    <Page maxWidth="auto">
      <Page.Header
        title="Atacarejo"
        buttonStack={
          <Box display="flex" flexDirection={'row'} gap={'2'}>
            <Button onClick={() => setView("config")}>
              <Icon source={<CogIcon />} color="currentColor" />
              Configurações
            </Button>
            <Button appearance="primary" onClick={salvar} disabled={salvando}>
            {salvando ? (
              <Spinner color="currentColor" size="small" />
            ) : (
              <Icon source={<DisketteIcon />} color="currentColor" />
            )}
            Salvar
          </Button>
          </Box>
        }
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>
            {carregando ? (
              <Box display="flex" justifyContent="center" padding="4">
                <Spinner />
              </Box>
            ) : (
              <>
                {salvo && (
                  <Box paddingBottom="2">
                    <Text color="success-textLow">Salvo!</Text>
                  </Box>
                )}
                <Table>
                  <Table.Head>
                    <Table.Row>
                      {HEADERS.map((h) => (
                        <Table.Cell key={h}>{h}</Table.Cell>
                      ))}
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {produtos.map((produto) => (
                      <Table.Row key={produto.id}>
                        <Table.Cell>
                          {produto.name?.pt ?? produto.name?.es ?? "(sem nome)"}
                        </Table.Cell>

                        <Table.Cell>
                          <Box display="flex" flexDirection="column" gap="8">
                            {produto.variants.map((v) => (
                              <Text key={v.id}>
                                {v.values.map((val) => val.pt ?? val.es).join(" / ") ||
                                  v.sku ||
                                  `#${v.id}`}
                              </Text>
                            ))}
                          </Box>
                        </Table.Cell>

                        <Table.Cell>
                          <Box display="flex" flexDirection="column" gap="9">
                            {produto.variants.map((v) => (
                              <Text key={v.id}>{v.stock ?? "∞"}</Text>
                            ))}
                          </Box>
                        </Table.Cell>

                        <Table.Cell>
                          <Box display="flex" flexDirection="column" gap="8">
                            {produto.variants.map((v) => (
                              <Text key={v.id}>R$ {v.price}</Text>
                            ))}
                          </Box>
                        </Table.Cell>

                        <Table.Cell>
                          <Box display="flex" flexDirection="column" gap="2">
                            {produto.variants.map((v) => (
                              <Input
                                key={v.id}
                                placeholder="R$"
                                value={precos[v.id] ?? ""}
                                onChange={(e) => setPreco(v.id, e.target.value)}
                              />
                            ))}
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </>
            )}
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
}
