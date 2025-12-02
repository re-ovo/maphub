/** 生成 UUID */
export function generateId(): string {
    return crypto.randomUUID();
}

export type Id = string;