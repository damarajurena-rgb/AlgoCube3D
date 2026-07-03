import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI on the server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Arbitrary code parsing will fall back to simulation templates.");
}

app.use(express.json());

// API route to parse arbitrary sorting/array code
app.post("/api/parse-code", async (req, res) => {
  const { code, language, array } = req.body;

  if (!code || !array || !Array.isArray(array)) {
    return res.status(400).json({ error: "Missing 'code' or valid 'array' parameter." });
  }

  // If Gemini client is not initialized, return a helpful fallback message
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API is not configured. Please configure your GEMINI_API_KEY in the Secrets panel.",
    });
  }

  try {
    const systemPrompt = `You are an expert computer science assistant and algorithm visualizer.
Your task is to parse a given piece of code (which could be in Python, Java, C, C++, or JavaScript) that performs array manipulation or sorting.
You will trace the execution of this code EXACTLY as it runs, using the provided array input.
You must generate a list of step-by-step visual animation steps (comparisons, swaps, shifts, writes, highlights) so that a 3D visualizer can animate the cubes.

Strict rules for trace steps:
1. The initial state is the input array.
2. Each step must have a 'type' of:
   - 'compare': When the algorithm compares two elements (highlight them yellow/orange).
   - 'swap': When the algorithm swaps two elements (animate exchange of their positions).
   - 'shift': When an element is shifted or moved to make room (insertion).
   - 'write': When a value is directly overwritten at an index (e.g. arr[i] = val).
   - 'highlight': Highlighting a pivot, partition boundary, or key element.
   - 'complete': Marking an element or portion as fully sorted/complete.
3. Every step MUST include the exact full 'arrayState' (array of numbers) representing the state of the array AFTER that step occurs.
4. Keep the trace rich but concise (cap at max 40 key steps for large trace sizes to avoid token overflow). Highlight key operations.
5. Provide a super friendly, clear, human-readable 'explanation' for each step (e.g., "Comparing 10 and 5. Since 10 is greater than 5, we swap them.").`;

    const prompt = `Here is the user's code:
\`\`\`${language || "text"}
${code}
\`\`\`

Trace the execution of this code on the following input array:
${JSON.stringify(array)}

Return a structured JSON object according to the schema containing identified algorithm properties and a detailed list of execution steps. Make sure the 'arrayState' field in each step reflects the actual state after that instruction.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            algorithmName: {
              type: Type.STRING,
              description: "The name of the detected algorithm (e.g., Bubble Sort, Insertion Sort, Custom Algorithm).",
            },
            timeComplexity: {
              type: Type.STRING,
              description: "The average time complexity (e.g., O(N^2), O(N log N)).",
            },
            spaceComplexity: {
              type: Type.STRING,
              description: "The space complexity (e.g., O(1)).",
            },
            summary: {
              type: Type.STRING,
              description: "A brief summary of what the code does.",
            },
            steps: {
              type: Type.ARRAY,
              description: "The sequential list of array operations to animate.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The action type: 'compare', 'swap', 'shift', 'write', 'highlight', 'complete'.",
                  },
                  indices: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "The 0-indexed array indices involved in this step.",
                  },
                  values: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "The actual values involved at those indices (for rendering context).",
                  },
                  arrayState: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: "The state of the array after this step is completed.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "User-friendly description of what this step is doing.",
                  },
                },
                required: ["type", "indices", "arrayState", "explanation"],
              },
            },
          },
          required: ["algorithmName", "timeComplexity", "summary", "steps"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API.");
    }

    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in parse-code endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to parse code." });
  }
});

// Configure Vite or production static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
