import { useState, useCallback } from "react" // Import useState for crop/zoom/rotation state and useCallback for memoizing the crop complete handler
import Cropper from "react-easy-crop" // Import the react-easy-crop library component for interactive image cropping
import { Button } from "./button" // Import the reusable Button component
import { Slider } from "./slider" // Import the Slider component for zoom and rotation controls
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react" // Import icons for the zoom and rotation controls

// Props type for the ImageCropper component
interface ImageCropperProps {
  image: string // The base64 or URL string of the image to crop
  onCropComplete: (croppedImage: string) => void // Callback invoked with the cropped image as a base64 JPEG string
  onCancel: () => void // Callback invoked when the user cancels the crop operation
}

// Full-screen image cropping modal component
export function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 }) // State for the crop position (x/y offset of the crop area)
  const [zoom, setZoom] = useState(1) // State for the zoom level (1 = no zoom, 3 = maximum zoom)
  const [rotation, setRotation] = useState(0) // State for the rotation angle in degrees (0-360)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null) // State for the pixel coordinates of the final crop area

  const onCropChange = (location: { x: number; y: number }) => { // Handler called by react-easy-crop when the user drags the crop area
    setCrop(location) // Update the crop position state with the new x/y coordinates
  }

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => { // Handler called by react-easy-crop when the crop area changes; memoized with useCallback to prevent unnecessary re-renders
    setCroppedAreaPixels(croppedAreaPixels) // Store the pixel-level crop coordinates for use when applying the crop
  }, []) // Empty dependency array: this function never needs to be recreated

  // Helper function that loads an image URL into an HTMLImageElement
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => { // Return a promise that resolves with the loaded image element
      const image = new Image() // Create a new HTML image element
      image.addEventListener("load", () => resolve(image)) // Resolve the promise when the image finishes loading
      image.addEventListener("error", (error) => reject(error)) // Reject the promise if the image fails to load
      image.src = url // Start loading the image by setting its src
    })

  // Core function that applies the crop and rotation to produce the final cropped image
  const getCroppedImg = async (
    imageSrc: string, // The source image URL or base64 string
    pixelCrop: any, // The pixel coordinates of the crop area from react-easy-crop
    rotation = 0 // The rotation angle in degrees
  ): Promise<string> => { // Returns a base64 JPEG string of the cropped image
    const image = await createImage(imageSrc) // Load the source image into an HTMLImageElement
    const canvas = document.createElement("canvas") // Create an off-screen canvas for drawing
    const ctx = canvas.getContext("2d") // Get the 2D drawing context

    if (!ctx) { // If the canvas context is unavailable (very rare)
      throw new Error("No 2d context") // Throw an error to prevent silent failure
    }

    const maxSize = Math.max(image.width, image.height) // Find the larger dimension of the image
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2)) // Calculate a safe canvas size that can contain the image at any rotation angle (diagonal of the image)

    canvas.width = safeArea // Set the canvas width to the safe area size
    canvas.height = safeArea // Set the canvas height to the safe area size

    ctx.translate(safeArea / 2, safeArea / 2) // Move the canvas origin to the center for rotation
    ctx.rotate((rotation * Math.PI) / 180) // Apply the rotation in radians (convert from degrees)
    ctx.translate(-safeArea / 2, -safeArea / 2) // Move the origin back to the top-left after rotation

    ctx.drawImage( // Draw the source image centered on the canvas
      image,
      safeArea / 2 - image.width * 0.5, // X position: center the image horizontally
      safeArea / 2 - image.height * 0.5 // Y position: center the image vertically
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea) // Capture the entire rotated canvas as pixel data

    canvas.width = pixelCrop.width // Resize the canvas to the exact crop dimensions
    canvas.height = pixelCrop.height // Resize the canvas height to the crop height

    ctx.putImageData( // Place the captured pixel data back onto the resized canvas, offset to show only the crop area
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x), // X offset to align the crop area
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y) // Y offset to align the crop area
    )

    return canvas.toDataURL("image/jpeg", 0.85) // Export the cropped canvas as a JPEG base64 string at 85% quality
  }

  const handleCrop = async () => { // Handler called when the user clicks "Apply Crop"
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation) // Generate the cropped image using the stored crop area and rotation
      onCropComplete(croppedImage) // Pass the cropped base64 image to the parent component
    } catch (e) {
      console.error(e) // Log any errors to the console (e.g. canvas context unavailable)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col"> {/* Full-screen fixed overlay with dark semi-transparent background, z-index 50 to appear above everything */}
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-6 py-4"> {/* Semi-transparent header with blur effect and bottom border */}
        <h2 className="text-lg font-semibold text-white">Crop Profile Photo</h2> {/* Modal title in white */}
        <p className="text-sm text-gray-400 mt-1">Adjust the image to fit perfectly</p> {/* Subtitle instruction in muted gray */}
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative"> {/* Flex-grow container that fills the space between header and controls */}
        <Cropper
          image={image} // The source image to crop
          crop={crop} // Current crop position state
          zoom={zoom} // Current zoom level state
          rotation={rotation} // Current rotation angle state
          aspect={1} // Force a 1:1 (square) aspect ratio for profile photos
          cropShape="round" // Use a circular crop shape for profile photos
          showGrid={false} // Hide the rule-of-thirds grid overlay
          onCropChange={onCropChange} // Handler for when the user drags the crop area
          onCropComplete={onCropAreaComplete} // Handler for when the crop area settles (provides pixel coordinates)
          onZoomChange={setZoom} // Handler for pinch-to-zoom or scroll zoom changes
          onRotationChange={setRotation} // Handler for rotation changes
        />
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 px-6 py-6 space-y-6"> {/* Semi-transparent controls panel at the bottom */}
        {/* Zoom Control */}
        <div className="space-y-2"> {/* Zoom control section */}
          <div className="flex items-center justify-between text-sm"> {/* Row with label on left and value on right */}
            <label className="text-gray-300 font-medium">Zoom</label> {/* Zoom label */}
            <span className="text-gray-400">{Math.round(zoom * 100)}%</span> {/* Current zoom percentage (1.0 = 100%) */}
          </div>
          <div className="flex items-center gap-3"> {/* Row with zoom-out icon, slider, and zoom-in icon */}
            <ZoomOut className="h-4 w-4 text-gray-400 flex-shrink-0" /> {/* Zoom out icon on the left */}
            <Slider
              value={[zoom]} // Current zoom value as an array (Slider expects an array)
              onValueChange={(value) => setZoom(value[0])} // Update zoom state when slider changes
              min={1} // Minimum zoom: 1x (no zoom)
              max={3} // Maximum zoom: 3x
              step={0.1} // Zoom increments of 0.1x
              className="flex-1" // Slider takes remaining space
            />
            <ZoomIn className="h-4 w-4 text-gray-400 flex-shrink-0" /> {/* Zoom in icon on the right */}
          </div>
        </div>

        {/* Rotation Control */}
        <div className="space-y-2"> {/* Rotation control section */}
          <div className="flex items-center justify-between text-sm"> {/* Row with label on left and value on right */}
            <label className="text-gray-300 font-medium">Rotation</label> {/* Rotation label */}
            <span className="text-gray-400">{rotation}°</span> {/* Current rotation in degrees */}
          </div>
          <div className="flex items-center gap-3"> {/* Row with rotation icon and slider */}
            <RotateCw className="h-4 w-4 text-gray-400 flex-shrink-0" /> {/* Clockwise rotation icon */}
            <Slider
              value={[rotation]} // Current rotation value as an array
              onValueChange={(value) => setRotation(value[0])} // Update rotation state when slider changes
              min={0} // Minimum rotation: 0 degrees
              max={360} // Maximum rotation: 360 degrees (full circle)
              step={1} // Rotation increments of 1 degree
              className="flex-1" // Slider takes remaining space
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2"> {/* Row of action buttons with top padding */}
          <Button
            onClick={onCancel} // Call the cancel callback to close the cropper without saving
            variant="outline" // Outline style button
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20" // Semi-transparent white button that brightens on hover
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop} // Call the crop handler to apply the crop and return the result
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" // Blue primary button that darkens on hover
          >
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  )
}
