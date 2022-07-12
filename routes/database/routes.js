'use strict'

const { allTodos, addTodo, updateTodo, deleteTodo } = require('../../schemas/database/schemas')
const database = require('../../handlers/database/handlers')

async function routes(fastify, options) {
  const client = fastify.db.client
  fastify.get('/', {schema: allTodos}, async function (request, reply) {

    let data = await database.handlerget(client)

    if (data.statusCode !== 200) {
      reply.status(400);

    } else {
      reply.send(data.message)
    }
  })

  fastify.post('/', {schema: addTodo}, async function(request, reply) {

    let data = await database.handlerpost(client, reply, request)

    if (data.statusCode !== 200) {
      reply.status(400);

    } else {
      console.log(data)
    }
  })

  fastify.patch('/outing',{schema: updateTodo}, async function (request, reply) {

    let data = await database.handlerpatch(client, request)

    if (data.statusCode !== 200) {
      reply.status(data.statusCode);
      console.log(data.message)
    } else {
      console.log(data)
    }
  })

  fastify.delete('/outing', {schema: deleteTodo}, async function(request, reply) {

    let data = await database.handlerdelete(client, request, reply)

    if (data.statusCode !== 200){
      console.log(data.message)
      reply.status(data.statusCode);
    } else {
      console.log(data)
    }
  })

}

module.exports = routes
