"use client";

import { useEffect, useState } from "react";
import { Layout, Page } from "@nimbus-ds/patterns";
import { Box, Button, Card, Input, Label, Spinner, Text } from "@nimbus-ds/components";
import { api } from "@/lib/api";
import { navigateHeader } from "@tiendanube/nexo";
import nexo from "@/components/NexoClient";

export default function ConfigView({ onVoltar }: { onVoltar: () => void }) {
  const [min, setMin] = useState("3");
  const [carregando, setCarregando] = useState(true);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    api
      .get("/api/config")
      .then((r) => setMin(String(r.data.min_quantity)))
      .catch((e) => console.error("Falha ao carregar config:", e))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
      navigateHeader(nexo, { goTo: '/', text: 'Voltar ao Atacado' });
 }, []);

  const salvar = async () => {
    try {
      await api.post("/api/config", { min_quantity: Number(min) });
      setSalvo(true);
    } catch (e) {
      console.error("Falha ao salvar config:", e);
    }
  };

  return (
    <Page maxWidth="800px">
      <Page.Header
        title="Configurações"
      />
      <Page.Body>
        <Layout columns="1">
          <Layout.Section>
            <Card>
              <Card.Header title="Regra de atacado" />
              <Card.Body>
                {carregando ? (
                  <Box display="flex" justifyContent="center" padding="4">
                    <Spinner />
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="column" gap="4">
                    <Text>
                      A partir de quantas unidades no carrinho o desconto de atacado é
                      aplicado.
                    </Text>
                    <Box display="flex" flexDirection="column" gap="2">
                      <Label htmlFor="min">Quantidade mínima (unidades)</Label>
                      <Input
                        id="min"
                        type="number"
                        value={min}
                        onChange={(e) => {
                          setMin(e.target.value);
                          setSalvo(false);
                        }}
                      />
                    </Box>
                    <Box display="flex" gap="2" alignItems="center">
                      <Button appearance="primary" onClick={salvar}>
                        Salvar
                      </Button>
                      {salvo && <Text color="success-textLow">Salvo!</Text>}
                    </Box>
                  </Box>
                )}
              </Card.Body>
            </Card>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
}
