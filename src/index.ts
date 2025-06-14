require("dotenv").config();
import { Request, Response } from "express";
import Groq from "groq-sdk";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const express = require("express");
const app = express();
app.use(cors());
app.use(express.json())

// Initialize the Groq client with your API key
const groq = new Groq({
  apiKey: "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",
});



// Route for template
app.post("/api/template", async (req: Request, res: Response) => {
 
    const { prompt } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Return either node or react based on what you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
        },
        {
          role: "user",
          content: prompt,
        },
      ], max_tokens: 1000,
      model: "llama-3.3-70b-versatile",
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return res.status(400).json({ message: "Invalid response from Groq" });
    }

    const promptsList = answer === "react"
      ? [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`
      ]
      : [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n - .gitignore\n - package-lock.json\n`
      ];

    return res.json({
      prompts: promptsList,
      uiPrompts: answer === "react" ? [reactBasePrompt] : [nodeBasePrompt],
    });
  });

// Route for chat
app.post("/api/chat", async (req: Request, res: Response) => {
    const { messages } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        ...messages,
      ], max_tokens: 1000,
      model: "llama-3.3-70b-versatile",
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return res.status(400).json({ message: "Invalid response from Groq" });
    }

    return res.json({
      response: responseText,
    });
  });


  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json('Hello APIS');
  });
// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
