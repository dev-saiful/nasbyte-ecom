interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  shippingAddress: string;
}

export async function sendTelegramNotification(
  data: OrderNotificationData,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[DEV] Telegram not configured. Notification skipped.");
    return;
  }

  const itemsList = data.items
    .map(
      (item) =>
        `  • ${item.name} x${item.quantity} — ${item.price.toLocaleString()} BDT`,
    )
    .join("\n");

  const message = [
    `🛒 *New Order* — ${data.orderNumber}`,
    "",
    `👤 *Customer:* ${data.customerName}`,
    `📱 *Phone:* ${data.customerPhone}`,
    "",
    "*Items:*",
    itemsList,
    "",
    `💰 *Total:* ${data.total.toLocaleString()} BDT`,
    "",
    `📍 *Address:* ${data.shippingAddress}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      console.error("Telegram API error:", await response.text());
    }
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}
