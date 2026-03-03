import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Button } from "./button"
import { Slider } from "./slider"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

export function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location)
  }

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return canvas.toDataURL("image/jpeg", 0.85)
  }

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
      onCropComplete(croppedImage)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-semibold text-white">Crop Profile Photo</h2>
        <p className="text-sm text-gray-400 mt-1">Adjust the image to fit perfectly</p>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={onCropAreaComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 px-6 py-6 space-y-6">
        {/* Zoom Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="text-gray-300 font-medium">Zoom</label>
            <span className="text-gray-400">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Rotation Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label className="text-gray-300 font-medium">Rotation</label>
            <span className="text-gray-400">{rotation}°</span>
          </div>
          <div className="flex items-center gap-3">
            <RotateCw className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="flex-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}
