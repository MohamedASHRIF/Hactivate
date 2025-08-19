"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, Camera, Search, Bell, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadResult {
  success: boolean
  extractedText?: string
  studentId?: string
  notificationSent?: boolean
  studentFound?: boolean
}

export default function LostFoundPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [manualStudentId, setManualStudentId] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile && !manualStudentId) {
      toast({
        title: "Error",
        description: "Please select an image or enter a student ID",
        variant: "destructive"
      })
      return
    }

    if (!location.trim()) {
      toast({
        title: "Error", 
        description: "Please specify where the item was found",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      
      if (selectedFile) {
        formData.append('image', selectedFile)
      }
      
      formData.append('description', description)
      formData.append('location', location)
      
      if (manualStudentId) {
        formData.append('studentId', manualStudentId)
      }

      const response = await fetch('/api/lost-found/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          extractedText: result.extractedText,
          studentId: result.studentId,
          notificationSent: result.notificationSent,
          studentFound: result.studentFound
        })

        toast({
          title: "Success!",
          description: result.notificationSent 
            ? "Item uploaded and student notified successfully!" 
            : "Item uploaded successfully!",
        })

        // Reset form
        setSelectedFile(null)
        setPreviewUrl(null)
        setDescription('')
        setLocation('')
        setManualStudentId('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload item. Please try again.",
        variant: "destructive"
      })
      setUploadResult({ success: false })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lost & Found</h1>
        <p className="text-muted-foreground">
          Upload found student IDs and automatically notify students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Found Item
          </CardTitle>
          <CardDescription>
            Take a photo of the found student ID or enter the details manually. 
            We'll automatically scan the ID and notify the student if found in our system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Student ID Image (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/5 transition-colors">
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload student ID image</p>
                    <p className="text-xs text-muted-foreground">
                      We'll automatically scan the image to extract the student ID
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Manual Student ID Entry */}
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID (Manual Entry)</Label>
            <Input
              id="studentId"
              placeholder="e.g., ST123456, TM2024001"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-muted-foreground">
              Enter the student ID manually if the image scanning doesn't work
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Found Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Library 2nd Floor, Cafeteria, Parking Lot A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Description</Label>
            <Textarea
              id="description"
              placeholder="Any additional details about the found item..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {uploadResult.success ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-800">Upload successful!</p>
                    {uploadResult.extractedText && (
                      <p className="text-sm text-green-700">
                        <strong>Extracted text:</strong> {uploadResult.extractedText.slice(0, 100)}...
                      </p>
                    )}
                    {uploadResult.studentId && (
                      <p className="text-sm text-green-700">
                        <strong>Student ID found:</strong> {uploadResult.studentId}
                      </p>
                    )}
                    {uploadResult.notificationSent ? (
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Student has been notified automatically!
                      </p>
                    ) : uploadResult.studentId ? (
                      <p className="text-sm text-yellow-700">
                        Student ID found but not in our system. Please contact manually.
                      </p>
                    ) : (
                      <p className="text-sm text-yellow-700">
                        No student ID detected. Item saved for manual processing.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">Upload failed. Please try again.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || (!selectedFile && !manualStudentId) || !location.trim()}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">How it works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload an image of the found student ID</li>
                <li>• Our system automatically scans and extracts the student ID</li>
                <li>• If the student is found in our database, they get notified instantly</li>
                <li>• Students receive both in-app and browser notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
