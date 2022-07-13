const getGraph = {
    params: {
        type: 'object',
        properties: {
            id: {type: 'string', format: 'uuid'}
        },
    },
    response:{
        200:{
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id:{
                        type: 'string',
                        format: 'uuid'
                    },
                    credit: {type: 'number'},
                    percent_rate: {type: 'number'},
                    accrued_percent: {type: 'number'},
                    date: {type:'string'}
                }
            }
        }
    }
}

const postGraph = {
    body:{
        type: 'object',
        properties: {
            credit: {type: 'number'},
            percent: {type: 'number'},
            time: {type: 'number'},
            credit_date: {type: 'string'},
            typed:{
                type: 'string',
                nullable: true,
                default: null
            },
            id:{
                type: 'string',
                nullable: true,
                default: null
            },
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                // ann: {type: 'array'},
                // dif: {type: 'array'},
                // last:{type: 'array'},
                message: {type: 'array'},
                statusCode: {type: 'integer'}
            }
        },
        302:{
            type: 'object',
            properties: {
                message:{type: 'string'},
                statusCode: {type: 'integer'}
            }
        },
        400:{
            type:'object',
            properties:{
                message:{type:'string'},
                created: {type: 'boolean'},
                statusCode:{type:'integer'}
            }
        }
    }
}

module.exports = {getGraph, postGraph}
