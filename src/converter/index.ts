import { isNumeric } from "../validator/index.js";

function isString(value: string) {
    return value !== undefined && value !== null && (typeof value == "string") && value.trim() != "";
}

export function toArray(value: string[]): string[] | undefined {
    if (value !== undefined && value !== null && Array.isArray(value)) {
        return value.filter(isString).map(value => value.toLocaleLowerCase());
    }
    return undefined;
}

export function toNumber(value: string): number | undefined {
    return isNumeric(value) ? +value : undefined
}
export function toBigInt(value: string): bigint | undefined {
    return isNumeric(value) ? BigInt(value) : undefined
}