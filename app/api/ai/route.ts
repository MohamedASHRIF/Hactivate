import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

async function generateStudentDoubtResponse(message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const prompt = `You are an AI academic assistant helping university students with their doubts and questions. 
    Please provide a helpful, clear, and educational response to the following student question.
    Keep the response concise but comprehensive, and include practical study tips when relevant.
    
    Student Question: ${message}
    
    Please provide a supportive and informative response that helps the student understand the topic better.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Gemini AI error for student doubt:", error)
    // Fallback response
    return "I'm here to help with your academic questions! Could you please provide more details about what specific topic or concept you'd like me to explain? I'll do my best to provide a clear and helpful explanation."
  }
}

async function generateAnnouncementSuggestion(requestBody: any): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    const { title, content, category, targetAudience } = requestBody
    
    const prompt = `You are an AI assistant helping university lecturers and administrators create better announcements.
    
    Current announcement details:
    - Title: ${title || "Not provided"}
    - Content: ${content || "Not provided"}
    - Category: ${category || "Not specified"}
    - Target Audience: ${targetAudience?.join(', ') || "Not specified"}
    
    Please provide:
    1. 3 improved title suggestions (if title is provided)
    2. An enhanced version of the content with better structure and clarity
    3. 3-5 specific improvement tips
    
    Focus on making the announcement clear, professional, and engaging for university students and staff.
    Include proper formatting, important details, and a professional tone.
    
    Please respond in JSON format with the following structure:
    {
      "title": ["suggestion1", "suggestion2", "suggestion3"],
      "content": "enhanced content here",
      "improvements": ["tip1", "tip2", "tip3", "tip4", "tip5"]
    }`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text()
    
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
    }
    
    // Fallback structured response
    return {
      title: title ? [
        `${title} - Important Notice`,
        `Attention: ${title}`,
        `University Announcement: ${title}`
      ] : [],
      content: content ? `Dear Students and Staff,\n\n${content}\n\nFor any questions, please contact the relevant department.\n\nBest regards,\nAcademic Administration` : "",
      improvements: [
        "Add specific dates and times for events",
        "Include contact information for queries",
        "Use clear headings and bullet points",
        "Specify the target audience clearly",
        "Add a professional greeting and closing"
      ]
    }
  } catch (error) {
    console.error("Gemini AI error for announcement suggestion:", error)
    // Fallback response
    return {
      title: [],
      content: "",
      improvements: [
        "Add specific dates and times",
        "Include contact information",
        "Use professional language",
        "Structure content with bullet points",
        "Add clear call-to-action items"
      ]
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const body = await request.json()

    // Handle different request types
    if (body.type === "student_doubt") {
      if (!body.message) {
        return NextResponse.json({ message: "Message is required" }, { status: 400 })
      }
      
      const aiResponse = await generateStudentDoubtResponse(body.message)
      return NextResponse.json({
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    } else if (body.type === "announcement_suggestion" && (decoded.role === "lecturer" || decoded.role === "admin")) {
      const suggestions = await generateAnnouncementSuggestion(body)
      return NextResponse.json({
        suggestions,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ message: "Invalid request type or insufficient permissions" }, { status: 400 })
    }

  } catch (error) {
    console.error("AI API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
