export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        return res.status(500).json({
            error: "BOT_TOKEN не настроен в Vercel"
        });
    }

    const { petName, price } = req.body || {};

    if (!petName) {
        return res.status(400).json({
            error: "Не указано название пета"
        });
    }

    const numericPrice = parseInt(price, 10);

    if (
        !Number.isInteger(numericPrice) ||
        numericPrice <= 0
    ) {
        return res.status(400).json({
            error: "Некорректная цена"
        });
    }

    try {
        const telegramUrl =
            `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

        const response = await fetch(
            telegramUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: `Аренда: ${petName}`,

                    description:
                        `Аренда питомца ${petName} на 24 часа.`,

                    payload:
                        `rent_${Date.now()}`,

                    currency: "XTR",

                    prices: [
                        {
                            label: `Аренда ${petName}`,
                            amount: numericPrice
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!data.ok) {
            return res.status(500).json({
                error:
                    data.description ||
                    "Telegram не создал Invoice"
            });
        }

        return res.status(200).json({
            ok: true,
            invoice_link: data.result,
            price: numericPrice
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error:
                error.message ||
                "Ошибка сервера"
        });
    }
}
