const express = require("express");

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;


/* =========================
   CHECK BOT TOKEN
========================= */

if (!BOT_TOKEN) {

    console.error(
        "BOT_TOKEN не задан"
    );

    process.exit(1);

}


/* =========================
   CORS
========================= */

app.use((req, res, next) => {

    res.header(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,OPTIONS"
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {

        return res.sendStatus(204);

    }

    next();

});


/* =========================
   JSON
========================= */

app.use(
    express.json()
);


/* =========================
   HEALTH CHECK
========================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            ok: true,

            service:
                "Adopt Rent",

            telegramStars:
                true

        });

    }
);


/* =========================
   ROOT
========================= */

app.get(
    "/",
    (req, res) => {

        res.json({

            ok: true,

            service:
                "Adopt Rent",

            message:
                "Backend работает"

        });

    }
);


/* =========================
   CREATE TELEGRAM STARS INVOICE
========================= */

app.post(
    "/api/create-invoice",
    async (req, res) => {

        try {

            const {

                applicationId,

                amount,

                price,

                petName,

                variant,

                telegramUserId

            } = req.body;


            /* =========================
               APPLICATION ID
            ========================= */

            if (!applicationId) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "applicationId отсутствует"

                });

            }


            /* =========================
               PRICE
            ========================= */

            const finalAmount =
                Number.isInteger(
                    Number(amount)
                )
                    ? Number(amount)
                    : Number(price);


            if (
                !Number.isInteger(
                    finalAmount
                ) ||
                finalAmount < 1 ||
                finalAmount > 2000
            ) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "Некорректная сумма Stars"

                });

            }


            /* =========================
               PET DATA
            ========================= */

            const safePetName =
                String(
                    petName ||
                    "Питомец"
                ).slice(
                    0,
                    100
                );


            const safeVariant =
                String(
                    variant ||
                    "Normal"
                ).slice(
                    0,
                    30
                );


            /* =========================
               PAYMENT PAYLOAD
            ========================= */

            const payload =
                JSON.stringify({

                    applicationId:
                        String(
                            applicationId
                        ),

                    telegramUserId:
                        telegramUserId
                            ? String(
                                telegramUserId
                            )
                            : null

                });


            /* =========================
               TELEGRAM API
            ========================= */

            const telegramResponse =
                await fetch(

                    `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                title:
                                    `${safePetName} ${safeVariant}`,

                                description:
                                    `Аренда питомца ${safePetName} (${safeVariant}) на 24 часа`,

                                payload:
                                    payload,

                                currency:
                                    "XTR",

                                prices: [

                                    {

                                        label:
                                            "Аренда питомца",

                                        amount:
                                            finalAmount

                                    }

                                ]

                            })

                    }

                );


            /* =========================
               TELEGRAM RESPONSE
            ========================= */

            const telegramData =
                await telegramResponse.json();


            console.log(
                "Telegram response:",
                JSON.stringify(
                    telegramData
                )
            );


            /* =========================
               TELEGRAM ERROR
            ========================= */

            if (
                !telegramResponse.ok ||
                !telegramData.ok
            ) {

                return res.status(500).json({

                    ok: false,

                    error:
                        telegramData.description ||
                        "Telegram не смог создать Invoice"

                });

            }


            /* =========================
               SUCCESS
            ========================= */

            return res.json({

                ok: true,

                invoiceUrl:
                    telegramData.result

            });

        }


        catch (error) {

            console.error(
                "CREATE INVOICE ERROR:",
                error
            );


            return res.status(500).json({

                ok: false,

                error:
                    "Ошибка сервера при создании оплаты"

            });

        }

    }
);


/* =========================
   START SERVER
========================= */

const PORT =
    process.env.PORT ||
    3000;


app.listen(

    PORT,

    "0.0.0.0",

    () => {

        console.log(

            `Adopt Rent server started on port ${PORT}`

        );

    }

);
