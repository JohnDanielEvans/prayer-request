import axios from 'axios';
import axiosRetry from 'axios-retry';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithExponentialBackoff = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.response && error.response.status === 429) {
      await sleep(delay);
      return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

export const categorizeRequest = async (text) => {
  try {
    const response = await retryWithExponentialBackoff(() =>
      openai.post('/chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Categorize the prayer request into: Health, Family, Finances, Faith, Death/Grieving, Emotion, Other." },
          { role: "user", content: text },
        ],
      })
    );

    const data = response.data;
    return data.choices[0]?.message?.content || "Other";
  } catch (error) {
    console.error("Error categorizing request:", error);
    return "Other";
  }
};