export const HIGHLIGHT_COLOR = "rgb(200, 200, 150)";
export const DENIED_COLOR = "rgb(200, 100, 100)";

export type Theme = "spring" | "summer" | "autumn" | "winter";

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
