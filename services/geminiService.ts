
import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
import { QuizQuestion } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert base64 to a Gemini Part
const fileToGenerativePart = (base64: string, mimeType: string): Part => {
  return {
    inlineData: {
      data: base64.split(',')[1], // remove the "data:image/png;base64," part
      mimeType,
    },
  };
};

const callGenerativeModel = async (contents: Part[], schema?: any): Promise<any> => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contents },
            ...(schema && {
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            })
        });

        const response: GenerateContentResponse = result;
        const text = response.text;
        
        if (!text) {
             throw new Error("Empty response from model.");
        }

        return schema ? JSON.parse(text) : text;
    } catch (e: any) {
        console.error("Gemini API Error:", e);
        throw new Error(`Error communicating with the AI model: ${e.message}`);
    }
};

export const generateQuizContent = async (
    medicalText: string,
    userImages: string[], // Changed from 'images' to 'userImages' for clarity
    customInstructions: string,
    mcqCount: number,
    caseCount: number,
    questionsPerCase: number,
    difficulty: string
): Promise<{ questions: QuizQuestion[], images: string[] }> => {
    
    const parts: Part[] = [{ text: medicalText }];
    userImages.forEach(imgBase64 => {
        parts.push(fileToGenerativePart(imgBase64, 'image/png'));
    });

    const questionSchema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            imageIndex: { type: Type.NUMBER, nullable: true, description: "Index of the image used for this question from the provided images array (0-based). Null if no image is used." }
        },
        required: ["question", "options", "correctAnswerIndex", "explanation"]
    };

    const caseSchema = {
        type: Type.OBJECT,
        properties: {
            caseDescription: { type: Type.STRING },
            questions: {
                type: Type.ARRAY,
                items: questionSchema,
                minItems: questionsPerCase,
                maxItems: questionsPerCase
            }
        },
        required: ["caseDescription", "questions"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            mcqs: {
                type: Type.ARRAY,
                items: questionSchema,
                description: "Standalone multiple-choice questions."
            },
            caseScenarios: {
                type: Type.ARRAY,
                items: caseSchema,
                description: "Clinical case scenarios with their own questions."
            }
        },
        required: ["mcqs", "caseScenarios"]
    };
    
    const difficultyInstruction = difficulty === "mix" ? "Create a mix of easy, medium, and hard questions." : `Ensure ALL questions generated are of **${difficulty}** difficulty.`;
    const imageInstruction = userImages.length > 0 ? `You have been provided with ${userImages.length} images by the user. You MUST create some questions based on these images. When creating an image-based question, set the 'imageIndex' to the corresponding index of the image you used (0-based). For text-only questions, set 'imageIndex' to null.` : "No images were provided by the user; do not attempt to create image-based questions.";

    const prompt = `
        You are an expert medical quiz creator. Based on the provided medical text and user-uploaded images, generate a set of questions.
        
        **Source Content:**
        The user has provided a medical text and ${userImages.length} images. The content is provided in a multi-part format. The text is first, followed by the images.
        
        **Your Task:**
        1. Generate exactly ${mcqCount} standalone MCQs.
        2. Generate exactly ${caseCount} clinical case scenarios, each with exactly ${questionsPerCase} questions.
        3. ${imageInstruction}
        4. ${difficultyInstruction}
        5. **Custom User Instructions:** ${customInstructions || "None provided. Adhere to standard question generation."}
        6. **Crucial:** Ensure all information (stems, options, explanations) is derived strictly from the provided text and images. Avoid phrases like "According to the text".
        7. Return the result in the specified JSON format.
    `;

    parts.unshift({text: prompt}); // Prepend the main prompt

    const response = await callGenerativeModel(parts, responseSchema);

    let allQuestions: QuizQuestion[] = [];
    if (response.mcqs) {
        allQuestions.push(...response.mcqs);
    }
    if (response.caseScenarios) {
        response.caseScenarios.forEach((scenario: any) => {
            if (scenario.questions) {
                const questionsWithCase = scenario.questions.map((q: QuizQuestion) => ({
                    ...q,
                    caseDescription: scenario.caseDescription
                }));
                allQuestions.push(...questionsWithCase);
            }
        });
    }

    if (allQuestions.length === 0) {
        throw new Error("The AI model failed to generate any questions. Try adjusting the inputs or the source document.");
    }
    
    // Shuffle all questions
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    return { questions: allQuestions, images: userImages };
};

