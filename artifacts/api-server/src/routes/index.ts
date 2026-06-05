import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic";
import previewRouter from "./preview";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anthropic", anthropicRouter);
router.use("/preview", previewRouter);
router.use("/media", mediaRouter);

export default router;
