// Mock HTTP client to remove server-side connections
const http = {
    defaults: {
        headers: {
            common: {} as Record<string, string>
        }
    },
    get: async (_url: string) => ({ data: [] }),
    post: async (_url: string, _data?: any, _config?: any) => ({ data: {} }),
    put: async (_url: string, _data?: any, _config?: any) => ({ data: {} }),
    delete: async (_url: string) => ({ data: {} })
};

export default http;