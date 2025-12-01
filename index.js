import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// صفحة فحص تشغيل الخدمة
app.get("/", (req, res) => {
  res.send("Tamara Webhook Running Successfully");
});

// Webhook Endpoint
app.post("/tamara/webhook", async (req, res) => {
  try {
    console.log("Incoming Webhook Body:", req.body);

    const eventType = req.body?.data?.event_type;
    const orderId = req.body?.data?.order_id;

    // نهتم فقط بحدث الموافقة
    if (eventType !== "order_approved") {
      console.log("Event ignored:", eventType);
      return res.status(200).send("Ignored event");
    }

    console.log("Authorising Order:", orderId);

    const TAMARA_SECRET_KEY = process.env.TAMARA_SECRET_KEY;
    const TAMARA_PUBLIC_KEY = process.env.TAMARA_PUBLIC_KEY;

    if (!TAMARA_SECRET_KEY || !TAMARA_PUBLIC_KEY) {
      console.error("Missing Tamara keys in env");
      return res.status(500).send("Missing keys");
    }

    const url = "https://api-sandbox.tamara.co/checkout/authorise";

    const response = await axios.post(
      url,
      { order_id: orderId },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TAMARA_SECRET_KEY}`,
          "x-tamara-public-key": TAMARA_PUBLIC_KEY
        }
      }
    );

    console.log("Authorise Response:", response.data);

    // نجاح
    return res.status(200).send("Authorised");
  } catch (error) {
    console.error("Authorise Error:", error?.response?.data || error.message);
    return res.status(500).send("Error");
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Tamara Webhook Service running on port", PORT);
});
