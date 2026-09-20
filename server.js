const express = require("express");

const app = express();

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN не задан");
    process.exit(1);
}

app.post("/create-invoice", async (req, res) => {

    try {

        const {
            applicationId,
            amount,
            petName,
            variant,
            telegramUserId
        } = req.body;

        if (!applicationId) {
            return res.status(400).json({
                error: "Не указан applicationId"
            });
        }

        if (!telegramUserId) {
            return res.status(400).json({
                error: "Не указан Telegram user ID"
            });
        }

        const stars = Number(amount);

        if (!Number.isInteger(stars) || stars <= 0) {
            return res.status(400).json({
                error: "Неверная цена"
            });
        }

        const payload =
            `rent:${applicationId}:${telegramUserId}:${stars}`;

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    title:
                        `Аренда ${petName || "питомца"}`,

                    description:
                        `Аренда ${petName || "питомца"} ` +
                        `${variant || ""} на 24 часа`,

                    payload: payload,

                    currency: "XTR",

                    prices: [
                        {
                            label: "Аренда",
                            amount: stars
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
                    "Telegram не создал счёт"
            });

        }

        return res.json({
            invoiceUrl: data.result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Ошибка создания счёта"
        });

    }

});

app.get("/", (req, res) => {

    res.send(
        "Adopt Rent Telegram Stars backend работает"
    );

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Adopt Rent backend запущен на порту ${PORT}`
    );

});
