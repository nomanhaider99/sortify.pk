import { describe, expect, it } from "vitest";
import { getPaymentProvider } from "./payments";

const card = (number: string) => ({ number, expiry: "12/40", cvc: "123", name: "Jane Doe" });

describe("payment providers", () => {
  it("COD is pending at checkout and paid on confirm", async () => {
    const cod = getPaymentProvider("cod");
    expect((await cod.createPayment({ amountCents: 1000, currency: "USD" })).status).toBe(
      "pending",
    );
    expect((await cod.confirm("cod_1")).status).toBe("paid");
  });

  it("4242 succeeds and only stores brand + last4", async () => {
    const r = await getPaymentProvider("card_demo").createPayment({
      amountCents: 1000,
      currency: "USD",
      card: card("4242424242424242"),
    });
    expect(r).toMatchObject({ status: "paid", cardBrand: "visa", cardLast4: "4242" });
    expect(JSON.stringify(r)).not.toContain("4242424242424242");
  });

  it("0002 is declined with a friendly error", async () => {
    const r = await getPaymentProvider("card_demo").createPayment({
      amountCents: 1000,
      currency: "USD",
      card: card("4000000000000002"),
    });
    expect(r.status).toBe("failed");
    expect(r.error).toMatch(/declined/i);
  });

  it("any other number asks for the test card", async () => {
    const r = await getPaymentProvider("card_demo").createPayment({
      amountCents: 1000,
      currency: "USD",
      card: card("5555555555554444"),
    });
    expect(r.status).toBe("failed");
    expect(r.error).toMatch(/4242 4242 4242 4242/);
  });
});
