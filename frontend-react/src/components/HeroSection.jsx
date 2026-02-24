import { useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, X, Search } from 'lucide-react'

// Images for aesthetic background
const images = [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200"
]

export default function HeroSection({ onSearch, loading }) {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [dragging, setDragging] = useState(false)
    const [currentImageIndex] = useState(0) // Can add interval later if wanted

    const handleFile = (f) => {
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }

    const handleSearchClick = (e) => {
        e.stopPropagation()
        if (file) {
            onSearch(file)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }

    const clearFile = (e) => {
        e.stopPropagation()
        setFile(null)
        setPreview(null)
    }

    return (
        <div className="relative min-h-screen bg-white overflow-hidden flex flex-col justify-center items-center">

            {/* Background Image Carousel area - covering 80% width aligned to right like template */}
            <motion.div
                className="absolute bottom-0 right-0 w-full h-[80%] lg:w-[80%] lg:h-[90%] xl:h-[95%] z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
            >
                <img
                    src={images[currentImageIndex]}
                    alt="Fashion background"
                    className="w-full h-full object-cover rounded-tl-3xl opacity-90"
                />
                <div className="absolute inset-0 bg-black/20 rounded-tl-3xl" />
            </motion.div>

            {/* Decorative Brand Title */}
            <motion.h1
                className="absolute top-[20%] lg:top-32 left-8 lg:left-1/4 text-6xl md:text-[8vw] lg:text-[120px] leading-none text-white mix-blend-difference z-20 italic font-display"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
            >
                VOGUE
                <br />
                FIND
            </motion.h1>

            <motion.div
                className="absolute bottom-8 left-8 text-2xl font-light text-gray-800 z-10 hidden lg:block italic font-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
            >
                studio visual search
            </motion.div>

            {/* Center Dropzone overlaying the hero */}
            <motion.div
                className="relative z-30 w-[90%] max-w-lg mt-32 lg:mt-48"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                <div
                    className={`
            bg-white/90 backdrop-blur-md border border-gray-200 p-8 lg:p-12 text-center 
            rounded-2xl transition-all duration-300 shadow-2xl
            ${!preview && !loading ? 'border-dashed border-2 cursor-pointer' : ''}
            ${dragging ? 'border-gray-800 bg-white/95 scale-105' : !preview && !loading ? 'border-gray-400/50 hover:border-gray-800 hover:bg-white' : ''}
          `}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !loading && !preview && document.getElementById('hero-file-input').click()}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mb-4" />
                            <p className="text-gray-800 font-light tracking-wide animate-pulse">Scanning Fashion Data...</p>
                        </div>
                    ) : preview ? (
                        <div className="flex flex-col items-center">
                            <div className="relative inline-block w-full mb-6 max-w-[240px] shadow-lg rounded-xl overflow-hidden border border-gray-100 bg-white p-2">
                                <img src={preview} alt="preview" className="w-full h-auto object-cover rounded-lg aspect-[3/4]" />
                                <button
                                    className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm rounded-full p-2 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
                                    onClick={clearFile}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleSearchClick}
                                className="w-full max-w-[240px] bg-black text-white py-4 text-sm tracking-widest uppercase font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-3 shadow-md"
                            >
                                <Search size={16} />
                                Search Now
                            </motion.button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-6">
                            <UploadCloud size={56} strokeWidth={1} className="text-gray-900 mb-6" />
                            <h3 className="text-2xl font-light text-gray-900 mb-2 font-display italic">Discover Similar</h3>
                            <p className="text-gray-500 font-light text-sm mb-1 tracking-wide">Drag & drop an image</p>
                            <p className="text-gray-400 font-light text-xs">or click to browse</p>
                        </div>
                    )}
                </div>
                <input
                    id="hero-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                />
            </motion.div>

        </div>
    )
}
