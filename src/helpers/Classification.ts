export const getSteatosisGrade = (cap: number) => {
    if (cap < 240) {
        return { label: "S0", description: "No steatosis" };
    } else if (cap >= 240 && cap < 260) {
        return { label: "S1", description: "Mild steatosis" };
    } else if (cap >= 260 && cap < 290) {
        return { label: "S2", description: "Moderate steatosis" };
    } else {
        return { label: "S3", description: "Severe steatosis" };
    }
};

export const getFibrosisStage = (kpa: number) => {
    if (kpa < 8) {
        return { label: "F0-F1", description: "Mild or no fibrosis" };
    } else if (kpa >= 8 && kpa < 14) {
        return { label: "F2-F3", description: "Moderate to marked fibrosis" };
    } else {
        return { label: "F4", description: "Cirrhosis" };
    }
};

export const extractNumber = (value: string) => {
    return parseFloat(value);
};