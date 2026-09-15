import { ERCFile } from "../interfaces"
import {
    mockVerifyUid,
    mockGetUserFiles,
    mockGetFileUploadUrl,
    mockUploadFileToS3,
    mockDownloadFile
} from "../services/mock.service"

export const verifyUid = async (uid: string) => {
    return await mockVerifyUid(uid);
}

export const getUserFiles = async () => {
    return await mockGetUserFiles();
}

export const getFileUploadUrl = async (file: ERCFile) => {
    return await mockGetFileUploadUrl(file);
}

export const uploadFileToS3 = async (
    url: string,
    file: ERCFile,
    uploadProgressCallback: (progress: number) => void,
    uploadCompleteCallback: () => void
) => {
    return await mockUploadFileToS3(url, file, uploadProgressCallback, uploadCompleteCallback);
}

export const downloadFile = async (filename: string) => {
    return await mockDownloadFile(filename);
}