import React, { useState, useEffect, useRef, useContext } from 'react'
import { ChartContext } from '../../globalUtilities/chartContext'

const ColorFilterFeatures: React.FC = () => {
  const { imageSrc } = useContext(ChartContext)
  const [active, setActive] = useState(true)
  const [threshold, setThreshold] = useState(50)
  const [selectedColor, setSelectedColor] = useState({ r: 255, g: 0, b: 0 })
  const [filteredImageUrl, setFilteredImageUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 预设颜色选项
  const colorOptions = [
    { name: '红色', r: 255, g: 0, b: 0 },
    { name: '绿色', r: 0, g: 255, b: 0 },
    { name: '蓝色', r: 0, g: 0, b: 255 },
    { name: '黄色', r: 255, g: 255, b: 0 },
    { name: '青色', r: 0, g: 255, b: 255 },
    { name: '紫色', r: 128, g: 0, b: 128 }
  ]

  // 处理图像颜色过滤
  const applyColorFilter = () => {
    if (imageSrc == null || canvasRef.current == null) return
    setProcessing(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const image = new Image()
    image.src = imageSrc

    image.onload = () => {
      // 设置画布尺寸与图像相同
      canvas.width = image.width
      canvas.height = image.height

      // 绘制原始图像到画布
      ctx?.drawImage(image, 0, 0)

      // 获取图像像素数据
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)

      if (imageData == null) {
        setProcessing(false)
        return
      }

      const data = imageData.data

      // 遍历所有像素
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // 计算当前像素颜色与选定颜色的距离
        const distance = Math.sqrt(
          Math.pow(r - selectedColor.r, 2) +
          Math.pow(g - selectedColor.g, 2) +
          Math.pow(b - selectedColor.b, 2)
        )

        // 根据阈值确定像素最终颜色
        if (distance <= threshold) {
          // 在颜色范围内 - 设为黑色
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
        } else {
          // 在颜色范围外 - 设为白色
          data[i] = 255
          data[i + 1] = 255
          data[i + 2] = 255
        }
      }

      // 将处理后的图像数据放回画布
      ctx?.putImageData(imageData, 0, 0)

      // 转换为数据URL并更新状态
      setFilteredImageUrl(canvas.toDataURL())
      setProcessing(false)
    }
  }

  // 当选择颜色或阈值变化时重新应用过滤器
  useEffect(() => {
    if (active && imageSrc) {
      applyColorFilter()
    }
  }, [selectedColor, threshold, active, imageSrc])

  // 组件卸载时清除处理结果
  useEffect(() => {
    return () => {
      setFilteredImageUrl(null)
    }
  }, [])

  // 显示覆盖层的函数
  const toggleFilter = () => {
    setActive(!active)
    if (active) {
      setFilteredImageUrl(null)
    } else if (imageSrc) {
      applyColorFilter()
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* 颜色过滤处理结果覆盖层 */}
      {filteredImageUrl && active && (
        <div className="absolute inset-0">
          <img
            src={filteredImageUrl}
            alt="Filtered Overlay"
            className="w-full h-full opacity-70 pointer-events-none"
            draggable="false"
          />
        </div>
      )}
      {/* 用于图像处理的隐藏画布 */}
      <canvas ref={canvasRef} className="hidden" />
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            颜色选择
          </label>
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map((color, index) => (
              <button
                key={index}
                onClick={() => setSelectedColor(color)}
                className={`p-2 rounded text-xs h-10 flex flex-col items-center justify-center
                  ${selectedColor.r === color.r && selectedColor.g === color.g && selectedColor.b === color.b
                    ? 'ring-2 ring-blue-500'
                    : 'hover:bg-gray-100'}`}
                style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
                title={color.name}
              >
                <span
                  className={`${(color.r + color.g + color.b) > 300 ? 'text-black' : 'text-white'}`}
                >
                  {color.name}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center mt-2">
            <div
              className="w-6 h-6 rounded border mr-2"
              style={{ backgroundColor: `rgb(${selectedColor.r},${selectedColor.g},${selectedColor.b})` }}
            />
            <div className="text-xs">
              RGB({selectedColor.r},{selectedColor.g},{selectedColor.b})
            </div>
          </div>
        </div>
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
            <span>高</span>
            <span>中</span>
            <span>低</span>
          </div>
        </div>
        <button
          onClick={applyColorFilter}
          disabled={processing}
          className="mt-2 w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 transition-colors flex justify-center"
        >
          {processing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : '应用过滤'}
        </button>
        <div className="mt-3 text-xs text-gray-600">
          <p>• 颜色过滤会将选定颜色范围内的区域显示为黑色</p>
          <p>• 阈值越高，颜色匹配范围越广</p>
        </div>
      </div>
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
