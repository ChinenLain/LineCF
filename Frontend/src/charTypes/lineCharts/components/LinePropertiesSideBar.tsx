import React, { useContext, useState } from 'react'
import { ChartContext } from '../../../globalUtilities/chartContext'
import CustomInputField from '../../../globalComponents/fields/CustomInputField'
import DividerWithText from '../../../globalComponents/spacing_and_headers/DividerWithText'
import SmallDropDownMenu from '../../../globalComponents/fields/SmallDropDownMenu'
import AdvancedButton from '../../../globalComponents/Buttons/AdvancedButton'
import TelescopeLabels from '../../../globalComponents/fields/TelescopeLabels'

const LinePropertiesSideBar: React.FC = () => {
  const { title, description, setDescription, setTitle, xTitle, xAxisLabels, yAxisLabels, setXAxisLabels, setYAxisLabels, setXTitle, yTitle, setYTitle, X1, setX1, X2, setX2, Y1, setY1, Y2, setY2, scaleY, scaleX, setScaleY, setScaleX, legendTitle, setLegendTitle, legendColor, setLegendColor } = useContext(ChartContext)
  const [advancedX, setAdvancedX] = useState<boolean>(false)
  const [advancedY, setAdvancedY] = useState<boolean>(false)
  const [showLegendEditor, setShowLegendEditor] = useState<boolean>(false) // 控制图例高级选项的显示

  // 常用颜色选项
  const colorOptions = [
    '#57A773', '#5698D4', '#E0AFA0', '#F6AE2D', '#AEAEB4',
    '#D9D9D9', '#153243', '#EC4E20', '#6A7FDB', '#F45B69'
  ]

  return (
        <div className="w-full h-full overflow-x-hidden">
            <DividerWithText text="轴线校对"/>
            <div className="w-full pl-5 grid grid-cols-3 gap-x-2 mb-1.5">
                <CustomInputField
                    title="X1"
                    type="number"
                    value={X1.referenceValue}
                    onChange={(val: string) => {
                      setX1({ ...X1, referenceValue: val })
                    }}
                    noPadding={true}
                    scaleType={scaleX}
                />
                <CustomInputField
                    title="X2"
                    type="number"
                    value={X2.referenceValue}
                    onChange={(val: string) => {
                      setX2({ ...X2, referenceValue: val })
                    }}
                    noPadding={true}
                    scaleType={scaleX}
                />
                <div data-description={'X scale type chooser'}>
                <SmallDropDownMenu
                    title = 'Scale X'
                    onChange={setScaleX}
                    options={[
                      { key: 'linear', title: 'linear' },
                      { key: 'logarithmic', title: 'log' },
                      { key: 'time', title: 'date' }
                    ]}
                    value={scaleX === 'logarithmic' ? 'log' : scaleX}/>
                </div>
                <CustomInputField
                    title="Y1"
                    type="number"
                    value={Y1.referenceValue}
                    onChange={(val: string) => {
                      setY1({ ...Y1, referenceValue: val })
                    }}
                    noPadding={true}
                    scaleType={scaleY}
                />
                <CustomInputField
                    title="Y2"
                    type="number"
                    value={Y2.referenceValue}
                    onChange={(val: string) => {
                      setY2({ ...Y2, referenceValue: val })
                    }}
                    noPadding={true}
                    scaleType={scaleY}
                />
                <div data-description={'Y scale type chooser'}>
                    <SmallDropDownMenu
                        title = 'Scale Y'
                        onChange={setScaleY}
                        options={[
                          { key: 'linear', title: 'linear' },
                          { key: 'logarithmic', title: 'log' },
                          { key: 'time', title: 'date' }
                        ]}
                        value={scaleY === 'logarithmic' ? 'log' : scaleY}/>
                </div>

            </div>
            <DividerWithText text="图表信息"/>
            <CustomInputField
                title="标题"
                type="text"
                value={title}
                onChange={setTitle}
            />

            <CustomInputField
                title="X轴标题"
                type="text"
                value={xTitle}
                onChange={setXTitle}
            />
            <div className={`${advancedX ? 'mb-[-1px]' : 'mb-[-10px]'}`}>
            <div data-description='advancedXEntry'>
                <AdvancedButton toggleData={advancedX} handleToggle={() => {
                  setAdvancedX(!advancedX)
                }}/>
            </div>
            {
                advancedX
                  ? <div className='mt-[-3px] rounded-md bg-neutral pb-3'>
                        {
                            <div>
                                <label className="text-[0.82rem] font-normal text-charcoal pl-3">自定义轴标签</label>
                            </div>
                        }
                        <TelescopeLabels accessor='x' fields={xAxisLabels} setFields={setXAxisLabels}/>
                    </div>
                  : null
            }
            </div>
            <CustomInputField
                title="Y轴标题"
                type="text"
                value={yTitle}
                onChange={setYTitle}
            />
            <div className={`${advancedX ? 'mb-[-1px]' : 'mb-[-10px]'}`}>
            <div className='w-full mt-1' id='step21' data-description='advancedYEntry'>
                <AdvancedButton toggleData={advancedY} handleToggle={() => {
                  setAdvancedY(!advancedY)
                }}/>
            </div>
            {
                advancedY
                  ? <div className='mt-[-3px] rounded-md bg-neutral pb-3'>
                        {
                            <div>
                                <label className="text-[0.82rem] font-normal text-charcoal pl-3">自定义轴标签</label>
                            </div>
                        }
                        <TelescopeLabels accessor='y' fields={yAxisLabels} setFields={setYAxisLabels}/>
                    </div>
                  : null
            }
            </div>
            <div className="mt-3"/>
            <DividerWithText text="图例信息"/>
            <CustomInputField
                title="图例标题"
                type="text"
                value={legendTitle}
                onChange={setLegendTitle}
            />
            <div className={`${showLegendEditor ? 'mb-[-1px]' : 'mb-[-10px]'}`}>
            <div data-description='legendColorEditor'>
                <AdvancedButton toggleData={showLegendEditor} handleToggle={() => {
                  setShowLegendEditor(!showLegendEditor)
                }}/>
            </div>
            {
                showLegendEditor && (
                  <div className='mt-[-3px] rounded-md bg-neutral pb-3'>
                    <div className="py-2">
                      <label className="text-[0.82rem] font-normal text-charcoal pl-3 mb-2">图例颜色</label>
                      <div className="flex items-center px-3 mb-2">
                        <input 
                          type="color" 
                          value={legendColor}
                          onChange={(e) => setLegendColor(e.target.value)}
                          className="w-8 h-8 cursor-pointer border-none bg-transparent"
                        />
                        <input 
                          type="text" 
                          value={legendColor}
                          onChange={(e) => setLegendColor(e.target.value)}
                          className="ml-2 text-sm p-1 border border-gray-300 rounded w-24"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1 px-3">
                        {colorOptions.map((color, index) => (
                          <div 
                            key={index} 
                            className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => setLegendColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
            }
            </div>
            <DividerWithText text="附加信息"/>
          <div id='step80'>
            <CustomInputField
            title="描述"
            type="text"
            value={description}
            onChange={setDescription}
            increaseHeight={true}
          />
          </div>

          <div className='h-8'/>
        </div>
  )
}
export default LinePropertiesSideBar
