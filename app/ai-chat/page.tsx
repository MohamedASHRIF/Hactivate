"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Bot, Send, User, MessageSquare, Lightbulb } from "lucide-react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function AIChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI study assistant. I'm here to help you with your academic doubts, questions, and provide guidance on various subjects. Feel free to ask me anything about your studies!",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Scroll to bottom when new message is added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          type: "student_doubt"
        })
      })

      const data = await response.json()

      if (response.ok) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to get AI response",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("AI chat error:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const quickQuestions = [
    "How can I improve my study habits?",
    "I need help with math problems",
    "Can you explain programming concepts?",
    "How should I prepare for exams?",
    "I'm confused about this assignment",
    "What are good research methods?"
  ]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "student") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bot className="h-8 w-8 text-blue-600" />
                AI Study Assistant
              </h1>
              <p className="text-muted-foreground mt-2">
                Get instant help with your academic questions and doubts
              </p>
            </div>

            <div className="grid gap-6">
              {/* Quick Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Quick Questions
                  </CardTitle>
                  <CardDescription>
                    Click on any question to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quickQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto p-3 text-left"
                        onClick={() => handleQuickQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card className="flex flex-col h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat with AI
                  </CardTitle>
                  <CardDescription>
                    Ask any academic question and get instant help
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!message.isUser && (
                            <Avatar className="h-8 w-8 bg-blue-100">
                              <AvatarFallback>
                                <Bot className="h-4 w-4 text-blue-600" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          
                          {message.isUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8 bg-blue-100">
                            <AvatarFallback>
                              <Bot className="h-4 w-4 text-blue-600" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Input */}
                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask me anything about your studies..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
