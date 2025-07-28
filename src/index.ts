require("dotenv").config();
import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const express = require("express");
const app = express();
app.use(cors());
app.use(express.json())

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY! || "AIzaSyAr6Qcx3fYdppmn9D7TK6ZK7rPcUKYyLiI");


// Route for template
app.post("/api/template", async (req: Request, res: Response) => {
 
    const { prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ]
    });
    const answer = result.response.text();

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
    const messages: { role: string; content: string }[] = req.body.messages;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: getSystemPrompt() }] },
        ...messages.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }))
      ]
    });
    const responseText = result.response.text();

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
