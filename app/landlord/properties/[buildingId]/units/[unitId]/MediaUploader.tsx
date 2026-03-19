'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function MediaUploader({ buildingId, unitId, currentPhotos }: {
  buildingId: string;
  unitId: string;
  currentPhotos: string[];
}) {
  const supabase = createClient()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(currentPhotos)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    setError('')

    const newImageUrls = [...images]
    for (const file of Array.from(e.target.files)) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `units/${unitId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('property_media')
        .upload(filePath, file)

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('property_media').getPublicUrl(filePath)
      newImageUrls.push(data.publicUrl)
    }

    const { error: dbError } = await supabase.from('units').update({ photos: newImageUrls }).eq('id', unitId)
    if (dbError) {
      setError(`Save failed: ${dbError.message}`)
      setUploading(false)
      return
    }

    setImages(newImageUrls)
    setUploading(false)
    router.refresh()
  }

  const removePhoto = async (urlToRemove: string) => {
    const updatedImages = images.filter(url => url !== urlToRemove)
    await supabase.from('units').update({ photos: updatedImages }).eq('id', unitId)
    setImages(updatedImages)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Unit Photos</h3>
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-primary-600 hover:text-primary-600 transition-colors bg-slate-50">
          <span>{uploading ? 'Uploading...' : '+ Add Photo'}</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {images.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400">No photos uploaded for this unit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={url} alt={`Unit upload ${i}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110 hover:bg-red-600 cursor-pointer text-xs focus:outline-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
