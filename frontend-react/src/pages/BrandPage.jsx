import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBrandProductsAPI, toggleProductStatusAPI, addProductAPI } from '../services/api'
import ProductDetailModal from '../components/ProductDetailModal'
import { ToggleLeft, ToggleRight, Upload, Package, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const SEASONS = ['Summer', 'Winter', 'Fall', 'Spring']
const USAGES = ['Casual', 'Formal', 'Sports', 'Party', 'Ethnic', 'Smart Casual', 'Travel', 'Home']
const GENDERS = ['Men', 'Women', 'Boys', 'Girls', 'Unisex']

export default function BrandPage() {
    const { user } = useAuth()
    const [tab, setTab] = useState('products')

    // Product list
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(null)

    // Confirmation dialog
    const [confirm, setConfirm] = useState(null)

    // Product detail modal
    const [detailProduct, setDetailProduct] = useState(null)

    // Upload form
    const [form, setForm] = useState({ product_id: '', gender: 'Men', masterCategory: '', subCategory: '', articleType: '', baseColour: '', season: 'Summer', year: 2024, usage: 'Casual', productDisplayName: '' })
    const [imageFile, setImageFile] = useState(null)
    const [uploading, setUploading] = useState(false)

    // Load products
    useEffect(() => {
        getBrandProductsAPI(user.user_id)
            .then(r => setProducts(r.data?.data || r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [user.user_id])

    // Toggle product status (sau khi confirm)
    const doToggle = async () => {
        if (!confirm) return
        const { product_id, is_active, name } = confirm
        setConfirm(null)
        setToggling(product_id)
        try {
            await toggleProductStatusAPI(product_id, !is_active)
            setProducts(prev => prev.map(p => {
                const pid = p.ID || p.id || p.product_id
                return pid === product_id ? { ...p, is_active: !is_active } : p
            }))
            toast.success(`Product ${is_active ? 'removed' : 'restored'} successfully`)
        } catch {
            toast.error('Failed to change product status')
        }
        setToggling(null)
    }

    const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    // Upload new product
    const handleUpload = async (e) => {
        e.preventDefault()
        if (!imageFile) {
            toast.error('Please select an image')
            return
        }
        setUploading(true)
        try {
            const fd = new FormData()
            Object.entries({ ...form, brand_id: user.user_id }).forEach(([k, v]) => fd.append(k, v))
            fd.append('file', imageFile)
            await addProductAPI(fd)
            toast.success('Product uploaded successfully!')
            setForm({ product_id: '', gender: 'Men', masterCategory: '', subCategory: '', articleType: '', baseColour: '', season: 'Summer', year: 2024, usage: 'Casual', productDisplayName: '' })
            setImageFile(null)
        } catch (err) {
            const detail = err.response?.data?.detail
            let msg = 'Upload failed'
            if (typeof detail === 'string') {
                msg = detail
            } else if (Array.isArray(detail)) {
                msg = detail.map(d => `${d.loc?.slice(-1)?.[0] || ''}: ${d.msg}`).join('; ')
            } else if (detail) {
                msg = JSON.stringify(detail)
            }
            toast.error(msg)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#fafafa] pt-28 pb-20 px-6 lg:px-12">
            <div className="max-w-[1600px] mx-auto">
                <div className="mb-12 border-b border-gray-200 pb-8 focus-content">
                    <h1 className="font-display text-4xl md:text-5xl text-gray-900 italic mb-3">Brand Dashboard</h1>
                    <p className="text-gray-500 font-light">Manage your merchandise · <span className="text-black font-medium">{user.user_id}</span></p>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-10 overflow-x-auto scrollbar-hide focus-content">
                    <button
                        className={`pb-4 text-sm tracking-widest uppercase font-medium transition-colors whitespace-nowrap border-b-2 ${tab === 'products' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setTab('products')}
                    >
                        <Package size={16} className="inline mr-2 -mt-0.5" /> My Products
                    </button>
                    <button
                        className={`pb-4 text-sm tracking-widest uppercase font-medium transition-colors whitespace-nowrap border-b-2 ${tab === 'upload' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setTab('upload')}
                    >
                        <Upload size={16} className="inline mr-2 -mt-0.5" /> Upload Product
                    </button>
                </div>

                {/* Products */}
                {tab === 'products' && (
                    <div className="focus-content">
                        {loading ? (
                            <div className="flex justify-center py-32">
                                <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-32 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <Package size={48} strokeWidth={1} className="mx-auto mb-6 text-gray-300" />
                                <h2 className="font-display text-2xl text-gray-900 mb-2">No products yet</h2>
                                <p className="text-gray-500 font-light text-sm">Upload your first item to start selling.</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-12"
                            >
                                {/* Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Total Products', val: products.length },
                                        { label: 'Active', val: products.filter(p => p.is_active !== false).length },
                                        { label: 'Removed', val: products.filter(p => p.is_active === false).length },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
                                            <p className="font-display text-4xl text-gray-900 mb-2">{s.val}</p>
                                            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-medium">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                    {products.map((p) => {
                                        const pid = p.ID || p.id || p.product_id
                                        const name = p.ProductDisplayName || p.productdisplayname || p['Product Display Name'] || p.name || `Product #${pid}`
                                        const img = p.ImagePath || p.imagepath || p.image || ''
                                        const act = p.is_active !== false

                                        return (
                                            <div key={pid} className="group cursor-pointer bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow relative" onClick={() => setDetailProduct(p)}>
                                                <div className="aspect-[3/4] bg-gray-50 overflow-hidden relative">
                                                    {img ? (
                                                        <img src={img} alt={name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!act ? 'grayscale opacity-60' : ''}`} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                                                    )}

                                                    {/* Status Badge */}
                                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold backdrop-blur-sm shadow-sm">
                                                        {act ? (
                                                            <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active</>
                                                        ) : (
                                                            <><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Removed</>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col h-[140px] justify-between">
                                                    <div>
                                                        <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-1.5 font-medium">{p.ArticleType || p.articletype}</p>
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">{name}</p>
                                                    </div>

                                                    {/* Toggle button */}
                                                    <button
                                                        disabled={toggling === pid}
                                                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-widest font-bold uppercase border transition-colors ${act
                                                            ? 'border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                                                            : 'border-green-200 text-green-600 hover:border-green-500 hover:bg-green-50'
                                                            }`}
                                                        onClick={(e) => { e.stopPropagation(); setConfirm({ product_id: pid, is_active: act, name }) }}
                                                    >
                                                        {act ? <><X size={12} strokeWidth={3} /> Remove</> : <><Check size={12} strokeWidth={3} /> Restore</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Upload form */}
                {tab === 'upload' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl focus-content bg-white p-8 border border-gray-100 shadow-sm rounded-xl"
                    >
                        <form onSubmit={handleUpload}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {[
                                    { label: 'Product ID', key: 'product_id', type: 'number', placeholder: 'e.g. 12345' },
                                    { label: 'Display Name', key: 'productDisplayName', type: 'text', placeholder: 'Product name' },
                                    { label: 'Master Category', key: 'masterCategory', type: 'text', placeholder: 'e.g. Apparel' },
                                    { label: 'Sub Category', key: 'subCategory', type: 'text', placeholder: 'e.g. Topwear' },
                                    { label: 'Article Type', key: 'articleType', type: 'text', placeholder: 'e.g. Shirts' },
                                    { label: 'Base Colour', key: 'baseColour', type: 'text', placeholder: 'e.g. Navy Blue' },
                                    { label: 'Year', key: 'year', type: 'number', placeholder: '2024' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-1.5">
                                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-medium">{f.label}</label>
                                        <input type={f.type} value={form[f.key]} onChange={setF(f.key)}
                                            className="w-full border-b border-gray-300 py-2.5 text-gray-900 bg-transparent placeholder:text-gray-300 focus:border-black focus:outline-none transition-colors text-sm" placeholder={f.placeholder} required />
                                    </div>
                                ))}

                                {[
                                    { label: 'Gender', key: 'gender', options: GENDERS },
                                    { label: 'Season', key: 'season', options: SEASONS },
                                    { label: 'Usage', key: 'usage', options: USAGES },
                                ].map(s => (
                                    <div key={s.key} className="space-y-1.5">
                                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-medium">{s.label}</label>
                                        <select value={form[s.key]} onChange={setF(s.key)} className="w-full border-b border-gray-300 py-2.5 text-gray-900 bg-transparent focus:border-black focus:outline-none transition-colors text-sm">
                                            {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Image upload */}
                            <div className="mt-8 space-y-1.5">
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-medium">Product Image</label>
                                <div className="border border-dashed border-gray-300 hover:border-black transition-colors bg-gray-50 p-10 flex flex-col items-center justify-center cursor-pointer min-h-[160px]"
                                    onClick={() => document.getElementById('product-img').click()}>
                                    {imageFile ? (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Check size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{imageFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Upload size={20} className="text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium mb-1">Click to browse files</p>
                                            <p className="text-xs text-gray-500 font-light">JPG, PNG up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                                <input id="product-img" type="file" accept="image/*" className="hidden"
                                    onChange={e => setImageFile(e.target.files[0])} />
                            </div>

                            <div className="pt-8 mt-8 border-t border-gray-100 flex justify-end">
                                <button type="submit" disabled={uploading} className="bg-black text-white px-8 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-gray-900 transition-colors disabled:opacity-70 flex items-center gap-2">
                                    {uploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {uploading ? 'Uploading...' : 'Upload Product'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Confirmation Dialog */}
                <AnimatePresence>
                    {confirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setConfirm(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white p-8 w-full max-w-sm shadow-xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="font-display text-2xl text-gray-900 mb-3">Confirm Action</h3>
                                <p className="text-gray-500 text-sm font-light mb-6">
                                    Are you sure you want to <strong className="text-black font-medium">{confirm.is_active ? 'remove' : 'restore'}</strong> this product?
                                </p>

                                <div className="bg-gray-50 border border-gray-100 p-4 mb-8 text-sm text-center">
                                    <span className="font-medium text-gray-900 line-clamp-2">"{confirm.name}"</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setConfirm(null)} className="py-3 text-sm text-gray-600 uppercase tracking-widest font-medium hover:bg-gray-100 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={doToggle} className="py-3 text-sm bg-black text-white uppercase tracking-widest font-medium hover:bg-gray-900 transition-colors">
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Detail Modal */}
                {detailProduct && (
                    <ProductDetailModal
                        product={detailProduct}
                        onClose={() => setDetailProduct(null)}
                        showCart={false}
                        showRate={false}
                    />
                )}
            </div>
        </div>
    )
}
