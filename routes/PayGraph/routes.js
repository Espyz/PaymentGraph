'use strict'
const {getGraph, postGraph} = require('../../schemas/PayGraph/schemas')
const graph = require('../../handlers/PayGraph/handlers')
async function routes(fastify, options){
    const client = fastify.db.client
    fastify.get('/graph1/:id', {schema: getGraph}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget1(client, id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.get('/graph2/:id', {schema: getGraph}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget2(client,id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.get('/graph3/:id', {schema: getGraph}, async function (request, reply) {
        const id = request.params.id
        let data = await graph.handlerget3(client, id)

        if (data.statusCode !== 200) {
            reply.status(400);
        } else {
            reply.send(data.message)
        }
    })
    fastify.post('/graph', {schema: postGraph}, async function(request, reply) {

        let data = await graph.handlerpost(client, request)

        if (data.statusCode !== 200 && data.statusCode !== 302) {
            reply.status(400);
        } else {
            reply.send(data)
        }
    })
}

module.exports = routes