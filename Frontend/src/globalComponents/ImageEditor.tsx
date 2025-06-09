import React, { useContext, useEffect, useState } from 'react'
import { ChartContext } from '../globalUtilities/chartContext'
import { ImageContext } from '../globalUtilities/imageContext'
import { ModeConfigurationContext } from '../globalUtilities/modeConfigurationContext'
import OCRFeatures from './EditorModes/OCRFeatures'
import CirclePlacerFeatures from './EditorModes/CirclePlacerFeatures'
import AIFeatures from './EditorModes/AIFeatures'
import ColorFilterFeatures from './EditorModes/ColorFilterFeatures'
import LoadingIndicatorConfig from './spacing_and_headers/LoadingIndicatorConfig'
import { getRemoteData } from '../api/axiosRequests'
import { enqueueSnackbar } from 'notistack'

const ImageEditor: React.FC = () => {
  const { imageHeight, imageWidth } = useContext(ImageContext)
  const { imageSrc } = useContext(ChartContext)
  const { configuration } = useContext(ModeConfigurationContext)
  const scale = 2 * Math.max(imageHeight, imageWidth) / 2.7 / 100
  const localSvgRef = React.createRef<SVGSVGElement>()
  // 状态管理模型选择和AI处理过程
  const [showModelSelector, setShowModelSelector] = useState<boolean>(false)
  const [selectedModel, setSelectedModel] = useState<string>('LineFormer')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [remoteData, setRemoteData] = useState<Array<Array<{ x: number, y: number }>>>([])

  // 当进入autoTool模式时显示模型选择窗口
  useEffect(() => {
    if (configuration.autoTool && !aiLoading) {
      setShowModelSelector(true)
    } else {
      setShowModelSelector(false)
    }
  }, [configuration.autoTool, aiLoading])

  const handleModelConfirm = (): void => {
    setShowModelSelector(false)
    if (imageSrc === '') return

    // 开始AI处理
    setAiLoading(true)

    const fetchData = async (): Promise<void> => {
      try {
        const result = await getRemoteData(imageSrc)
        if (result != null) {
          setRemoteData(result)
          enqueueSnackbar('AI处理完成!', { variant: 'success' })
        }
      } catch (error) {
        enqueueSnackbar('AI处理失败', { variant: 'error' })
      } finally {
        setAiLoading(false)
      }
    }

    void fetchData()
  }

  // 模型选择窗口渲染
  const modelSelectorRenderer = (): React.ReactNode => {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl w-80 z-50">
          <h3 className="text-lg font-medium mb-4 text-center">选择AI识别模型</h3>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <input
                type="radio"
                id="lineFormer"
                name="aiModel"
                value="LineFormer"
                checked={selectedModel === 'LineFormer'}
                onChange={() => { setSelectedModel('LineFormer') }}
                className="mr-2"
              />
              <label htmlFor="lineFormer" className="text-gray-700">LineFormer</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="lineEx"
                name="aiModel"
                value="LineEX"
                checked={selectedModel === 'LineEX'}
                onChange={() => { setSelectedModel('LineEX') }}
                className="mr-2"
              />
              <label htmlFor="lineEx" className="text-gray-700">LineEx</label>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={handleModelConfirm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              开始生成
            </button>
            <button
              onClick={() => {
                setShowModelSelector(false)
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
        {/* 半透明遮罩层 */}
        <div className="absolute inset-0 bg-black bg-opacity-30 z-40"></div>
      </div>
    )
  }

  return (
        <div className="relative grid items-center h-full w-full">
            <div className="w-full flex items-center justify-center" >
                <img
                    alt="selected chart"
                    src={imageSrc}
                    className="z-0 absolute w-full h-full"
                    draggable="true"
                    onDragStart={(e) => { e.preventDefault() }}
                    style={{ height: imageHeight, width: imageWidth }}
                />
            </div>
            <div className='absolute w-full h-full flex justify-center items-center'>
                <div className="relative pointer-events-none" style={{ height: imageHeight, width: imageWidth }}>
                    <div className='absolute w-full h-full flex justify-center items-center'>
                    </div>
                    <div className='absolute w-full h-full flex justify-center items-center'>
                    </div>
                    <div className='absolute w-full h-full flex justify-center items-center'>
                    </div>
                </div>
            </div>
            <svg ref={localSvgRef}
                 className="absolute cursor-crosshair"
                 viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                 style={{ height: imageHeight, width: imageWidth, overflow: 'visible' }}
            />
            <div className={`absolute h-full w-full ${configuration.ocrTool ? '' : 'hidden'}`}>
                <OCRFeatures localSvgRef={localSvgRef} />
            </div>
            <div className={`absolute w-full h-full ${configuration.circlePlacer ? '' : 'hidden'}`}>
                <CirclePlacerFeatures scale={scale} localSvgRef={localSvgRef} />
            </div>
            <div className={`absolute w-full h-full ${configuration.colorFilter ? '' : 'hidden'}`}>
                <ColorFilterFeatures/>
            </div>
            <div className={`absolute w-full h-full ${configuration.autoTool ? '' : 'hidden'}`}>
                <AIFeatures scale={scale} localSvgRef={localSvgRef} remoteData={remoteData}
                setRemoteData={setRemoteData}/>
            </div>
            {/* 模型选择窗口（当autoTool激活时显示） */}
            {showModelSelector && modelSelectorRenderer()}
            {/* AI加载指示器 */}
            {aiLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-30">
                <LoadingIndicatorConfig />
              </div>
            )}
        </div>
  )
}

export default ImageEditor
