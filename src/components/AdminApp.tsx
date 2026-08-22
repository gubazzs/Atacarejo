"use client";

import { useEffect, useState } from "react";
import { connect, iAmReady } from "@tiendanube/nexo";
import { Layout, Page } from "@nimbus-ds/patterns";
import {
  Box,
  Button,
  Icon,
  Input,
  Pagination,
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

interface ProductImage {
  id: number;
  src: string;
}


interface Product {
  id: number;
  name: { pt?: string; es?: string };
  variants: Variant[];
  images?: ProductImage[];
}

const HEADERS = ["Produto", "Variantes", "Estoque", "Preço", "Atacado"];
const VARIANT_ROW_HEIGHT = 40;
const PER_PAGE = 100;
const SEARCH_DEBOUNCE_MS = 400;

export default function AdminApp() {
  const [conectado, setConectado] = useState(false);
  const [view, setView] = useState<"produtos" | "config">("produtos");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const [produtos, setProdutos] = useState<Product[]>([]);
  const [precos, setPrecos] = useState<Record<number, string>>({});

  // Paginação
  const [pagina, setPagina] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageCount = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // Busca (server-side, vai como `q` pra Nuvemshop)
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  // Só libera a tela depois de passar no guard
  const [liberado, setLiberado] = useState(false);

  // Guard: o app só roda embutido no admin da Nuvemshop.
  useEffect(() => {
    const DESTINO = "https://nextcubeinc.com";

    // 1) Não está em iframe -> abriram a URL diretamente
    if (window.self === window.top) {
      window.location.replace(DESTINO);
      return;
    }

    setLiberado(true);
  }, []);

  // Conecta ao admin (Nexo)
  useEffect(() => {
    connect(nexo).then(() => {
      setConectado(true);
      iAmReady(nexo);
    });
  }, []);

  // Espelha as opções de frete/pagamento no Supabase
  useEffect(() => {
    if (!conectado) return;

    api
      .post("/api/sync-options")
      .then((r) => console.log("[sync-options]", r.data))
      .catch((e) => console.error("[sync-options] falhou:", e));
  }, [conectado]);

  // Debounce da busca -> reseta pra página 1 a cada nova busca
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaDebounced(busca.trim());
      setPagina(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [busca]);

  // Busca produtos da página atual + preços salvos das variantes dessa página
  useEffect(() => {
    if (!conectado) return;

    setCarregando(true);

    const params: Record<string, string | number> = { page: pagina };
    if (buscaDebounced) params.q = buscaDebounced;

    api
      .get("/api/products", { params })
      .then((prod) => {
        const lista: Product[] = prod.data;
        setProdutos(lista);
        setTotalCount(Number(prod.headers["x-total-count"] ?? lista.length));

        const variantIds = lista.flatMap((p) => p.variants.map((v) => v.id));

        if (variantIds.length === 0) {
          setPrecos({});
          return;
        }

        return api
          .get("/api/wholesale", {
            params: { variant_ids: variantIds.join(",") },
          })
          .then((whole) => {
            const mapa: Record<number, string> = {};

            whole.data.forEach(
              (i: { variant_id: number; price_atc: string }) => {
                mapa[i.variant_id] =
                  Number(i.price_atc) > 0 ? String(i.price_atc) : "";
              }
            );

            setPrecos(mapa);
          });
      })
      .catch((e) => {
        console.error("Falha ao carregar:", e);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [conectado, pagina, buscaDebounced]);

  // Salva todos os preços (só os da página atual, que é o que está carregado)
  const salvar = async () => {
    setSalvando(true);
    setSalvo(false);

    const items = produtos.flatMap((p) =>
      p.variants.map((v) => ({
        product_id: p.id,
        variant_id: v.id,
        price_atc: precos[v.id]?.trim()
          ? precos[v.id]
          : "0",
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

  // Atualiza preço de uma variante
  const setPreco = (variantId: number, valor: string) => {
    setPrecos((prev) => ({
      ...prev,
      [variantId]: valor,
    }));

    setSalvo(false);
  };

  // Pega o valor da primeira variante e replica para todas
  const replicarPreco = (produto: Product) => {
    const primeira = produto.variants[0];

    if (!primeira) return;

    const valor = precos[primeira.id] ?? "";

    setPrecos((prev) => {
      const next = { ...prev };

      produto.variants.forEach((v) => {
        next[v.id] = valor;
      });

      return next;
    });

    setSalvo(false);
  };

  // Enquanto o guard não liberar
  if (!liberado) {
    return null;
  }

  // Enquanto conecta ao Nexo
  if (!conectado) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Text>Conectando...</Text>
      </Box>
    );
  }

  // Configurações
  if (view === "config") {
    return (
      <ConfigView
        onVoltar={() => setView("produtos")}
      />
    );
  }

  const THUMB_SIZE = 128

  return (
    <Page maxWidth="auto">
      <Page.Header
        title="Atacarejo"
        buttonStack={
          <Box
            display="flex"
            flexDirection="row"
            gap="2"
          >
            <Button
              onClick={() => setView("config")}
            >
              <Icon
                source={<CogIcon />}
                color="currentColor"
              />
              Configurações
            </Button>

            <Button
              appearance="primary"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <Spinner
                  color="currentColor"
                  size="small"
                />
              ) : (
                <Icon
                  source={<DisketteIcon />}
                  color="currentColor"
                />
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
              <Box
                display="flex"
                justifyContent="center"
                padding="4"
              >
                <Spinner />
              </Box>
            ) : (
              <>
                {salvo && (
                  <Box paddingBottom="2">
                    <Text color="success-textLow">
                      Salvo!
                    </Text>
                  </Box>
                )}

                {/* Busca */}
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                />

                <Table>
                  <Table.Head>
                    <Table.Row>
                      {HEADERS.map((h) => (
                        <Table.Cell key={h}>
                          {h}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  </Table.Head>

                  <Table.Body>
                    {produtos.map((produto) => (
                      <Table.Row key={produto.id}>
                        {/* Produto */}
                        <Table.Cell>
                          <Box display="flex" flexDirection="row" gap="2" alignItems="flex-start">
                            {produto.images?.[0]?.src ? (
                              <img
                                src={produto.images[0].src}
                                alt={produto.name?.pt ?? produto.name?.es ?? ""}
                                width={THUMB_SIZE}
                                height={THUMB_SIZE}
                                style={{ objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                              />
                            ) : (
                              <Box
                                width={`${THUMB_SIZE}px`}
                                height={`${THUMB_SIZE}px`}
                                backgroundColor="neutral-surface"
                                borderRadius="3"
                                flexShrink="0"
                              >
                                <img
                                src={'NoImage.jpg'}
                                alt={produto.name?.pt ?? produto.name?.es ?? ""}
                                width={THUMB_SIZE}
                                height={THUMB_SIZE}
                                style={{ objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                              />
                              </Box>

                            )}

                            <Box display="flex" flexDirection="column">
                              {produto.variants.map((v, idx) => (
                                <Box key={v.id} height={`${VARIANT_ROW_HEIGHT}px`} display="flex" alignItems="center">
                                  {idx === 0 ? produto.name?.pt ?? produto.name?.es ?? "(sem nome)" : ""}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Table.Cell>

                        {/* Variantes */}
                        <Table.Cell>
                          <Box
                            display="flex"
                            flexDirection="column"
                          >
                            {produto.variants.map(
                              (v) => (
                                <Box
                                  key={v.id}
                                  height={`${VARIANT_ROW_HEIGHT}px`}
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Text>
                                    {v.values
                                      .map(
                                        (val) =>
                                          val.pt ??
                                          val.es
                                      )
                                      .join(" / ") ||
                                      v.sku ||
                                      `#${v.id}`}
                                  </Text>
                                </Box>
                              )
                            )}
                          </Box>
                        </Table.Cell>

                        {/* Estoque */}
                        <Table.Cell>
                          <Box
                            display="flex"
                            flexDirection="column"
                          >
                            {produto.variants.map(
                              (v) => (
                                <Box
                                  key={v.id}
                                  height={`${VARIANT_ROW_HEIGHT}px`}
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Text>
                                    {v.stock ?? "∞"}
                                  </Text>
                                </Box>
                              )
                            )}
                          </Box>
                        </Table.Cell>

                        {/* Preço */}
                        <Table.Cell>
                          <Box
                            display="flex"
                            flexDirection="column"
                          >
                            {produto.variants.map(
                              (v) => (
                                <Box
                                  key={v.id}
                                  height={`${VARIANT_ROW_HEIGHT}px`}
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Text>
                                    R$ {v.price}
                                  </Text>
                                </Box>
                              )
                            )}
                          </Box>
                        </Table.Cell>

                        {/* Atacado */}
                        <Table.Cell>
                          <Box
                            display="flex"
                            flexDirection="column"
                          >
                            {produto.variants.map(
                              (v, idx) => (
                                <Box
                                  key={v.id}
                                  height={`${VARIANT_ROW_HEIGHT}px`}
                                  display="flex"
                                  alignItems="center"
                                >
                                  <Input
                                    placeholder="R$"
                                    value={
                                      precos[v.id] ?? ""
                                    }
                                    onChange={(e) =>
                                      setPreco(
                                        v.id,
                                        e.target.value
                                      )
                                    }
                                  />

                                  {idx === 0 &&
                                    produto.variants.length >
                                      1 && (
                                      <Box marginLeft="2">
                                        <Button
                                          onClick={() =>
                                            replicarPreco(
                                              produto
                                            )
                                          }
                                          title="Aplicar este valor a todas as variantes"
                                        >
                                          Todos
                                        </Button>
                                      </Box>
                                    )}
                                </Box>
                              )
                            )}
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>

                {pageCount > 1 && (
                  <Box
                    display="flex"
                    justifyContent="center"
                    paddingTop="4"
                  >
                    <Pagination
                      activePage={pagina}
                      pageCount={pageCount}
                      onPageChange={(page) => setPagina(page)}
                    />
                  </Box>
                )}
              </>
            )}
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
}