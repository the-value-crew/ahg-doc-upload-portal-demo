import { FileStatus, FileTypes } from '../enums'

export interface StatsData {
  pending: number
  confirmed: number
  required: number
  rejected?: number
}

export interface UploadTableData {
  fileType: FileTypes
  status: FileStatus
  filename?: string
  createdAt?: number
}
