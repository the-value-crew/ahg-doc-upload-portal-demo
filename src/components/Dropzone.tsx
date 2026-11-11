import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-toastify'
import { toastConfig } from '../helpers/toast.helper'
import { FiUploadCloud, FiFileText, FiX } from 'react-icons/fi'
import Select from 'react-select'
import { DropzoneMode } from '../enums'
import { ChecklistItem, UploadRulesConfig } from '../../shared/types'
import { uploadDocumentFile } from '../services/api.client'

interface ProgressBarProps {
  progress: number
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
      className="w-full my-2 bg-gray-100 rounded-full h-2 overflow-hidden"
    >
      <div
        className="bg-[#02F1DE] h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

interface DropzoneProps {
  mode: DropzoneMode
  onFileUpload: () => void
  fileType?: number
  merchantId: string
  checklist?: ChecklistItem[]
  uploadRules?: UploadRulesConfig
}

function Dropzone({
  mode = DropzoneMode.LARGE,
  onFileUpload,
  fileType,
  merchantId,
  checklist = [],
  uploadRules,
}: DropzoneProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [selectedFile, setSelectedFile] = useState<{
    file: File
    name: string
    fileExt: string
    fileType?: number
  } | null>(null)

  const maxBytes = uploadRules?.maxBytes || 26214400
  const maxMb = Math.round(maxBytes / (1024 * 1024))

  const removeFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
  }

  const handleFileTypeChange = (resp: any) => {
    if (selectedFile) {
      setSelectedFile({
        ...selectedFile,
        fileType: resp ? resp.value : undefined,
      })
    }
  }

