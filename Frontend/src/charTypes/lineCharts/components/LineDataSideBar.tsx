import React, { useContext } from 'react'
import { ChartContext } from '../../../globalUtilities/chartContext'
import DividerWithText from '../../../globalComponents/spacing_and_headers/DividerWithText'
import CustomInputField from '../../../globalComponents/fields/CustomInputField'
import DataPointGrid from '../../../globalComponents/DataPointGrid'
import {
  getLineFromKey,
  updateTitleLine
} from '../../../globalUtilities/dotInteractionUtility'
import { deleteLine, handleLineAdd } from '../utilities/contextUtility'
import DropDownMenu, { type DropDownOption } from '../../../globalComponents/fields/DropDownMenu'

const LineDataSideBar: React.FC = () => {
  const { selectedLine, setSelectedLine, lines, setLines } = useContext(ChartContext)
  return (
        <div className="w-full overflow-x-hidden">
            <div>
                <div className="pr-8">
                    <DropDownMenu
                        title="选择折线"
                        options={lines}
                        onChange={setSelectedLine}
                        onDelete={(option: DropDownOption) => { deleteLine(option.key, setSelectedLine, selectedLine, lines, setLines) }}
                        onAdd={() => { return handleLineAdd(lines, setLines) }}
                        value={getLineFromKey(selectedLine, lines)?.title}
                        emptyText='Select a Line'
                    />
                </div>

            </div>
            { selectedLine !== undefined && <div>
                <DividerWithText text="折线信息"/>
                <div>
                    <CustomInputField
                        title="折线标题"
                        type="text"
                        value={getLineFromKey(selectedLine, lines)?.title}
                        onChange={(val: string) => { updateTitleLine(val, selectedLine, setLines, lines) }}
                    />
                </div>
                    <div>
                        <DividerWithText text="折线数据点"/>
                        <DataPointGrid/>
                    </div>
                    <div className='h-8'/>
                </div>
            }
        </div>
  )
}

export default LineDataSideBar
