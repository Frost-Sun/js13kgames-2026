export type Theme = "spring" | "summer" | "autumn" | "winter";

export const HighlightColorByTheme: Readonly<Record<Theme, string>> = {
    winter: "rgba(141, 141, 105, 0.9)",
    spring: "rgba(200, 200, 150, 0.9)",
    summer: "rgba(200, 200, 150, 0.9)",
    autumn: "rgba(200, 200, 150, 0.9)",
};

export const DEFAULT_HIGHLIGHT_COLOR = HighlightColorByTheme["summer"];

export const DenyColorByTheme: Readonly<Record<Theme, string>> = {
    winter: "rgba(200, 40, 40, 0.5)",
    spring: "rgba(200, 40, 40, 0.5)",
    summer: "rgba(200, 40, 40, 0.5)",
    autumn: "rgba(230, 10, 10, 0.5)",
};

export const LandColorByTheme: Readonly<Record<Theme, string>> = {
    winter: "rgb(200, 200, 255)",
    spring: "rgb(60, 100, 60)",
    summer: "rgb(40, 160, 40)",
    autumn: "rgb(160, 100, 40)",
};

export const StrawColorByTheme: Readonly<Record<Theme, string | undefined>> = {
    winter: undefined,
    spring: "rgb(40,80, 40)",
    summer: "rgb(0, 190, 0)",
    autumn: "rgb(170, 120, 60)",
};

export const ArrowColorByTheme: Readonly<Record<Theme, string>> = {
    winter: "rgb(120, 120, 160)",
    spring: "rgb(100, 150, 100)",
    summer: "rgb(0, 100, 0)",
    autumn: "rgb(100, 80, 0)",
};
