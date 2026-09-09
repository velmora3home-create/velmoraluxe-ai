const http = require("http");
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404);
    return res.end("Not found");
  }

  let body = "";

  req.on("data", chunk => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const { message } = JSON.parse(body);

      const response = await client.responses.create({
        model: "gpt-5.6-luna",
        input: message
      });

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });

      res.end(JSON.stringify({
        reply: response.output_text
      }));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        error: "Yapay zeka yanıt veremedi."
      }));
    }
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("YLM AI server 3000 portunda çalışıyor.");
});
