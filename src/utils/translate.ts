import axios from "axios";

export async function translateProductName(text: string) {
  try {
    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/translate`, { text });
    console.log(res,"namebn")
    return res.data.bn;
  } catch (error) {
    console.error("Translation failed:", error);
    return ""; // Return empty string on error
  }
}