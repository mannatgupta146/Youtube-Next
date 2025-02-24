class ApiResponse {
    constructor(statusCode, message = "Success", data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;  // ✅ Now properly defined
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
