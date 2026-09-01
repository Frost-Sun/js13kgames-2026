import "./style.css";
import { canvas } from "./graphics";
import { start } from "./game";
import { resizeCanvasMaintainingAspectRatio } from "./core/platform/window";

const maxWidth = 1280;
const maxHeight = 720;

window.addEventListener(
    "resize",
    () => resizeCanvasMaintainingAspectRatio(canvas, maxWidth, maxHeight),
    false,
);
resizeCanvasMaintainingAspectRatio(canvas, maxWidth, maxHeight);

start();
