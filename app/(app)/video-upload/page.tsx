"use client"
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import VideoCard from '@/components/VideoCard'
import { Video } from '@/types'

function videoUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const MAX_FILE_SIZE = 70 * 1024 * 1024;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds the limit of 70MB")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    formData.append("description", description)
    formData.append("originalSize", file.size.toString())

    try {
      const response = await axios.post("/api/video-upload", formData)
      if (response.status !== 200 || !response.data.success) {
        throw new Error("Failed to upload video")
      }
      // Refresh the video list after successful upload
      fetchVideos()
    } catch (error) {
      console.log(error)
    } finally {
      setIsUploading(false)
    }
  }

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos')
      if (Array.isArray(response.data)) {
        setVideos(response.data)
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error) {
      console.log(error)
      setError('Error loading videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${title}.mp4`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Video File</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input file-input-bordered w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Uploaded Videos</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.length === 0 ? (
              <div className="text-center text-lg text-gray-500">
                No videos available
              </div>
            ) : (
              videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onDownload={handleDownload}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default videoUpload