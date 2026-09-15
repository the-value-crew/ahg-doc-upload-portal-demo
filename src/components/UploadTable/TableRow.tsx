import { FileStatus } from "../../enums/index"
import { IconContext } from "react-icons"
import { FiChevronDown, FiChevronUp, FiUploadCloud, FiX, FiFileText, FiDownload, FiExternalLink, FiEdit3 } from "react-icons/fi"
import StatusBadge from "./StatusBadge"
import { timestampToStr } from "../../helpers/date.helper"
import { UploadTableData } from "../../interfaces"
import { fileInfoByType } from "../../helpers/file.helper"
import { useState } from "react"
import Dropzone from "../Dropzone"
import { DropzoneMode } from '../../enums'
import { downloadFile } from "../../helpers/api.helper"

interface TableRowProps {
    rowData: UploadTableData
    generic: boolean
    onFileUpload: Function
}

function TableRow({ rowData, onFileUpload, generic }: TableRowProps) {
    const [expanded, setExpanded] = useState<boolean>(false)
    const [dropzoneVisibility, setDropzoneVisibility] = useState(false)
    const info = fileInfoByType(rowData.fileType)

    return (
        <>
            <tr className={`border-b border-[#F3F4F6] transition-colors ${expanded ? 'bg-[#F9FAFB]' : 'bg-white hover:bg-[#FAFAFA]'}`}>
                {/* Document Name & Description */}
                <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full mt-0.5 shrink-0 border flex items-center justify-center ${
                            info.isSignatureDoc ? 'bg-[#EFF6FF] border-[#BFDBFE]' : 'bg-[#F3F4F6] border-[#E5E7EB]'
                        }`}>
                            <IconContext.Provider value={{ className: `w-4 h-4 ${info.isSignatureDoc ? 'stroke-[#1D4ED8]' : 'stroke-[#1A1A1A]'}` }}>
                                {info.isSignatureDoc ? <FiEdit3 /> : <FiFileText />}
                            </IconContext.Provider>
                        </div>
                        <div>
                            <div className="flex items-center flex-wrap gap-2">
                                {rowData.status === FileStatus.REQUIRED ? (
                                    <span className="font-bold text-sm text-[#1A1A1A]">
                                        {info.name}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => rowData.filename ? downloadFile(rowData.filename) : null}
                                        className="font-bold text-sm text-[#1A1A1A] hover:text-[#000000] text-left underline flex items-center gap-1.5"
                                        title="Download Document"
                                    >
                                        <span>{info.name}</span>
                                        <FiDownload className="inline w-3.5 h-3.5 text-[#6B7280]" />
                                    </button>
                                )}

                                {info.isSignatureDoc && (
                                    <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-full">
                                        Signature Doc
                                    </span>
                                )}

                                {info.isExternalForm && (
                                    <span className="text-[10px] font-bold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                                        Google Form
                                    </span>
                                )}
                            </div>

                            {info.description && (
                                <p className="text-xs text-[#4B5563] mt-0.5 line-clamp-1">
                                    {info.description}
                                </p>
                            )}
                        </div>
                    </div>
                </td>

                {/* Status */}
                {!generic ? (
                    <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={rowData.status} />
                    </td>
                ) : null}

                {/* Upload or Uploaded Date */}
                <td className="py-4 px-4">
                    {rowData.status === FileStatus.REQUIRED ? (
                        <div className="flex items-center gap-2 max-w-md">
                            <div className="flex-1">
                                <Dropzone
                                    mode={DropzoneMode.SMALL}
                                    onFileUpload={() => onFileUpload()}
                                    fileType={rowData.fileType}
                                />
                            </div>
                            {info.formUrl && (
                                <a
                                    href={info.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A1A1A] bg-[#F3F4F6] hover:bg-[#E5E7EB] px-3 py-1.5 rounded-full border border-[#E5E7EB] transition-colors shrink-0"
                                    title="Open online form"
                                >
                                    <span>Form</span>
                                    <FiExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3 text-xs text-[#4B5563] font-medium">
                            {dropzoneVisibility ? (
                                <div className="flex items-center gap-2 w-full max-w-xs">
                                    <Dropzone
                                        mode={DropzoneMode.SMALL}
                                        onFileUpload={() => {
                                             setDropzoneVisibility(false)
                                             onFileUpload()
                                        }}
                                        fileType={rowData.fileType}
                                    />
                                    <button
                                        onClick={() => setDropzoneVisibility(false)}
                                        className="w-7 h-7 flex items-center justify-center rounded-full text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors"
                                        title="Cancel Re-upload"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span>
                                        {rowData.createdAt ? `Uploaded: ${timestampToStr(rowData.createdAt)}` : 'Uploaded'}
                                    </span>
                                    <div className="flex items-center space-x-1.5">
                                        <button
                                            onClick={() => setDropzoneVisibility(true)}
                                            className="inline-flex items-center space-x-1 text-xs font-bold text-[#1A1A1A] bg-[#F3F4F6] hover:bg-[#E5E7EB] px-3 py-1.5 rounded-full transition-colors border border-[#E5E7EB]"
                                            title="Re-upload replacement document"
                                        >
                                            <FiUploadCloud className="w-3.5 h-3.5 stroke-[#1A1A1A]" />
                                            <span>Replace</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </td>

                {/* Caret / Expand info */}
                <td className="py-4 px-4 text-right">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        title="Document Guidelines"
                        className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] rounded-full transition-colors"
                    >
                        <IconContext.Provider value={{ className: "w-5 h-5" }}>
                            {expanded ? <FiChevronUp /> : <FiChevronDown />}
                        </IconContext.Provider>
                    </button>
                </td>
            </tr>

            {expanded && (
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <td colSpan={5} className="p-6">
                        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
                            <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A] flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-[#02F1DE] mr-2"></span>
                                    Underwriting Requirement: {info.name}
                                </h4>
                                {info.formUrl && (
                                    <a
                                        href={info.formUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-[#000000] bg-[#02F1DE] hover:bg-[#00dbc9] px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                                    >
                                        <span>Open External Form</span>
                                        <FiExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                            <p className="text-xs text-[#4B5563] leading-relaxed mb-3">
                                {info.description} Please ensure clear, legible scans in PDF or image format. For security, files are stored in AHG Pay’s encrypted underwriting repository.
                            </p>
                            <div className="text-[11px] text-[#6B7280]">
                                Need help? Contact AHG Underwriting Support at <a href="mailto:sales@ahgpay.com" className="text-[#1A1A1A] font-bold underline">sales@ahgpay.com</a> or call <span className="font-bold text-[#1A1A1A]">+1-754-732-3744</span>.
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default TableRow;