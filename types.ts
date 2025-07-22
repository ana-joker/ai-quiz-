import { Part } from "@google/genai";

export enum AppStatus {
    IDLE = 'IDLE',
    PROCESSING_PDF = 'PROCESSING_PDF',
    GENERATING = 'GENERATING',
    DONE_GENERATING = 'DONE_GENERATING',
    ERROR = 'ERROR'
}

export enum ProtocolStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    DONE = 'done',
    ERROR = 'error'
}

export interface ProtocolStep {
    id: string;
    text: string;
    status: ProtocolStatus;
}

export interface LogEntry {
    id: number;
    message: string;
    type: 'log' | 'error' | 'success';
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    caseDescription?: string;
    imageIndex?: number | null; // Index of the image in the user-uploaded images array
    is_flawed?: boolean;
}

export interface GeneratedQuizData {
    questions: QuizQuestion[];
    images: string[]; // base64 strings of user-uploaded images
}

// Type for the multi-part content sent to Gemini
export type MultiPartContent = Part[];

// Types for the IndexedDB Data Store
export interface StoredPdfData {
    id?: number;
    filename: string;
    text: string;
    createdAt: Date;
}

export interface StoredPdfMeta {
    id: number;
    filename: string;
    createdAt: Date;
}
