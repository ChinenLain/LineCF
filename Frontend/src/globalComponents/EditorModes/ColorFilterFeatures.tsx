import React, { useState, useEffect, useRef, useContext } from 'react'
import { ChartContext } from '../../globalUtilities/chartContext'
import { ImageContext } from '../../globalUtilities/imageContext'

interface Props {
  setImageUrl: any
  setColorOpen: any
}

interface ColorOption {
  name: string
  r: number
  g: number
  b: number
}

const ColorFilterFeatures: React.FC<Props> = ({ setImageUrl, setColorOpen }) => {
  const { imageSrc } = useContext(ChartContext)
  const { imageWidth, imageHeight, originalImageWidth, originalImageHeight } = useContext(ImageContext)
  const scaleY = imageHeight / originalImageHeight
  const scaleX = imageWidth / originalImageWidth
  const [active, setActive] = useState(true)
  const [threshold, setThreshold] = useState(50)
  const [selectedColor, setSelectedColor] = useState<ColorOption>({ name: '红色', r: 255, g: 0, b: 0 })
  const [filteredImageUrl, setFilteredImageUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 新增状态管理
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState<ColorOption>({ name: '自定义', r: 0, g: 0, b: 0 })
  const [isColorPicking, setIsColorPicking] = useState(false)
  const [colorPreview, setColorPreview] = useState<{r: number, g: number, b: number} | null>(null)
  
  // 使用额外canvas进行颜色拾取
  const colorPickerCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // 从localStorage加载自定义颜色
  const loadCustomColors = () => {
    const savedColors = localStorage.getItem('customColors')
    return savedColors ? JSON.parse(savedColors) : []
  }
  
  // 初始化颜色选项（预设+自定义）
  const [colorOptions, setColorOptions] = useState<ColorOption[]>(() => {
    const presetColors = [
      { name: '红色', r: 255, g: 0, b: 0 },
      { name: '绿色', r: 0, g: 255, b: 0 },
      { name: '蓝色', r: 0, g: 0, b: 255 },
      { name: '黄色', r: 255, g: 255, b: 0 },
      { name: '青色', r: 0, g: 255, b: 255 },
      { name: '紫色', r: 128, g: 0, b: 128 }
    ]
    const customColors = loadCustomColors()
    return [...presetColors, ...customColors]
  })

  // 处理图像颜色过滤
  const applyColorFilter = () => {
    if (imageSrc == null || canvasRef.current == null) return
    setProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const image = new Image()
    image.crossOrigin = 'Anonymous'
    image.src = imageSrc

    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      ctx?.drawImage(image, 0, 0)

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      if (imageData == null) {
        setProcessing(false)
        return
      }

      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const distance = Math.sqrt(
          Math.pow(r - selectedColor.r, 2) +
          Math.pow(g - selectedColor.g, 2) +
          Math.pow(b - selectedColor.b, 2)
        )

        if (distance <= threshold) {
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
        } else {
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        }
      }

      ctx?.putImageData(imageData, 0, 0)
      const filtered = canvas.toDataURL()
      setFilteredImageUrl(filtered)
      setProcessing(false)
      setImageUrl(filtered)
    }
  }

  // 设置颜色拾取模式
  const startColorPicking = () => {
    if (!imageSrc) return
    
    setIsColorPicking(true)
    
    // 设置一个短暂的延迟确保canvas创建完成
    setTimeout(() => {
      if (!colorPickerCanvasRef.current) return
      
      const canvas = colorPickerCanvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return
      
      // 创建一个临时的图像对象
      const tempImage = new Image()
      tempImage.crossOrigin = 'Anonymous'
      tempImage.src = imageSrc
      
      tempImage.onload = () => {
        // 设置canvas尺寸为临时图像的尺寸
        canvas.width = tempImage.width
        canvas.height = tempImage.height
        
        // 绘制图像到canvas
        ctx.drawImage(tempImage, 0, 0)
      }
    }, 100)
  }

  // 处理鼠标在图像上移动时的颜色预览
  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isColorPicking || !colorPickerCanvasRef.current) return
    
    const canvas = colorPickerCanvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // 计算鼠标在canvas上的相对位置
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 确保坐标在canvas范围内
    if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 获取鼠标所在位置的像素数据
    const pixel = ctx.getImageData(x, y, 1, 1).data
    
    // 更新颜色预览
    setColorPreview({ r: pixel[0], g: pixel[1], b: pixel[2] })
  }

  // 处理鼠标点击选择颜色
  const handleImageClick = (e: React.MouseEvent) => {
    if (!isColorPicking || !colorPreview) return
    
    // 创建新的颜色选项
    const newColor = { 
      name: `拾取 #${colorPreview.r.toString(16).padStart(2, '0')}${colorPreview.g.toString(16).padStart(2, '0')}${colorPreview.b.toString(16).padStart(2, '0')}`.toUpperCase(),
      ...colorPreview 
    }
    
    // 添加到颜色选项中
    const newColorOptions = [...colorOptions, newColor]
    setColorOptions(newColorOptions)
    
    // 设置为当前选中的颜色
    setSelectedColor(newColor)
    
    // 保存到localStorage（排除预设颜色）
    const customOnly = newColorOptions.filter(color => 
      !color.name.match(/红|绿|蓝|黄|青|紫/)
    )
    localStorage.setItem('customColors', JSON.stringify(customOnly))
    
    // 退出拾取模式
    setIsColorPicking(false)
    setColorPreview(null)
  }

  // 保存自定义颜色
  const saveCustomColor = () => {
    // 更新颜色列表
    const newColorOptions = [...colorOptions, customColor]
    setColorOptions(newColorOptions)
    
    // 保存到localStorage（排除预设颜色）
    const customOnly = newColorOptions.filter(color => 
      !color.name.match(/红|绿|蓝|黄|青|紫/)
    )
    localStorage.setItem('customColors', JSON.stringify(customOnly))
    
    // 选择新添加的颜色
    setSelectedColor(customColor)
    setShowColorPicker(false)
    
    // 重置自定义颜色输入
    setCustomColor({ name: '新颜色', r: 0, g: 0, b: 0 })
  }

  // 删除自定义颜色
  const deleteCustomColor = (index: number) => {
    if (index < 6) return // 防止删除预设颜色
    
    const newColorOptions = [...colorOptions]
    newColorOptions.splice(index, 1)
    setColorOptions(newColorOptions)
    
    // 保存更新后的自定义颜色
    const customOnly = newColorOptions.filter(color => 
      !color.name.match(/红|绿|蓝|黄|青|紫/)
    )
    localStorage.setItem('customColors', JSON.stringify(customOnly))
    
    // 如果删除的是当前选中的颜色，切换到第一个预设
    if (selectedColor === colorOptions[index]) {
      setSelectedColor(colorOptions[0])
    }
  }

  // 应用滤镜的effect
  useEffect(() => {
    if (active && imageSrc) {
      applyColorFilter()
    }
  }, [selectedColor, threshold, active, imageSrc])

  // 显示覆盖层的函数
  const toggleFilter = () => {
    setActive(!active)
    setColorOpen(active)
    if (active) {
      setFilteredImageUrl(null)
      setImageUrl(null)
    } else if (imageSrc) {
      applyColorFilter()
    }
  }

  // 关闭拾取模式
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isColorPicking) {
        setIsColorPicking(false)
        setColorPreview(null)
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isColorPicking])

  return (
    <div className="flex h-full w-full items-center justify-center"
         style={{ pointerEvents: 'auto' }}
    >
      {/* 用于颜色拾取处理的隐藏画布 */}
      <canvas ref={colorPickerCanvasRef} className="hidden" />
      
      {/* 用于图像处理的隐藏画布 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 颜色过滤处理结果覆盖层 */}
      {filteredImageUrl && active && !isColorPicking && (
        <div
          className="absolute"
          style={{
            position: 'absolute',
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          <img
            src={filteredImageUrl}
            alt="Filtered Overlay"
            className="pointer-events-none"
            style={{
              width: originalImageWidth * scaleX,
              height: originalImageHeight * scaleY,
              opacity: 0.7
            }}
            draggable="false"
          />
        </div>
      )}
      
      {/* 颜色拾取覆盖层 */}
      {isColorPicking && (
        <div 
          className="absolute inset-0 z-30"
          onMouseMove={handleImageMouseMove}
          onClick={handleImageClick}
          style={{ 
            cursor: 'crosshair',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* 原始图像用于拾取 */}
          {imageSrc && (
            <img 
              src={imageSrc}
              alt="Original for color picking"
              style={{
                width: originalImageWidth * scaleX,
                height: originalImageHeight * scaleY,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          )}
          
          {/* 颜色预览指示器 */}
          {colorPreview && (
            <div className="fixed z-40 pointer-events-none" 
                 style={{
                   left: 'calc(100% - 200px)',
                   top: '20px',
                   backgroundColor: `rgba(${colorPreview.r}, ${colorPreview.g}, ${colorPreview.b}, 0.8)`,
                   padding: '10px',
                   borderRadius: '8px',
                   boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                   color: (colorPreview.r * 0.299 + colorPreview.g * 0.587 + colorPreview.b * 0.114) > 186 ? 'black' : 'white'
                 }}
            >
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded border mr-3 border-white border-2"
                  style={{ backgroundColor: `rgb(${colorPreview.r}, ${colorPreview.g}, ${colorPreview.b})` }}
                />
                <div>
                  <div className="font-bold">拾取颜色</div>
                  <div>RGB: {colorPreview.r}, {colorPreview.g}, {colorPreview.b}</div>
                  <div className="text-xs">点击图像选择颜色，按ESC取消</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 控制面板 */}
      <div className="absolute right-4 top-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-xl z-20 w-64">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">颜色过滤</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={toggleFilter}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:absolute after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
        
        {/* 颜色选择区域 */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              颜色选择
            </label>
            <div>
              <button 
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mr-1"
                onClick={startColorPicking}
              >
                拾取
              </button>
              <button 
                className="text-xs text-blue-500 hover:text-blue-700"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                {showColorPicker ? '取消' : '添加'}
              </button>
            </div>
          </div>
          
          {/* 自定义颜色表单 */}
          {showColorPicker && (
            <div className="mb-3 p-2 bg-gray-100 rounded">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-xs text-gray-600">名称</label>
                  <input
                    type="text"
                    value={customColor.name}
                    onChange={(e) => setCustomColor({...customColor, name: e.target.value})}
                    className="w-full p-1 text-xs border rounded"
                    placeholder="颜色名称"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">RGB</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={customColor.r}
                      onChange={(e) => setCustomColor({...customColor, r: parseInt(e.target.value) || 0})}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="R"
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={customColor.g}
                      onChange={(e) => setCustomColor({...customColor, g: parseInt(e.target.value) || 0})}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="G"
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={customColor.b}
                      onChange={(e) => setCustomColor({...customColor, b: parseInt(e.target.value) || 0})}
                      className="w-1/3 p-1 text-xs border rounded"
                      placeholder="B"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 border rounded mr-2" 
                    style={{ backgroundColor: `rgb(${customColor.r}, ${customColor.g}, ${customColor.b})` }}
                  />
                  <span className="text-xs">{customColor.name}</span>
                </div>
                <button
                  onClick={saveCustomColor}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          )}
          
          {/* 颜色选项网格 */}
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map((color, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => setSelectedColor(color)}
                  className={`p-2 rounded text-xs h-10 w-full flex flex-col items-center justify-center relative
                    ${selectedColor.r === color.r && selectedColor.g === color.g && selectedColor.b === color.b
                      ? 'ring-2 ring-blue-500'
                      : 'hover:bg-gray-100'}`}
                  style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
                  title={color.name}
                >
                  <span
                    className={`${(color.r + color.g + color.b) > 400 ? 'text-black' : 'text-white'} truncate max-w-full`}
                  >
                    {color.name}
                  </span>
                </button>
                
                {/* 删除按钮（仅限自定义颜色） */}
                {index >= 6 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCustomColor(index)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除颜色"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* 当前颜色显示 */}
          <div className="flex items-center mt-2">
            <div
              className="w-6 h-6 rounded border mr-2"
              style={{ backgroundColor: `rgb(${selectedColor.r},${selectedColor.g},${selectedColor.b})` }}
            />
            <div className="text-xs">
              {selectedColor.name} (RGB: {selectedColor.r},{selectedColor.g},{selectedColor.b})
            </div>
          </div>
        </div>
        
        {/* 阈值滑块 */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            颜色阈值: {threshold}
          </label>
          <input
            type="range"
            min="0"
            max="150"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>严格</span>
            <span>中等</span>
            <span>宽松</span>
          </div>
        </div>
        
        {/* 应用按钮 */}
        <button
          onClick={applyColorFilter}
          disabled={processing || isColorPicking}
          className="mt-2 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 transition-colors flex justify-center"
        >
          {processing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : '应用过滤'}
        </button>
        
        {/* 使用说明 */}
        <div className="mt-3 text-xs text-gray-600">
          <p>• 颜色过滤会将选定颜色范围内的区域显示为黑色</p>
          <p>• 阈值越高，颜色匹配范围越广</p>
        </div>
      </div>
      
      {/* 处理中遮罩 */}
      {processing && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-4 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2">正在处理图像...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorFilterFeatures