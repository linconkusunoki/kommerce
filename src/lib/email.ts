type OrderItem = {
  product_name: string;
  variant_size: string;
  variant_color: string;
  quantity: number;
  price: number;
  total: number;
};

type Order = {
  order_number: string;
  email: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  total: number;
};

export async function sendOrderConfirmation(order: Order, items: OrderItem[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name} (${item.variant_size}/${item.variant_color})</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">Order Confirmed!</h1>
      <p>Hi ${order.name}, thank you for your order.</p>
      <p><strong>Order Number:</strong> ${order.order_number}</p>

      <h2 style="color: #111; margin-top: 24px;">Order Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Order Total</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <h2 style="color: #111; margin-top: 24px;">Shipping Address</h2>
      <p>${order.name}<br>${order.address}<br>${order.city}, ${order.postal_code}${order.country ? "<br>" + order.country : ""}</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kommerce <orders@kommerce.store>",
        to: order.email,
        subject: `Order Confirmed — ${order.order_number}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Email send failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Email send error:", err);
  }
}
