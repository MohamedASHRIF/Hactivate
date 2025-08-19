import { BlobServiceClient } from '@azure/storage-blob'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'lostfound-images'

if (!connectionString) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING is not defined')
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
const containerClient = blobServiceClient.getContainerClient(containerName)

export async function uploadImage(file: File): Promise<string> {
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
