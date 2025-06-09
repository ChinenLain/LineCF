import React, { type ChangeEvent } from 'react'
import { useContext } from 'react'
import { ChartTypes } from '../constants/chartTypes'
import { ChartContext } from '../globalUtilities/chartContext'

import { IoFolderOpenOutline } from 'react-icons/io5'
import { enqueueSnackbar } from 'notistack'
import UndoRedo from './UndoRedo'
import { DEFAULT_APP_STATE } from '../constants/mainTypesDefaults'
import { ModeConfigurationContext } from '../globalUtilities/modeConfigurationContext'

import { scaleValueToCalibration } from '../globalUtilities/dotInteractionUtility'
import { type DataPoint } from '../types'

const Header: React.FC = () => {
  const { imageSrc, setX1, setX2, setY1, setY2 } = useContext(ChartContext)
  const { setAppState } = useContext(ModeConfigurationContext)

  const { title, yTitle, xTitle, lines, X1, X2, Y1, Y2, scaleX, scaleY, description } = useContext(ChartContext)
  const getCSVData = (): string => {
    let csvData = ''
    csvData += 'Title, ' + title + '\n Description,' + description + '\n xAxis Label, ' + xTitle + '\n yAxis Label, ' + yTitle
    lines.forEach((line) => {
      csvData += '\n' + line.title + '\n'
      csvData += 'xCoordinate, yCoordinate\n'
      line.dataPoints.forEach(({ xVal, yVal }: DataPoint) => {
        const adjustedPosition = scaleValueToCalibration({ xVal, yVal }, X1, X2, Y1, Y2, scaleX, scaleY)
        csvData += `${adjustedPosition.xVal}, ${adjustedPosition.yVal}\n`
      })
    })
    return csvData
  }
  const downloadAsCSV = (): void => {
    downloadFile(getCSVData(), `${title}_export.csv`, 'text/csv;charset=utf-8;')
  }
  const downloadFile = (data: string, filename: string, fileType: string): void => {
    const blob = new Blob([data], { type: fileType })
    const url = URL.createObjectURL(blob)
    enqueueSnackbar('下载开始')
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const handleDownload = (): void => {
    try {
      downloadAsCSV()
    } catch {
      enqueueSnackbar('下载时发生错误')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files
    if ((files != null) && files.length > 0) {
      const file = files[0]
      const newImageSrc = URL.createObjectURL(file)
      setAppState({ ...DEFAULT_APP_STATE, imageSrc: newImageSrc })
      const imageTemp = new Image()
      imageTemp.src = newImageSrc
      imageTemp.onload = () => {
        const entryHeight = window.innerHeight / 1.5
        const entryWidth = window.innerWidth / 1.87
        let imageHeight: number
        let imageWidth: number
        if ((imageTemp.naturalWidth / imageTemp.naturalHeight) > 0.65 && (imageTemp.naturalWidth / imageTemp.naturalHeight) < 1.35) {
          imageHeight = entryWidth * 0.75 * imageTemp.naturalHeight / imageTemp.naturalWidth
          imageWidth = entryWidth * 0.75
        } else if (imageTemp.naturalWidth > imageTemp.naturalHeight) {
          imageHeight = entryWidth * imageTemp.naturalHeight / imageTemp.naturalWidth
          imageWidth = entryWidth
        } else {
          imageHeight = entryHeight
          imageWidth = entryHeight * imageTemp.naturalWidth / imageTemp.naturalHeight
        }
        const axisOffset = 50
        setX1({ xVal: axisOffset * 2, yVal: imageHeight - axisOffset, referenceValue: '' })
        setX2({ xVal: imageWidth - axisOffset, yVal: imageHeight - axisOffset, referenceValue: '' })
        setY1({ xVal: axisOffset, yVal: imageHeight - axisOffset * 2, referenceValue: '' })
        setY2({ xVal: axisOffset, yVal: axisOffset, referenceValue: '' })
      }
    }
    enqueueSnackbar('图片上传成功')
  }

  return (
        <header className="flex items-center justify-between border-b border-darkgrey p-2 text-center font-normal text-sm lg:text-base">
            <div className='flex items-center justify-start min-w-[30%] z-30'>
                <label className="cursor-pointer ml-5">
                    <IoFolderOpenOutline size={32} />
                    <input aria-label='folder import' type="file" accept="image/jpeg, image/png" onChange={handleFileChange} style={{ display: 'none' }}/>
                </label>
                <UndoRedo/>
            </div>
            <h1 className="absolute inset-x-0 text-center">
                {ChartTypes.LINECHART}
            </h1>
            <div className='flex items-center justify-end min-w-[30%] z-30'
            data-description='export button'>
                {
                imageSrc !== ''
                  ? <button aria-label='export button' onClick={handleDownload} className="bg-blue font-medium border-[1.5px] border-charcoal border-solid py-1 px-6 mr-6 rounded text-charcoal text-base" id='step30'>
                            导出
                        </button>
                  : <div className="opacity-0 font-medium border-[1.5px] border-solid py-1 px-6 mr-6 text-base">
                                导出
                            </div>
                    }
            </div>
        </header>
  )
}

export default Header
