"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Send, Search, MoreVertical, Phone, Video, MessageSquare, Circle, Wifi, WifiOff, Bell } from "lucide-react"
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
  const { toast } = useToast()
  const isUserOnline = useOnlineStatus()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({})
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true)
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setHasPermission(permission === 'granted')
        })
      }
    }
  }, [])

  // Show browser notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if (!hasPermission || document.hasFocus()) return // Don't show if window is focused

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'chat-message',
        requireInteraction: false,
        silent: false
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      // Focus window when clicked
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  // Update user online status
  useEffect(() => {
    if (!user) return

    const updateStatus = async () => {
      try {
        await fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: isUserOnline })
        })
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    }

    updateStatus()
  }, [user, isUserOnline])

  // Initialize SSE connection for real-time messages
  useEffect(() => {
    if (!user) return

    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectToSSE = () => {
      const eventSource = new EventSource('/api/messages/live')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttempts = 0
        console.log('Connected to live chat')
        
        // toast({
        //   title: "Connected",
        //   description: "Real-time chat connected successfully",
        //   duration: 2000,
        // })
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connected') {
            setIsConnected(true)
          } else if (data.type === 'new_message') {
            const incomingMessage = data.data
            const senderName = data.senderName || 'Unknown User'
            
            // Always add message to state if it's for the current chat or any chat
            if (selectedContact && incomingMessage.senderId === selectedContact.id) {
              setMessages(prev => [...prev, incomingMessage])
              
              // Show toast notification even when chat is open
              // toast({
              //   title: `New message from ${senderName}`,
              //   description: incomingMessage.content.substring(0, 100) + (incomingMessage.content.length > 100 ? '...' : ''),
              //   duration: 3000,
              // })
            } else {
              // Show browser notification for messages not in current chat
              showNotification(
                `New message from ${senderName}`,
                incomingMessage.content.substring(0, 100) + (incomingMessage.content.length > 100 ? '...' : '')
              )
              
              // Show toast notification
              // toast({
              //   title: `New message from ${senderName}`,
              //   description: incomingMessage.content.substring(0, 100) + (incomingMessage.content.length > 100 ? '...' : ''),
              //   duration: 5000,
              //   action: (
              //     <Button
              //       variant="outline"
              //       size="sm"
              //       onClick={() => {
              //         // Find and select the contact
              //         const contact = contacts.find(c => c.id === incomingMessage.senderId)
              //         if (contact) {
              //           setSelectedContact(contact)
              //         }
              //       }}
              //     >
              //       View
              //     </Button>
              //   )
              // })
            }
            
            // Update contact's last message and unread count
            setContacts(prev => prev.map(contact => 
              contact.id === incomingMessage.senderId
                ? { 
                    ...contact, 
                    lastMessage: incomingMessage.content,
                    lastMessageTime: incomingMessage.timestamp,
                    unreadCount: selectedContact?.id === incomingMessage.senderId ? 0 : (contact.unreadCount || 0) + 1
                  }
                : contact
            ))
          } else if (data.type === 'typing_status') {
            // Update typing status
            setIsTyping(prev => ({
              ...prev,
              [data.data.senderId]: data.data.isTyping
            }))
            
            // Clear typing after 3 seconds
            if (data.data.isTyping) {
              setTimeout(() => {
                setIsTyping(prev => ({
                  ...prev,
                  [data.data.senderId]: false
                }))
              }, 3000)
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        console.log('Disconnected from live chat')
        eventSource.close()

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff, max 30s
          
          // toast({
          //   title: "Connection Lost",
          //   description: `Reconnecting in ${delay/1000}s... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`,
          //   duration: 3000,
          // })

          reconnectTimeout = setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts}`)
            connectToSSE()
          }, delay)
        } else {
          // toast({
          //   title: "Connection Failed",
          //   description: "Unable to establish real-time connection. Please refresh the page.",
          //   duration: 10000,
          // })
        }
      }
    }

    connectToSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [user, selectedContact, contacts, toast, showNotification])

  // Fetch contacts from recent chats
  const fetchContacts = async () => {
    try {
      setLoading(true)
      
      // Always fetch all users as potential contacts
      const usersResponse = await fetch('/api/users?chat=true')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log('Fetched users for chat:', usersData) // Debug log
        const allContacts = usersData
          .filter((u: any) => u._id !== user?._id)
          .map((u: any) => ({
            id: u._id,
            name: u.name,
            role: u.role,
            isOnline: u.isOnline || false,
            lastMessage: "No messages yet",
            lastMessageTime: "Never"
          }))

        // Fetch recent chats to update contact information
        const chatsResponse = await fetch('/api/chats')
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          console.log('Fetched chats:', chatsData) // Debug log
          
          // Update contacts with chat information
          const updatedContacts = allContacts.map((contact: Contact) => {
            const chat = chatsData.find((c: any) => c.id === contact.id)
            return chat ? { ...contact, ...chat } : contact
          })
          
          setContacts(updatedContacts)
        } else {
          console.log('No chats found or error fetching chats:', chatsResponse.status)
          setContacts(allContacts)
        }
      } else {
        console.error('Failed to fetch users:', usersResponse.status, usersResponse.statusText)
        const errorText = await usersResponse.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for selected contact
  const fetchMessages = async (contactId: string) => {
    try {
      const response = await fetch(`/api/messages?contactId=${contactId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error('Failed to fetch messages:', response.status)
        setMessages([]) // Clear messages if fetch fails
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  // Auto-refresh messages for active chat
  useEffect(() => {
    if (!selectedContact) return

    const refreshInterval = setInterval(() => {
      fetchMessages(selectedContact.id)
    }, 10000) // Refresh every 10 seconds as backup

    return () => clearInterval(refreshInterval)
  }, [selectedContact])

  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user])

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id)
    }
  }, [selectedContact, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || isSending) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?._id?.toString() || "",
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
    }

    // Optimistically update UI
    setMessages(prev => [...prev, newMessage])
    const messageToSend = message.trim()
    setMessage("")
    setIsSending(true)

    // Send to API
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: selectedContact.id,
          content: messageToSend
        })
      })

      if (response.ok) {
        // Update contact's last message in the list
        setContacts(prev => prev.map(contact => 
          contact.id === selectedContact.id
            ? { 
                ...contact, 
                lastMessage: messageToSend,
                lastMessageTime: newMessage.timestamp
              }
            : contact
        ))
      } else {
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
        setMessage(messageToSend) // Restore the message
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
      setMessage(messageToSend) // Restore the message
    } finally {
      setIsSending(false)
    }
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    // Clear unread count when selecting a contact
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unreadCount: undefined } : c
    ))
    // Clear typing status for this contact
    setIsTyping(prev => ({ ...prev, [contact.id]: false }))
  }

  const handleTyping = async (value: string) => {
    setMessage(value)
    
    if (!selectedContact) return

    // Clear previous typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Send typing start
    if (value.length > 0) {
      try {
        await fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: selectedContact.id,
            isTyping: true
          })
        })
      } catch (error) {
        console.error('Error sending typing status:', error)
      }

      // Set timeout to send typing stop
      const timeout = setTimeout(async () => {
        try {
          await fetch('/api/messages/typing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId: selectedContact.id,
              isTyping: false
            })
          })
        } catch (error) {
          console.error('Error sending typing stop:', error)
        }
      }, 1000)

      setTypingTimeout(timeout)
    }
  }

  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="p-6">
          {/* Connection Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Connected to live chat</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Disconnected from live chat</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {hasPermission ? (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <Bell className="h-3 w-3" />
                    <span>Notifications ON</span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => Notification.requestPermission().then(p => setHasPermission(p === 'granted'))}
                    className="text-xs"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Enable Notifications
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchContacts}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? (
                    <Circle className="h-3 w-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
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
                <ScrollArea className="h-[calc(100vh-18rem)]">
                  <div className="space-y-1 p-4">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          </div>
                        </div>
                      ))
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No contacts found
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedContact?.id === contact.id ? "bg-primary/10" : "hover:bg-muted",
                        )}
                        onClick={() => handleContactSelect(contact)}
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
                      ))
                    )}
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
                        
                        {/* Typing Indicator */}
                        {selectedContact && isTyping[selectedContact.id] && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-3 py-2 max-w-[70%]">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedContact.name} is typing...
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={message}
                          onChange={(e) => handleTyping(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          className="flex-1"
                          disabled={isSending}
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          size="icon"
                          disabled={isSending || !message.trim()}
                        >
                          {isSending ? (
                            <Circle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {!isConnected && (
                        <p className="text-xs text-yellow-600 mt-2">
                          ⚠️ Connection lost. Messages may not be delivered in real-time.
                        </p>
                      )}
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
