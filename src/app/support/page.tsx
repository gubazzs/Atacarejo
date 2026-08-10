export const metadata = {
  title: "Suporte — Atacarejo",
};

export default function SupportPage() {
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
      <h1>Suporte — Atacarejo</h1>
      <p>
        O <strong>Atacarejo</strong> transforma sua loja em atacado e varejo ao
        mesmo tempo: você define preços de atacado por produto e uma quantidade
        mínima, e o desconto é aplicado automaticamente no checkout.
      </p>

      <h2>Precisa de ajuda?</h2>
      <p>
        Fale com a gente por e-mail e respondemos o mais rápido possível:
      </p>
      <p>
        <strong>E-mail:</strong>{" "}
        <a href="mailto:suporte@nextcubeinc.com">suporte@nextcubeinc.com</a>
      </p>

      <h2>Dúvidas comuns</h2>
      <ul>
        <li>
          <strong>Como configuro os preços de atacado?</strong> Abra o app no
          painel da sua loja, informe o preço de atacado de cada variante e a
          quantidade mínima, e salve.
        </li>
        <li>
          <strong>O desconto é automático?</strong> Sim. Quando o cliente atinge
          a quantidade mínima, o desconto entra sozinho no checkout, sem cupom.
        </li>
        <li>
          <strong>Produtos sem preço de atacado?</strong> Continuam no valor
          normal — só participam do desconto os itens que você configurar.
        </li>
      </ul>

      <p style={{ marginTop: 32 }}>
        Veja também nossa <a href="/policy">política de privacidade</a>.
      </p>
    </main>
  );
}
