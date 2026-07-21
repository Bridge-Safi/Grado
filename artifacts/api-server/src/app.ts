import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: [
    'https://grado.safi-bridge.ma',
    'https://www.grado.safi-bridge.ma',
    'https://grado-production-fb0f.up.railway.app',
    /\.up\.railway\.app$/,
  ],
  credentials: true
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rate limiting — protège le chat IA contre le spam (30 req/min par IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Attends une minute avant de réessayer." },
});

// Anti-spam inscription : 10 comptes par IP par heure
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessaie dans une heure." },
});

app.use("/api/anthropic", chatLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", router);

// Serve frontend static files in production
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(__dirname, "../../grado/dist/public");
  app.use(express.static(frontendDist));
  // Express 5 / path-to-regexp v8 no longer accept a bare "*" wildcard route.
  // Using a path-less middleware avoids path-to-regexp parsing entirely.
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
