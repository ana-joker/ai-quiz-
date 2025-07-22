// This assumes pdfjsLib is available globally from the CDN script in index.html
declare const pdfjsLib: any;

interface PdfExtractionResult {
    text: string;
}

export const extractFromPdf = async (file: File): Promise<PdfExtractionResult> => {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
        fileReader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file."));
            }

            try {
                const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                resolve({ text: fullText.trim() });
            } catch (error) {
                console.error("Error processing PDF:", error);
                reject(new Error("Could not parse the PDF file. It might be corrupted or in an unsupported format."));
            }
        };

        fileReader.onerror = () => {
            reject(new Error("Error reading file."));
        };

        fileReader.readAsArrayBuffer(file);
    });
};
