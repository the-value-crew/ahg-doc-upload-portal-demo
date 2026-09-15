import { FileStatus, FileTypes } from "../enums"

export interface StatsData {
    pending: number,
    confirmed: number
    required: number
}

export interface UploadTableData {
    fileType: FileTypes,
    status: FileStatus,
    filename?: string,
    createdAt?: number
}

export interface FileInfo {
    name: string,
    iframeLink: string,
    section: string,
    description?: string,
    formUrl?: string,
    isExternalForm?: boolean,
    isSignatureDoc?: boolean
}

export interface IndustrySection {
    id: string,
    title: string,
    description: string,
    fileTypes: FileTypes[]
}

export interface ERCFile {
    file: File
    name: string
    fileType: FileTypes | null
    fileExt: string
    contentType: string
}