const http = require("http");
const OpenAI = require("openai");
const { toFile } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, name: "YLM AI" }));
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const { message, image, file } = JSON.parse(body || "{}");

      if ((!message || !message.trim()) && !image && !file) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Mesaj veya fotoğraf gerekli." }));
      }

      const content = [];

      if (message && message.trim()) {
        content.push({
          type: "input_text",
          text: message.trim(),
        });
      } else {
        content.push({
          type: "input_text",
          text: "Bu fotoğrafı analiz et ve gördüklerini Türkçe olarak açıkla.",
        });
      }

      if (image) {
        content.push({
          type: "input_image",
          image_url: image,
        });
      }

      if (file) {
        content.push({
          type: "input_file",
          filename: file.name || "dosya.pdf",
          file_data: file.data,
        });
      }

      const response = await client.responses.create({
        model: "gpt-5.6-luna",
        instructions:
          "Sen YLM AI adlı yapay zeka asistanısın. Kullanıcı senin kim olduğunu sorarsa kendini YLM AI olarak tanıt. Asla ChatGPT olduğunu söyleme. Türkçe, doğal, samimi ve yardımcı ol.",
        input: [
          {
            role: "user",
            content,
          },
        ],
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          reply: response.output_text || "YLM AI cevap veremedi.",
        })
      );
    } catch (error) {
      console.error(error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "YLM AI cevap veremedi.",
        })
      );
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`YLM AI server ${PORT} portunda çalışıyor.`);
});
