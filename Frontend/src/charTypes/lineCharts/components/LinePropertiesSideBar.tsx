import React, { useContext, useState } from 'react'
import { ChartContext } from '../../../globalUtilities/chartContext'
import CustomInputField from '../../../globalComponents/fields/CustomInputField'
import DividerWithText from '../../../globalComponents/spacing_and_headers/DividerWithText'
import AdvancedButton from '../../../globalComponents/Buttons/AdvancedButton'
import TelescopeLabels from '../../../globalComponents/fields/TelescopeLabels'

const LinePropertiesSideBar: React.FC = () => {
  const { title, description, setDescription, setTitle, xTitle, xAxisLabels, yAxisLabels, setXAxisLabels, setYAxisLabels, setXTitle, yTitle, setYTitle, X1, setX1, X2, setX2, Y1, setY1, Y2, setY2, scaleY, scaleX } = useContext(ChartContext)
  const [advancedX, setAdvancedX] = useState<boolean>(false)
  const [advancedY, setAdvancedY] = useState<boolean>(false)

  return (
        <div className="w-full h-full overflow-x-hidden">
            <DividerWithText text="轴线校对"/>
            <div className="w-full pl-5 grid grid-cols-3 gap-x-2 mb-1.5">
                <div>
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
                </div>
                <div>
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
            <div className='w-full mt-1'>
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
            <DividerWithText text="附加信息"/>
          <div>
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
