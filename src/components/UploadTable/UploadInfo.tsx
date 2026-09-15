import { IconContext } from "react-icons"
import { RiInformationLine } from "react-icons/ri"

function UploadInfo() {
    return (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 my-6 flex items-start space-x-3 shadow-xs">
            <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg mt-0.5 shrink-0">
                <IconContext.Provider value={{ className: "fill-[#059669] w-4 h-4" }}>
                    <RiInformationLine />
                </IconContext.Provider>
            </div>
            <div className="flex flex-col">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1A1A] mb-0.5">
                    Underwriting Submission Notice
                </h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                    You can return to this secure portal anytime using your merchant reference link to replace files or upload supplemental compliance items. Submissions are reviewed continuously during standard banking hours.
                </p>
            </div>
        </div>
    );
}

export default UploadInfo;