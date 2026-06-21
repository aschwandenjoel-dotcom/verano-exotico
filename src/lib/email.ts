import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
  color_name?: string;
  image?: string;
}

interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  orderNumber: number;
  items: OrderItem[];
  subtotal: number;
}

export async function sendOrderConfirmation({
  to,
  customerName,
  orderNumber,
  items,
  subtotal,
}: SendOrderConfirmationParams) {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;">
          <strong>${item.product_name}</strong>
          ${item.size ? `<br><span style="color:#9E9E9E;font-size:11px;">Grösse: ${item.size}</span>` : ""}
          ${item.color_name ? `<br><span style="color:#9E9E9E;font-size:11px;">Farbe: ${item.color_name}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:center;">
          ${item.quantity}×
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #F0EDE8;font-family:sans-serif;font-size:13px;color:#1A3040;text-align:right;">
          CHF ${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F3E8;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(26,48,64,0.08);">

    <!-- Header -->
    <div style="background:#1A3040;padding:32px 40px;text-align:center;">
      <p style="color:#D4AF37;font-family:sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 8px;">Verano Exotico</p>
      <h1 style="color:#F8F3E8;font-family:sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em;">
        Bestellung bestätigt
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="font-family:sans-serif;font-size:15px;color:#1A3040;margin:0 0 8px;">
        Hallo ${customerName || ""}!
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:rgba(26,48,64,0.6);line-height:1.6;margin:0 0 28px;">
        Danke für deine Bestellung. Wir bereiten alles für dich vor.
      </p>

      <p style="font-family:sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9E9E9E;margin:0 0 16px;">
        Bestellung #${orderNumber}
      </p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;">
        ${itemRows}
      </table>

      <!-- Total -->
      <div style="margin-top:20px;padding-top:16px;border-top:2px solid #1A3040;display:flex;justify-content:space-between;">
        <span style="font-family:sans-serif;font-size:13px;font-weight:700;color:#1A3040;text-transform:uppercase;letter-spacing:0.1em;">Total</span>
        <span style="font-family:sans-serif;font-size:18px;font-weight:900;color:#1A3040;">CHF ${subtotal.toFixed(2)}</span>
      </div>

      <p style="font-family:sans-serif;font-size:12px;color:rgba(26,48,64,0.45);margin-top:28px;line-height:1.6;">
        Du erhältst eine weitere E-Mail sobald deine Bestellung versandt wurde.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F8F3E8;padding:20px 40px;text-align:center;">
      <p style="font-family:sans-serif;font-size:10px;color:rgba(26,48,64,0.4);margin:0;letter-spacing:0.1em;">
        © ${new Date().getFullYear()} Verano Exotico · Golden Days, Timeless Wear
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Bestellung #${orderNumber} bestätigt — Verano Exotico`,
    html,
  });
}
