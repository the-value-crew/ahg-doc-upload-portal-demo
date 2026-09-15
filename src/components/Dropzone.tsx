import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { IconContext } from "react-icons"
import { toast } from 'react-toastify';
import { validateFile } from '../helpers/file.helper'
import { toastConfig } from "../helpers/toast.helper"
import { FiUploadCloud, FiFileText, FiX } from "react-icons/fi"
import Select from 'react-select'
import FileTypes, { DropzoneMode, IndustryType } from "../enums"
import { fileTypeSelectOptionsByIndustry } from '../helpers/file.helper';
import { ERCFile } from '../interfaces';
import { getFileUploadUrl, uploadFileToS3 } from '../helpers/api.helper';

interface ProgressBarProps { progress: number }
function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="w-full my-2 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
                className="bg-[#02F1DE] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
}

interface DropzoneProps {
    mode: DropzoneMode,
    onFileUpload: Function,
    fileType?: FileTypes,
    industry?: IndustryType
}

function Dropzone({ mode = DropzoneMode.LARGE, onFileUpload, fileType, industry = IndustryType.PEPTIDE }: DropzoneProps) {
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [file, setFile] = useState<ERCFile | null>(null)

    const removeFile = () => {
        setFile(null)
        setUploadProgress(0)
    }

    const handleFileTypeChange = (resp: any) => {
        if (file) {
            setFile({
                ...file,
                fileType: resp ? resp.value : null
            });
        }
    }

    const uploadFile = async () => {
        if (!(file && file.file)) return;

        // 1. get url
        setUploadProgress(1)
        let fileToUpload = fileType ? { ...file, fileType } : file
        let url = await getFileUploadUrl(fileToUpload);
        if (!url) {
            toast.error('Error initiating upload. Please retry.', toastConfig)
            setFile(null)
            setUploadProgress(0)
            return
        }

        // 2. upload
        setUploadProgress(10)
        const handleUploadProgress = (p: any) => setUploadProgress(p)
        const handleUploadComplete = () => {
            setUploadProgress(0)
            setFile(null)
            toast.success('Document uploaded to AHG Pay vault', toastConfig)
            onFileUpload()
        }
        await uploadFileToS3(url, fileToUpload, handleUploadProgress, handleUploadComplete)
    }

    // drop event
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            // validate
            let errorMessage = validateFile(file);
            if (errorMessage) {
                toast.error(errorMessage, toastConfig);
                return;
            }

            // save file info
            const chunks = file.name.split('.');
            const fileExt = chunks.pop() || '';
            const name = chunks.join('.');
            if (name && fileExt) setFile({ file, name, fileType: fileType || null, contentType: file.type, fileExt })
        })
    }, [fileType])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    const fileUploadUi = (
        <div
            {...getRootProps()}
            className={`w-full h-full cursor-pointer transition-all ${
                isDragActive ? 'bg-[#ECFDF5] border-[#02F1DE]' : ''
            } ${mode === DropzoneMode.LARGE ? 'py-12 px-6' : 'py-2 px-4'}`}
        >
            <input {...getInputProps()} />
            {mode === DropzoneMode.LARGE ? (
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border-2 border-[#02F1DE] flex items-center justify-center mb-4 shadow-xs">
                        <IconContext.Provider value={{ className: "stroke-[#065F46] w-7 h-7" }}>
                            <FiUploadCloud />
                        </IconContext.Provider>
                    </div>

                    <p className="font-bold text-xl md:text-2xl mb-2 text-[#1A1A1A]">
                        <span className="hidden md:inline">Drag & drop merchant files, or browse</span>
                        <span className="md:hidden">Tap to browse and upload</span>
                    </p>

                    <p className="text-sm text-[#4B5563] max-w-md">
                        Supported: PDF, DOC, DOCX, CSV, XLS, XLSX, PNG, JPG (up to 50MB)
                    </p>
                </div>
            ) : (
                <div className="flex items-center justify-center">
                    <p className="text-[#4B5563] font-semibold text-xs flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#02F1DE] mr-2"></span>
                        <span className="hidden md:inline">Drag & drop or browse</span>
                        <span className="md:hidden">Upload</span>
                    </p>
                </div>
            )}
        </div>
    );

    const fileSubmitUi = (
        <div className={`${mode === DropzoneMode.LARGE ? 'max-w-xl mx-auto my-8 p-4' : 'm-1 md:m-0'}`}>
            {/* select file category if in large dropzone */}
            {mode === DropzoneMode.LARGE && !fileType ? (
                <div className="mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
                        Select Document Category *
                    </label>
                    <Select
                        isClearable={true}
                        isSearchable={true}
                        onChange={handleFileTypeChange}
                        options={fileTypeSelectOptionsByIndustry(industry)}
                        placeholder="Choose document type..."
                        className="text-sm"
                    />
                </div>
            ) : null}

            {/* selected file row */}
            <div className={`flex items-center justify-between bg-white border border-[#E5E7EB] ${mode === DropzoneMode.LARGE ? 'rounded-xl p-3.5' : 'rounded-full px-3.5 py-1.5'} shadow-xs`}>
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`${mode === DropzoneMode.LARGE ? 'p-2 rounded-lg' : 'w-7 h-7 rounded-full flex items-center justify-center'} bg-[#F3F4F6] border border-[#E5E7EB]`}>
                        <IconContext.Provider value={{ className: "stroke-[#1A1A1A] w-3.5 h-3.5" }}>
                            <FiFileText />
                        </IconContext.Provider>
                    </div>

                    {file && (
                        <div className="overflow-hidden">
                            <p
                                className={`text-xs font-bold text-[#1A1A1A] truncate ${
                                    mode === DropzoneMode.SMALL ? 'max-w-[110px] md:max-w-[180px]' : 'max-w-xs'
                                }`}
                                title={`${file.name}.${file.fileExt}`}
                            >
                                {`${file.name}.${file.fileExt}`}
                            </p>
                            {mode === DropzoneMode.LARGE && (
                                <span className="text-[10px] text-[#6B7280]">
                                    Ready for encrypted submission
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={removeFile}
                        disabled={uploadProgress > 0}
                        className="p-1 text-[#6B7280] hover:text-[#1A1A1A] transition-colors rounded-full"
                        title="Remove"
                    >
                        <FiX />
                    </button>

                    {mode === DropzoneMode.SMALL && (
                        <button
                            type="button"
                            onClick={uploadFile}
                            disabled={uploadProgress > 0}
                            className="bg-[#02F1DE] text-[#000000] font-bold hover:bg-[#00dbc9] disabled:opacity-40 disabled:cursor-not-allowed text-xs px-3.5 py-1.5 rounded-full transition-all shadow-sm"
                        >
                            {uploadProgress > 0 ? `${uploadProgress}%` : 'Upload'}
                        </button>
                    )}
                </div>
            </div>

            {/* Progressbar */}
            {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}

            {/* action buttons for large mode */}
            {mode === DropzoneMode.LARGE && (
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={removeFile}
                        disabled={uploadProgress > 0}
                        className="text-[#4B5563] bg-[#F3F4F6] hover:bg-[#E5E7EB] font-semibold rounded-lg text-sm px-4 py-2 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={uploadFile}
                        disabled={!file || (!fileType && !file.fileType) || uploadProgress > 0}
                        className="bg-[#02F1DE] text-[#000000] font-bold hover:bg-[#00dbc9] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm px-6 py-2 transition-all shadow-sm flex items-center"
                    >
                        {uploadProgress > 0 ? `Encrypting & Uploading (${uploadProgress}%)...` : 'Submit Document'}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className={`${mode === DropzoneMode.LARGE ? 'rounded-2xl' : 'rounded-full'} border-2 border-dashed transition-colors ${
            file ? 'border-[#10B981] bg-white' : 'border-[#D1D5DB] hover:border-[#10B981] bg-white'
        } shadow-xs`}>
            {file ? fileSubmitUi : fileUploadUi}
        </div>
    );
}

export default Dropzone;