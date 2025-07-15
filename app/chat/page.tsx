"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Search, MoreVertical, Phone, Video, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface Contact {
  id: string
  name: string
  role: string
  isOnline: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  isOwn: boolean
}

export default function ChatPage() {
  const { user } = useAuth()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock contacts data
  const contacts: Contact[] = [
    {
      id: "1",
      name: "Dr. Jane Smith",
      role: "lecturer",
      isOnline: true,
      lastMessage: "Sure, I can help you with that assignment.",
      lastMessageTime: "2 min ago",
      unreadCount: 2,
    },
    {
      id: "2",
      name: "Mike Johnson",
      role: "student",
      isOnline: false,
      lastMessage: "Thanks for the study materials!",
      lastMessageTime: "1 hour ago",
    },
    {
      id: "3",
      name: "Prof. Robert Davis",
      role: "lecturer",
      isOnline: true,
      lastMessage: "The deadline has been extended to Friday.",
      lastMessageTime: "3 hours ago",
      unreadCount: 1,
    },
    {
      id: "4",
      name: "Sarah Wilson",
      role: "student",
      isOnline: false,
      lastMessage: "Can we form a study group?",
      lastMessageTime: "1 day ago",
    },
  ]

  // Mock messages data
  const mockMessages: Message[] = [
    {
      id: "1",
      senderId: "1",
      content: "Hi! I have a question about the latest assignment.",
      timestamp: "10:30 AM",
      isOwn: false,
    },
    {
      id: "2",
      senderId: user?._id || "",
      content: "Hello Dr. Smith! What would you like to know?",
      timestamp: "10:32 AM",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "1",
      content: "I'm having trouble understanding the requirements for question 3.",
      timestamp: "10:33 AM",
      isOwn: false,
    },
    {
      id: "4",
      senderId: user?._id || "",
      content: "Sure, I can help you with that assignment. Question 3 is about implementing a binary search algorithm.",
      timestamp: "10:35 AM",
      isOwn: true,
    },
  ]

  useEffect(() => {
    if (selectedContact) {
      setMessages(mockMessages)
    }
  }, [selectedContact])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim() || !selectedContact) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?._id || "",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
    }

    setMessages([...messages, newMessage])
    setMessage("")
  }

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Contacts List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-1 p-4">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedContact?.id === contact.id ? "bg-primary/10" : "hover:bg-muted",
                        )}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {contact.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {contact.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{contact.name}</p>
                            {contact.unreadCount && (
                              <Badge variant="destructive" className="text-xs">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{contact.role}</p>
                          {contact.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{contact.lastMessage}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{contact.lastMessageTime}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2">
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {selectedContact.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {selectedContact.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedContact.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedContact.role} • {selectedContact.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className={cn("flex", msg.isOwn ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg px-3 py-2",
                                msg.isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                              )}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
                                )}
                              >
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={handleSendMessage} size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a contact from the list to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