  const uploadFile = async () => {
    if (!selectedFile || !selectedFile.file) return

    if (!merchantId) {
      toast.error('Merchant identifier is required for upload', toastConfig)
      return
    }

    const typeToUpload = fileType || selectedFile.fileType
    if (!typeToUpload) {
      toast.error('Please select a document type before uploading', toastConfig)
      return
    }

    setUploadProgress(10)
    try {
      await uploadDocumentFile(merchantId, typeToUpload, selectedFile.file, (p) => setUploadProgress(p))
      setUploadProgress(0)
      setSelectedFile(null)
      toast.success('Document uploaded to vault', toastConfig)
      onFileUpload()
    } catch (err: any) {
      toast.error(err.message || 'Error uploading document. Please retry.', toastConfig)
      setUploadProgress(0)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((f) => {
        if (f.size > maxBytes) {
          toast.error(`File exceeds maximum size of ${maxMb}MB`, toastConfig)
          return
        }

        const chunks = f.name.split('.')
        const fileExt = chunks.pop() || ''
        const name = chunks.join('.')

        if (uploadRules?.acceptedExtensions && uploadRules.acceptedExtensions.length > 0) {
          const extWithDot = `.${fileExt.toLowerCase()}`
          if (!uploadRules.acceptedExtensions.map((e) => e.toLowerCase()).includes(extWithDot)) {
            toast.error(`File extension ${extWithDot} is not supported`, toastConfig)
            return
          }
        }

        setSelectedFile({
          file: f,
          name,
          fileExt,
          fileType: fileType || undefined,
        })
      })
    },
    [fileType, maxBytes, maxMb, uploadRules]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  // Select dropdown options built dynamically from checklist
  const categoryOptions = checklist.map((item) => ({
    value: item.type,
    label: `${item.name}${item.required ? ' (Required)' : ''}`,
  }))

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
          <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center mb-4">
            <FiUploadCloud className="w-7 h-7 text-[#065F46]" />
          </div>

          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">Upload Document</h3>

          <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
            <span className="hidden md:inline">Drag and drop file here or click to browse</span>
            <span className="md:hidden">Tap to browse and upload</span>
          </p>

          <p className="text-sm text-gray-500 max-w-md">
            Supported: PDF, DOC, DOCX, CSV, XLS, XLSX, PNG, JPG (up to {maxMb}MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <p className="text-gray-600 font-semibold text-xs flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#02F1DE] mr-2"></span>
            <span className="hidden md:inline">Drag & drop or browse</span>
            <span className="md:hidden">Upload</span>
          </p>
        </div>
      )}
    </div>
  )

  if (mode === DropzoneMode.SMALL) {
    if (selectedFile) {
      return (
        <div className="relative overflow-hidden rounded-full border border-gray-300 hover:border-[#10B981] bg-white shadow-2xs px-3.5 py-1.5 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 overflow-hidden min-w-0">
              <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <FiFileText className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <p
                className="text-xs font-semibold text-gray-800 truncate max-w-[110px] md:max-w-[170px]"
                title={`${selectedFile.name}.${selectedFile.fileExt}`}
              >
                {`${selectedFile.name}.${selectedFile.fileExt}`}
              </p>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={removeFile}
                disabled={uploadProgress > 0}
                className="p-1 text-gray-400 hover:text-black transition-colors rounded-full disabled:opacity-30"
                title="Remove"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={uploadFile}
                disabled={uploadProgress > 0}
                className="bg-[#02F1DE] text-black font-bold hover:bg-[#00dbc9] disabled:opacity-40 disabled:cursor-not-allowed text-xs px-3.5 py-1.5 rounded-full transition-all shadow-sm"
              >
                {uploadProgress > 0 ? `${uploadProgress}%` : 'Upload'}
              </button>
            </div>
          </div>

          {/* Integrated progress bar - seamlessly clipped by rounded-full overflow-hidden */}
          {uploadProgress > 0 && (
            <div
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
              className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden"
            >
              <div
                className="bg-[#02F1DE] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="rounded-full border-2 border-dashed border-gray-300 hover:border-[#10B981] bg-white transition-colors shadow-2xs">
        {fileUploadUi}
      </div>
    )
  }

  // Large Mode (Express Upload Section)
  const fileSubmitUiLarge = (
    <div className="max-w-xl mx-auto my-4 p-2">
      {!fileType && (
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
            Select Document Category *
          </label>
          <Select
            isClearable={true}
            isSearchable={true}
            onChange={handleFileTypeChange}
            options={categoryOptions}
            placeholder="Choose document type..."
            className="text-sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
            <FiFileText className="w-4 h-4 text-gray-800" />
          </div>

          <div className="overflow-hidden">
            <p
              className="text-xs font-bold text-[#1A1A1A] truncate max-w-xs"
              title={`${selectedFile ? `${selectedFile.name}.${selectedFile.fileExt}` : ''}`}
            >
              {selectedFile ? `${selectedFile.name}.${selectedFile.fileExt}` : ''}
            </p>
            <span className="text-[10px] text-gray-500">Ready for encrypted submission</span>
          </div>
        </div>

        <button
          type="button"
          onClick={removeFile}
          disabled={uploadProgress > 0}
          className="p-1 text-gray-400 hover:text-black transition-colors rounded-full"
          title="Remove"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={removeFile}
          disabled={uploadProgress > 0}
          className="text-gray-600 bg-gray-100 hover:bg-gray-200 font-semibold rounded-lg text-sm px-4 py-2 transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={uploadFile}
          disabled={!selectedFile || (!fileType && !selectedFile.fileType) || uploadProgress > 0}
          className="bg-[#02F1DE] text-black font-bold hover:bg-[#00dbc9] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm px-6 py-2 transition-all shadow-sm flex items-center"
        >
          {uploadProgress > 0 ? `Uploading (${uploadProgress}%)...` : 'Submit Document'}
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={`rounded-2xl border-2 border-dashed transition-colors shadow-2xs ${
        selectedFile ? 'border-[#10B981] bg-white' : 'border-gray-300 hover:border-[#10B981] bg-white'
      }`}
    >
      {selectedFile ? fileSubmitUiLarge : fileUploadUi}
    </div>
  )
}

export default Dropzone
