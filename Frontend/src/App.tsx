import React, { useRef, useState } from 'react'
import './App.css'
import Header from './globalComponents/Header'
import Editor from './globalComponents/Editor'
import Sidebar from './globalComponents/Sidebar'
import { ChartContext } from './globalUtilities/chartContext'
import { type Line, type PositionCalibration, type PositionText, type PositionAxisID, type AppState } from './types'
import { DEFAULT_AXIS_TEXT, DEFAULT_CAL_POINT } from './constants/mainTypesDefaults'
import { type scaleTypes } from './constants/chartTypes'
import {
  type configurationTypes,
  modeConfigDefaults,
  ModeConfigurationContext
} from './globalUtilities/modeConfigurationContext'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import { v4 as uuidv4 } from 'uuid'
import { SnackbarProvider } from 'notistack'

const App: React.FC = () => {
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [xTitle, setXTitle] = useState<string>('')
  const [yTitle, setYTitle] = useState<string>('')
  const [xAxisLabels, setXAxisLabels] = useState<PositionAxisID[]>([{ ...DEFAULT_AXIS_TEXT, id: uuidv4() }])
  const [yAxisLabels, setYAxisLabels] = useState<PositionAxisID[]>([{ ...DEFAULT_AXIS_TEXT, id: uuidv4() }])
  const [imageSrc, setImageSrc] = useState<string>('')
  const [lines, setLines] = useState<Line[]>([])
  const [selectedLine, setSelectedLine] = useState<string | undefined>()
  const [X1, setX1] = useState<PositionCalibration>(DEFAULT_CAL_POINT)
  const [X2, setX2] = useState<PositionCalibration>(DEFAULT_CAL_POINT)
  const [Y1, setY1] = useState<PositionCalibration>(DEFAULT_CAL_POINT)
  const [Y2, setY2] = useState<PositionCalibration>(DEFAULT_CAL_POINT)
  const [scaleX, setScaleX] = useState<scaleTypes>('linear')
  const [scaleY, setScaleY] = useState<scaleTypes>('linear')
  const [dragOCR, setDragOCR] = useState<boolean>(false)
  const [OCRText, setOCRText] = useState<PositionText[]>([])
  const [configuration, setConfiguration] = useState<configurationTypes>({ circlePlacer: true, ocrTool: false, colorFilter: false, autoTool: false })
  const [draggingElement, setDraggingElement] = useState<string>()
  const [accessibleMode, setAccessibleMode] = useState<boolean>(false)

  // 撤销/重做
  // 使用数组存历史记录
  const undoHistory = useRef<AppState[]>([])
  const redoHistory = useRef<AppState[]>([])
  // 保存当前状态到历史记录
  const saveHistory = (): void => {
    const tempHistory = [...undoHistory.current, getAppState()]
    redoHistory.current = []
    if (tempHistory.length > 40) {
      tempHistory.shift()
    }
    undoHistory.current = tempHistory
  }

  const [toggleDataSidebar, setToggleDataSidebar] = useState(false)

  const svgRef = React.createRef<SVGSVGElement>()

  const updateConfiguration = (key: string): void => {
    setDraggingElement(undefined)
    setConfiguration(() => ({
      ...modeConfigDefaults.configuration,
      [key]: true
    }))
  }

  // 状态恢复
  // 用Promise确保所有状态更新完成后再执行回调
  const setAppState = (element: AppState, callBack: () => void): void => {
    const complete = async (): Promise<void> => {
      await Promise.all([
        new Promise<void>((resolve) => { setImageSrc(element.imageSrc); resolve() }),
        new Promise<void>((resolve) => { setTitle(element.title); resolve() }),
        new Promise<void>((resolve) => { setXTitle(element.xTitle); resolve() }),
        new Promise<void>((resolve) => { setYTitle(element.yTitle); resolve() }),
        new Promise<void>((resolve) => { setXAxisLabels(element.xAxisLabels); resolve() }),
        new Promise<void>((resolve) => { setYAxisLabels(element.yAxisLabels); resolve() }),
        new Promise<void>((resolve) => { setX1(element.X1); resolve() }),
        new Promise<void>((resolve) => { setX2(element.X2); resolve() }),
        new Promise<void>((resolve) => { setY1(element.Y1); resolve() }),
        new Promise<void>((resolve) => { setY2(element.Y2); resolve() }),
        new Promise<void>((resolve) => { setScaleX(element.scaleX); resolve() }),
        new Promise<void>((resolve) => { setScaleY(element.scaleY); resolve() }),
        new Promise<void>((resolve) => { setDragOCR(element.dragOCR); resolve() }),
        new Promise<void>((resolve) => { setOCRText(element.OCRText); resolve() }),
        new Promise<void>((resolve) => { setConfiguration(element.configuration); resolve() }),
        new Promise<void>((resolve) => { setDraggingElement(element.draggingElement); resolve() }),
        new Promise<void>((resolve) => { setSelectedLine(element.selectedLine); resolve() }),
        new Promise<void>((resolve) => { setLines(element.lines); resolve() }),
        new Promise<void>((resolve) => { setDescription(element.description); resolve() }),
        new Promise<void>((resolve) => { setAccessibleMode(element.accessibleMode); resolve() })
      ])
      if (svgRef.current != null) {
        svgRef.current.innerHTML = ''
      }
    }
    complete()
      .then(() => {
        callBack()
      })
      .catch(() => {})
  }

  // 获取当前全部状态
  const getAppState = (): AppState => {
    return {
      title,
      xTitle,
      yTitle,
      xAxisLabels,
      yAxisLabels,
      lines,
      selectedLine,
      X1,
      X2,
      Y1,
      Y2,
      scaleX,
      scaleY,
      OCRText,
      dragOCR,
      configuration,
      draggingElement,
      svgRef,
      imageSrc,
      description,
      accessibleMode
    }
  }

  /// 界面 ///
  return (
        // 用Context提供全局数据
        <ChartContext.Provider
            value={{
              title,
              setTitle,
              xTitle,
              setXTitle,
              yTitle,
              setYTitle,
              xAxisLabels,
              setXAxisLabels,
              yAxisLabels,
              setYAxisLabels,
              lines,
              setLines,
              selectedLine,
              setSelectedLine,
              X1,
              setX1,
              X2,
              setX2,
              Y1,
              setY1,
              Y2,
              setY2,
              imageSrc,
              setImageSrc,
              scaleX,
              setScaleX,
              scaleY,
              setScaleY,
              description,
              setDescription
            }}>
        <div className="relative flex flex-col h-screen w-screen font-inter overflow-hidden touch-none">
            {/* 消息提示组件容器 */}
            <SnackbarProvider/>
            <ModeConfigurationContext.Provider value={{
              OCRText,
              setOCRText,
              configuration,
              updateConfiguration,
              setConfiguration,
              dragOCR,
              setDragOCR,
              draggingElement,
              setDraggingElement,
              svgRef,
              saveHistory,
              undoHistory,
              redoHistory,
              getAppState,
              setAppState,
              toggleDataSidebar,
              setToggleDataSidebar,
              accessibleMode,
              setAccessibleMode
            }}>
                {/* 拖拽功能区域 */}
                <DndProvider backend={HTML5Backend}>
                    {/* OCR模式时的灰色遮罩 */}
                    <div
                        className={`absolute w-full h-full z-30 ${dragOCR ? 'bg-charcoal opacity-[0.35]' : ''} pointer-events-none`}
                    />
                    {/* 顶部导航栏 */}
                    <Header />
                    {/* 主内容区：有图片时显示编辑器，否则显示上传提示 */}
                    <div className={`${imageSrc !== '' ? '' : 'hidden'} flex flex-row flex-grow overflow-hidden w-full`}>
                                <Editor/>
                            <div className="h-full">
                                <Sidebar/>
                            </div>
                    </div>
                   <div className={`${imageSrc !== '' ? 'hidden' : ''} h-full flex w-full justify-center items-center text-charcoal`}>
                        请上传图片以开始
                    </div>
                </DndProvider>

            </ModeConfigurationContext.Provider>
        </div>
        </ChartContext.Provider>
  )
}

export default App
