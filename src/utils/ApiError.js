class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack = ""
    ){
        super(message)
        this.statusCode=statusCode
        this.data = null // This is the assignment
        this.messag=message
        this.success=false
        this.errors=errors

        // checking the stack is available or not
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}