export const auditAndCorrectQuestion = async (question: QuizQuestion, originalText: string, userImages: string[]): Promise<QuizQuestion> => {
     const auditSchema = { type: Type.OBJECT, properties: { is_valid: { type: Type.BOOLEAN }, reason: { type: Type.STRING }, flaw_type: { type: Type.STRING, enum: ["question", "options", "explanation", "none", "multiple_correct", "no_correct", "not_from_text"] } }, required: ["is_valid", "reason", "flaw_type"] };
     const questionSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.NUMBER }, explanation: { type: Type.STRING }, imageIndex: { type: Type.NUMBER, nullable: true } }, required: ["question", "options", "correctAnswerIndex", "explanation"] };

    const auditPrompt = `Act as a strict medical question auditor. Critically audit the following medical question based ONLY on the provided source text and user-uploaded images.
    Criteria:
    1.  **Source Adherence:** Is ALL information (stem, options, explanation) derived *strictly* and *accurately* from the source content?
    2.  **Clarity & Validity:** Is the question clear? Is there *only one* unambiguously correct answer? Are distractors plausible but incorrect?
    3.  **Image Usage:** If 'imageIndex' is not null, does the question correctly relate to the specified image?

    If valid, return {"is_valid": true, "reason": "None", "flaw_type": "none"}.
    If flawed, return {"is_valid": false, "reason": "[Brief description of flaw]", "flaw_type": "[Choose from: question, options, explanation, not_from_text, etc.]"}.
    
    **Question to Audit:** ${JSON.stringify(question)}
    Return your verdict as a JSON object.`;

    const parts: Part[] = [{text: originalText}, ...userImages.map(img => fileToGenerativePart(img, 'image/png'))];
    parts.unshift({text: auditPrompt});

    const auditResult = await callGenerativeModel(parts, auditSchema);

    if (auditResult && auditResult.is_valid) {
        return { ...question, is_flawed: false };
    }

    // Attempt correction
    const correctionPrompt = `Based ONLY on the source text/images, correct the following medical question. The auditor identified a flaw in the **${auditResult.flaw_type}**: "${auditResult.reason}".
    Ensure the corrected question is accurate.
    **Source Content is provided in multi-part format.**
    **Flawed Question:** ${JSON.stringify(question)}
    Return the complete, corrected question object in JSON format.`;

    const correctionParts: Part[] = [{text: originalText}, ...userImages.map(img => fileToGenerativePart(img, 'image/png'))];
    correctionParts.unshift({text: correctionPrompt});
    
    try {
        const correctionResult = await callGenerativeModel(correctionParts, { type: Type.OBJECT, properties: { corrected_question: questionSchema } });
        if (correctionResult && correctionResult.corrected_question) {
            return { ...correctionResult.corrected_question, caseDescription: question.caseDescription, is_flawed: false };
        }
    } catch(e) {
        console.error("Correction attempt failed:", e);
    }
    
    return { ...question, is_flawed: true };
};

export const refineExplanation = async (question: QuizQuestion, originalText: string, userImages: string[]): Promise<QuizQuestion> => {
     if (!question.is_flawed) return question; // Only refine flawed ones
    
     const explanationSchema = { type: Type.OBJECT, properties: { new_explanation: { type: Type.STRING } }, required: ["new_explanation"] };
     const correctAnswerText = question.options[question.correctAnswerIndex];

     const rewritePrompt = `Based ONLY on the source text/images, rewrite the explanation for this question to clearly and accurately justify why the specified correct answer is correct. This question was flagged as flawed, so pay extra attention to accuracy.
     **Source Content is provided in multi-part format.**
     **Question:** ${question.question}
     **Correct Answer Option Content:** ${correctAnswerText}
     **Current Explanation (for context):** ${question.explanation || 'None provided'}
     Return the rewritten explanation in JSON with key 'new_explanation'.`;

    const parts: Part[] = [{text: originalText}, ...userImages.map(img => fileToGenerativePart(img, 'image/png'))];
    parts.unshift({text: rewritePrompt});

    try {
        const result = await callGenerativeModel(parts, explanationSchema);
        if (result && result.new_explanation) {
            return { ...question, explanation: result.new_explanation };
        }
    } catch (e) {
        console.error("Explanation refinement failed:", e);
    }

    return question; // return original on failure
};


export const generateAnswerStream = async (documentText: string, question: string) => {
    const prompt = `Based **only** on the following medical document, answer the user's question.
If the information is not in the document, state that you cannot find the answer in the provided text.
Answer in Arabic.

--- DOCUMENT START ---
${documentText}
--- DOCUMENT END ---

QUESTION: "${question}"
`;

    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response; // this is the stream iterator
    } catch (e: any) {
        console.error("Gemini API Stream Error:", e);
        throw new Error(`Error communicating with the AI model: ${e.message}`);
    }
};
