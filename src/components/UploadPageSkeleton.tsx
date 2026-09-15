import ContentLoader from 'react-content-loader'

function UploadPageSkeleton() {
    return <>
        <div className="container hidden md:block">
            <ContentLoader
                speed={2}
                width={1280}
                height={800}
                viewBox="0 0 1280 800"
            >
                <rect x="7" y="23" rx="3" ry="3" width="100" height="12" />
                <rect x="9" y="48" rx="3" ry="3" width="504" height="29" />
                <circle cx="800" cy="350" r="150" />
                <rect x="9" y="104" rx="3" ry="3" width="410" height="68" />
                <rect x="9" y="250" rx="3" ry="3" width="200" height="18" />
                <rect x="9" y="300" rx="3" ry="3" width="450" height="200" />

                {/* Upload */}
                <rect x="9" y="570" rx="3" ry="3" width="200" height="18" />
                <rect x="9" y="600" rx="3" ry="3" width="1000" height="200" />
            </ContentLoader>
        </div>

        <div className="container md:hidden">
            <ContentLoader
                speed={2}
                width={1280}
                height={800}
                viewBox="0 0 1280 800"
            >
                <rect x="7" y="23" rx="3" ry="3" width="100" height="12" />
                <rect x="9" y="48" rx="3" ry="3" width="300" height="29" />
                <rect x="9" y="104" rx="3" ry="3" width="300" height="68" />
                <rect x="9" y="250" rx="3" ry="3" width="100" height="18" />
                <rect x="9" y="300" rx="3" ry="3" width="300" height="200" />
            </ContentLoader>
        </div>
    </>

}

export default UploadPageSkeleton