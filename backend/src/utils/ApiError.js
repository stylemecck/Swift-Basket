class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        if (this.stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructoe)
        }
    }
}

export { ApiError };