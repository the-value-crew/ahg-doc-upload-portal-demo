import { UploadTableData } from "../../interfaces"
import TableRow from "./TableRow"
import { FileTypes } from "../../enums"
import { FiRefreshCw } from "react-icons/fi"
import { IconContext } from "react-icons"
import { useState } from "react"
import { toast } from "react-toastify"
import { toastConfig } from "../../helpers/toast.helper"

interface UploadTableProps {
    sectionKey?: string
    sectionTitle: string
    sectionDescription?: string
    fileList: UploadTableData[]
    fileTypes?: FileTypes[]
    filterFn?: (item: UploadTableData) => boolean
    generic: boolean
    onFileUpload: Function
    onRefresh: Function
}

function UploadTable({
    sectionTitle,
    sectionDescription,
    fileList,
    fileTypes,
    filterFn,
    onFileUpload,
    onRefresh,
    generic
}: UploadTableProps) {
    const tableFileList = fileTypes
        ? fileTypes.map(ft => {
            const found = fileList.find(f => f.fileType === ft);
            return found || { fileType: ft, status: 1 };
        })
        : filterFn
        ? fileList.filter(filterFn)
        : fileList;

    const [loading, setLoading] = useState<boolean>(false)
    const handleRefreshBtnClick = () => {
        setLoading(true)
        onRefresh()
        setTimeout(() => {
            setLoading(false)
            toast.success('Document status synchronized', toastConfig)
        }, 800)
    }

    return (
        <div className="mb-14">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] uppercase tracking-tight">
                        {sectionTitle}
                    </h2>
                    {sectionDescription && (
                        <p className="text-xs text-[#4B5563] mt-0.5">
                            {sectionDescription}
                        </p>
                    )}
                </div>

                <button
                    disabled={loading}
                    className={`w-9 h-9 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] transition-colors shadow-xs flex items-center justify-center ${loading ? 'animate-spin' : ''}`}
                    onClick={handleRefreshBtnClick}
                    title="Sync document statuses"
                >
                    <IconContext.Provider value={{ className: "stroke-[#1A1A1A] w-4 h-4" }}>
                        <FiRefreshCw />
                    </IconContext.Provider>
                </button>
            </div>

            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs bg-white mt-4">
                <table className="upload-table table-auto w-full">
                    <thead>
                        <tr>
                            <th className="w-1/2">
                                Document Item & Requirements
                            </th>
                            {!generic ? <th className="w-1/6">Verification</th> : null}
                            <th className="w-1/3">Submission & Vault File</th>
                            <th className="w-12 text-right"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#F3F4F6]">
                        {tableFileList.map((file: UploadTableData, index: number) => (
                            <TableRow
                                key={`${file.fileType}-${index}`}
                                rowData={file}
                                onFileUpload={() => onFileUpload()}
                                generic={generic}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UploadTable;