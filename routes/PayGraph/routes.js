'use strict'
const graph = require('../../handlers/PayGraph/handlers')
async function routes(fastify, options){
    const client = fastify.db.client
    fastify.get('/graph1/:id', {schema: {
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
        }}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget1(client, id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.get('/graph2/:id', {schema: {
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
        }}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget2(client,id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.get('/graph3/:id', {schema: {
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
        }}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget3(client, id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.post('/graph', {schema: {
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
        }}, async function(request, reply) {
        let data = await graph.handlerpost(client, request)
        if (data.statusCode !== 200 && data.statusCode !== 302) {
            reply.status(400);
        } else {
            reply.send(data)
        }
    })
}

module.exports = routes
