import React, { useContext, useEffect, useState } from 'react'
import { getNextFreeNumber, handleLineAdd } from '../../charTypes/lineCharts/utilities/contextUtility'
import { type DataPoint, type Position } from '../../types'
import { ChartContext } from '../../globalUtilities/chartContext'
import { ModeConfigurationContext } from '../../globalUtilities/modeConfigurationContext'
import { ImageContext } from '../../globalUtilities/imageContext'
import { getRemoteData } from '../../api/axiosRequests'
import LoadingIndicatorConfig from '../spacing_and_headers/LoadingIndicatorConfig'
import { enqueueSnackbar } from 'notistack'
import { v4 as uuidv4 } from 'uuid'
import { calculatePositionOnPage } from '../../globalUtilities/calculationUtility'
import CustomInputField from '../fields/CustomInputField'

interface Props {
  scale: number
  localSvgRef: React.RefObject<SVGSVGElement>
}
const AIFeatures: React.FC<Props> = ({ scale, localSvgRef }) => {
  const { lines, setLines, setSelectedLine, imageSrc } = useContext(ChartContext)
  const { saveHistory } = useContext(ModeConfigurationContext)
  const { imageWidth, imageHeight, originalImageHeight, originalImageWidth, setPos } = useContext(ImageContext)
  const scaleY = imageHeight / originalImageHeight
  const scaleX = imageWidth / originalImageWidth
  const [toggleMenu, setToggleMenu] = useState<boolean>(false)
  const [remoteData, setRemoteData] = useState<Array<Array<{ x: number, y: number }>>>([])
  const [indexSelected, setIndexSelected] = useState<number>()
  const [positionMenu, setPositionMenu] = useState<Position>({ xVal: 0, yVal: 0 })
  const [sliderValue, setSliderValue] = useState(20)
  const [extractedPoints, setExtractedPoints] = useState<DataPoint[]>([])
  const [lineTitle, setLineTitle] = useState<string>('')
  const [modelSelectOpen, setModelSelectOpen] = useState<boolean>(false) // 控制模型选择窗口
  const [selectedModel, setSelectedModel] = useState<string>('LineFormer') // 默认选择LineFormer

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSliderValue(Number(event.target.value))
  }
  useEffect(() => {
    setLineTitle('Line ' + getNextFreeNumber(lines))
  }, [indexSelected])

  useEffect(() => {
    if (imageSrc === '') return
    setIndexSelected(undefined)
    setToggleMenu(false)
    setExtractedPoints([])
    setRemoteData([])

    // 打开模型选择窗口而不是直接发送请求
    setModelSelectOpen(true)
  }, [imageSrc])

  // 处理模型选择后的确认操作
  const handleModelConfirm = (): void => {
    setModelSelectOpen(false) // 关闭模型选择窗口
    const remoteFetcher = async (): Promise<void> => {
      const remoteData = await getRemoteData(imageSrc)
      if (remoteData !== undefined) {
        setRemoteData(remoteData)
      } else {
        throw new Error('failed')
      }
    }
    remoteFetcher().then(() => {}).catch(() => {
      enqueueSnackbar('AI处理失败', { variant: 'error' })
    })
  }

  useEffect(() => {
    if (remoteData.length === 0 || indexSelected === undefined) return
    if (indexSelected > remoteData.length - 1) return
    const array = remoteData[indexSelected]
    let output
    if (sliderValue >= array.length) {
      output = array
    } else {
      const ticks = Math.round(array.length / sliderValue)
      const result: Array<{ x: number, y: number }> = []
      for (let i = 0; i < array.length; i += ticks) {
        if (i >= array.length) break
        result.push(array[i])
      }
      output = result
    }
    const dataPointsArray: DataPoint[] = output.map(({ x, y }, index) => {
      return { xVal: x * scaleX, yVal: y * scaleY, key: uuidv4() }
    })
    setExtractedPoints(dataPointsArray)
  }, [indexSelected, sliderValue, remoteData])
  const handleAdd = (): void => {
    saveHistory()
    setIndexSelected(undefined)
    setToggleMenu(false)
    setExtractedPoints([])
    const tempAdded = handleLineAdd(lines, setLines, extractedPoints)
    setSelectedLine(tempAdded.key)
    enqueueSnackbar('新线段已添加')
  }

  const handleMouseDown = (event: any, index: number): void => {
    event.preventDefault()
    if (localSvgRef.current == null) return
    setToggleMenu(true)
    setIndexSelected(index)
    setPositionMenu(calculatePositionOnPage(localSvgRef, event))
  }
  const handleMouseMove = (event: any): void => {
    if (localSvgRef.current == null || localSvgRef.current.parentNode == null) return
    setPos(calculatePositionOnPage(localSvgRef, event))
  }
  const menuRenderer = (): React.ReactNode => {
    return (
        <div className="z-40 bg-sidegrey rounded-[1.25rem] w-full justify-center bg-opacity-75 items-center bg-[conic-gradient(at_bottom,_var(--tw-gradient-stops))] from-grey via-neutral to-darkgrey">
          <div className="h-1.5" />
          <div className="pt-4 px-4 pb-2">
            <label htmlFor="slider" className="text-charcoal">数据点数量</label>
            <input id="slider" type="range" min="2" max="100" value={sliderValue} onChange={handleSliderChange}
                   className="slider w-full" />
          </div>
          <CustomInputField
              title="Line Title"
              type="text"
              value={lineTitle}
              onChange={setLineTitle}
          />
          <div className="flex justify-center items-center py-4">
            <button onClick={handleAdd} className="bg-blue font-medium border-[1.5px] border-charcoal border-solid py-1 px-6 rounded text-charcoal text-base">
              添加折线
            </button>
          </div>
        </div>
    )
  }

  // 模型选择窗口渲染
  const modelSelectorRenderer = (): React.ReactNode => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-80">
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
              确认
            </button>
            <button
              onClick={() => { setModelSelectOpen(false) }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAllLines = (): React.ReactNode => {
    const colors = ['#57A773', '#5698D4', '#D9D9D9', '#E0AFA0', '#153243']
    return remoteData.map((line, index) => {
      const opacity = indexSelected === index ? 0.3 : 1
      const currentColor = colors[index % colors.length]
      return (<g key={uuidv4()}>
        <g className="automaticLines">
             <polyline
                  fill="none"
                  stroke={currentColor}
                  strokeWidth={1.4 * scale}
                  strokeOpacity={opacity}
                  points={line.map((point) => `${point.x * scaleX},${point.y * scaleY}`).join(' ')}
                  onMouseDown={(e) => {
                    handleMouseDown(e, index)
                  }}
              />
          {
            extractedPoints.map((point, pointIndex) => {
              return <circle
                    key={`circle-${pointIndex}`}
                    cx={point.xVal}
                    cy={point.yVal}
                    r={1.3 * scale}
                    strokeWidth={0.65 * scale}
                    stroke={'#153243'}
                    style={{ pointerEvents: 'none' }}
                    fill="#AEAEB4"
                />
            })
          }
        </g>
      </g>)
    })
  }

  return (
      <div className='flex h-full w-full items-center justify-center'
           onMouseMove={handleMouseMove}
      >
        <div style={{ position: 'relative', width: imageWidth, height: imageHeight, overflow: 'visible' }}>
                  {/* 模型选择弹窗 */}
                  {modelSelectOpen && modelSelectorRenderer()}

                  <div className={`absolute ${remoteData.length === 0 ? '' : 'hidden'}`}>
                  <LoadingIndicatorConfig/>
                  </div>
              <div className={`${remoteData.length === 0 ? 'hidden' : ''}`} style={{ position: 'absolute', width: imageWidth, height: imageHeight, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
                <svg
                    className="absolute w-full h-full cursor-crosshair"
                     viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                    style={{ overflow: 'visible' }}
                     onContextMenu={(e) => {
                       e.preventDefault()
                     }}>
                  <rect x="0" y="0" width={imageWidth} height={imageHeight} fillOpacity={0.5} fill='#000000' />
                  {renderAllLines()}
                </svg>
          </div>
          {toggleMenu &&
              <div className='absolute' style={{
                transform: `translate(${positionMenu.xVal + 16}px, ${positionMenu.yVal + 16}px)`
              }}>
            {menuRenderer()}
          </div>}
        </div>
      </div>)
}

export default AIFeatures
