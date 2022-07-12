const allTodos = {
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'name', 'createdAt', 'important', 'dueDate', "done"],
                properties: {
                    id:{
                        type: 'string',
                        format: 'uuid'
                    },
                    name:{
                        type: 'string'
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time'
                    },
                    important:{
                        type: 'boolean'
                    },
                    dueDate:{
                        type: 'string',
                        format: 'date-time'
                    },
                    done:{
                        type: 'boolean'
                    },
                }
            }
        },
        400: {
            type: 'object',
            properties: {
                message: {type: 'string'},
                statusCode: {type: 'integer'}
            }
        }
    }
}
const addTodo = {
    body: {
        type: 'object',
        required: ['name'],
        properties: {
            name: {type: 'string',},
            dueDate: {type: 'string', format: 'date-time', nullable: true, default: null},
            important: {type: 'boolean', default: false},
        }
    },
    response: {
        201: {
            type: 'object',
            properties: {
                created: {type: 'boolean'}
            }
        },
        400:{
            type:'object',
            properties:{
                message:{type:'string'},
                statusCode:{type:'integer'}
            }
        }
    }

}
const updateTodo = {
    body: {
        type: 'object',
        properties: {
            important: {type: 'boolean'},
            dueDate: {type: 'string', format: 'date-time', nullable: true},
            done: {type: 'boolean'},
            id: {type: 'string', format: 'uuid'}
        }
    },
    response:{
        400:{
            type:'object',
            properties:{
                message:{type:'string'},
                statusCode:{type:'integer'}
            }
        }
    }
}
const deleteTodo = {
    params: {
        type: 'object',
        properties: {
            id: {type: 'string', format: 'uuid'}
        }
    },
    response:{
        400:{
            type:'object',
            properties:{
                message:{type:'string'},
                statusCode:{type:'integer'}
            }
        }
    }
}
module.exports = {allTodos, addTodo, updateTodo, deleteTodo}
