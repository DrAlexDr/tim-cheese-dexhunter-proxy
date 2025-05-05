
// $CHEESE Buy Webhook Bot (Only newest buy every poll)

const axios = require("axios");
const axiosRetry = require("axios-retry").default;

axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
require("dns").setDefaultResultOrder("ipv4first");

const webhookUrl = process.env.DISCORD_WEBHOOK_URL || 
  "https://discord.com/api/webhooks/1366777074240716820/4AgVndMunCqMlJBcc0i5Y4sZxVXkQGXzzq8BNraE3kacoFhqODhGtllVAnNgUJkk_mJA";
let lastSeenTxHash = null;
let initialized = false;

async function fetchCheeseTrades() {
  console.log("🔍 Fetching trades from DexHunter...");

  try {
    const response = await axios.post(
      "https://api-us.dexhunterv3.app/swap/ordersByPair",
      {
        page: 0,
        perPage: 1,
        filters: [
          {
            filterType: "STATUS",
            values: ["COMPLETE"],
          },
        ],
        tokenId1: "",
        tokenId2:
          "89f2cdc13b0ce1d55714f6940cfa64353e0cfdccda1c60c3266b6cf554494d20434845455345",
        orderSorts: "STARTTIME",
        sortDirection: "DESC",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.dexhunter.io",
          Referer: "https://app.dexhunter.io",
        },
      }
    );

    const trades = response.data;
    if (!Array.isArray(trades) || trades.length === 0) {
      console.log("⚠️ No trades found");
      return;
    }

    const trade = trades[0];
    const isBuy =
      trade.token_id_in ===
        "000000000000000000000000000000000000000000000000000000006c6f76656c616365" &&
      trade.token_id_out ===
        "89f2cdc13b0ce1d55714f6940cfa64353e0cfdccda1c60c3266b6cf554494d20434845455345";

    if (!isBuy || !trade.tx_hash) return;

    if (!initialized) {
      lastSeenTxHash = trade.tx_hash;
      initialized = true;
      console.log("🕓 Initialized tracking from TX:", lastSeenTxHash);
      return;
    }

    if (trade.tx_hash === lastSeenTxHash) return;

    const buyer = trade.user_address || "Unknown";
    const adaUsed = trade.amount_in;
    const tx = trade.tx_hash;
    const timestamp = Math.floor(
      new Date(trade.submission_time).getTime() / 1000
    );

    const adaFloat = parseFloat(adaUsed);
    if (adaFloat >= 500) {
      const bigBuyPayload = {
        username: "🧀 TIM CHEESE",
        embeds: [
          {
            title: "🚨🧀 BIG $CHEESE BUY!",
            description: `👤 **Buyer:** \`${buyer.slice(0, 15)}...\`
💸 **ADA Used:** \`${adaUsed} ₳\`
🔗 [View TX](https://cardanoscan.io/transaction/${tx})
🕒 <t:${timestamp}:R>`,
            color: 0xff0000,
            image: {
              url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWh5bXFwdWppaGt3eGc0amhreGhubzk2dHFxcmhhbmsyZmwxNnFpYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GwCBRdRn3FB6DPSnoE/giphy.gif",
            },
            footer: {
              text: "🧀 Tim Cheese Syndicate — Big Buyer Detected",
            },
          },
        ],
      };
      const bigBuyWebhook = "https://discord.com/api/webhooks/1368726831813099590/lA8C8MsmRxmbgX_Nu9sV-Usd5Ftfhqr5faHkHPy6xVNnSnn0rQO9dVKphC_ftOUcrGyV";
      await axios.post(bigBuyWebhook, bigBuyPayload);
    }

    const payload = {
      username: "🧀 TIM CHEESE",
      embeds: [
        {
          title: "🧀💰 $CHEESE Buy Detected!",
          description: `👤 **Buyer:** \`${buyer.slice(0, 15)}...\`
💸 **ADA Used:** \`${adaUsed} ₳\`
🔗 [View TX](https://cardanoscan.io/transaction/${tx})
🕒 <t:${timestamp}:R>`,
          color: 0xffcc00,
          image: {
            url: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcW1wNzZlaXN0ZmsxcmlpY2JnNTlnNzhqd2lrNDltMTR4dmsyc2l5dSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KY25pBl12eViX8tzdd/giphy.gif",
          },
          footer: {
            text: "🧀 Tim Cheese Syndicate",
          },
        },
      ],
    };

    await axios.post(webhookUrl, payload);
    console.log(`✅ New TX posted: \${tx}`);
    lastSeenTxHash = tx;
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

setInterval(fetchCheeseTrades, 10000);
console.log("🧀 Tim Cheese Buy Bot (enhanced) running...");
