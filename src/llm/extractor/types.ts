export type Question = Record<string, string>

export type Schema = {
    'questions': Question[]
}

export interface Tool {
    type: 'function';
    name: string;
    description: string;
    parameters: JSON;
    strict: true
}