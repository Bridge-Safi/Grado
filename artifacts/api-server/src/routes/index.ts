import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import previewRouter from "./preview";
import mediaRouter from "./media";
import authRouter from "./auth";
import adminRouter from "./admin";
import sitesRouter from "./sites";
import paymentsRouter from "./payments";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/anthropic", anthropicRouter);
router.use("/preview", previewRouter);
router.use("/media", mediaRouter);
router.use("/sites", sitesRouter);
router.use("/payments", paymentsRouter);
router.use("/agents", agentsRouter);

export default router;
