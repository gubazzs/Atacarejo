export const metadata = {
  title: "Política de Privacidade — Atacarejo",
};

export default function PolicyPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
        color: "#1a1a1a",
      }}
    >
      <h1>Política de Privacidade — Atacarejo</h1>
      <p>
        Esta política descreve como o aplicativo <strong>Atacarejo</strong> trata
        os dados ao ser instalado em uma loja Nuvemshop.
      </p>

      <h2>Quais dados coletamos</h2>
      <p>O Atacarejo coleta e armazena o mínimo necessário para funcionar:</p>
      <ul>
        <li>Identificador da loja (store id) e o token de acesso da instalação;</li>
        <li>Identificadores de produtos e variantes;</li>
        <li>Os preços de atacado e a quantidade mínima configurados pelo lojista.</li>
      </ul>

      <h2>Dados que NÃO coletamos</h2>
      <p>
        O aplicativo <strong>não coleta, não armazena e não processa dados
        pessoais de consumidores</strong> (nome, e-mail, telefone, pedidos ou
        endereços). Toda a lógica de desconto usa apenas os dados do carrinho
        enviados pela Nuvemshop no momento da compra, sem persistência.
      </p>

      <h2>Como os dados são armazenados</h2>
      <p>
        Os dados da loja são guardados de forma segura em banco de dados com
        acesso restrito ao nosso backend. O token de acesso nunca é exposto
        publicamente.
      </p>

      <h2>Exclusão de dados</h2>
      <p>
        Ao desinstalar o aplicativo, todos os dados da loja são removidos
        automaticamente. Também respondemos aos webhooks de LGPD da Nuvemshop
        (<em>store/redact</em>, <em>customers/redact</em> e{" "}
        <em>customers/data_request</em>) para atender solicitações de exclusão e
        de relatório de dados.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre privacidade? Fale com a gente pela página de{" "}
        <a href="/support">suporte</a>.
      </p>
    </main>
  );
}
