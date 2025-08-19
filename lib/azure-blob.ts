import { BlobServiceClient } from '@azure/storage-blob'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'lostfound-images'

// Check if Azure Blob storage is configured
const isAzureConfigured = !!connectionString

let blobServiceClient: BlobServiceClient | null = null
let containerClient: any = null

if (isAzureConfigured && connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  containerClient = blobServiceClient.getContainerClient(containerName)
}

export async function uploadImage(file: File): Promise<string> {
  if (!isAzureConfigured || !containerClient) {
    // Return a placeholder URL if Azure is not configured
    return `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`
  }
  
  const blobName = `lostfound/${Date.now()}-${file.name}`
  const blockBlobClient = containerClient.getBlockBlobClient(blobName)
  
  const arrayBuffer = await file.arrayBuffer()
  await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength, {
    blobHTTPHeaders: {
      blobContentType: file.type,
    },
  })
  
  return blockBlobClient.url
}

export async function deleteImage(imageUrl: string): Promise<void> {
  if (!isAzureConfigured || !containerClient) {
    return // Nothing to delete if Azure is not configured
  }
  
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const blobName = pathParts.slice(-2).join('/') // Get the last two parts: lostfound/filename
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.delete()
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}
