import nexo from "@tiendanube/nexo";

export default nexo.create({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  log: true,
});